#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_PACKAGE = 'exports/google-drive/neuro-symbolic-game-story-2026-google-drive-package.zip';

function usage() {
  return `Usage:\n  node scripts/upload-google-drive-package.mjs [file|dir ...] --folder <GOOGLE_DRIVE_FOLDER_ID>\n\nInputs:\n  - Pass one or more files and/or directories. Directories upload their top-level files.\n  - Default input: ${DEFAULT_PACKAGE}\n\nAuthentication, choose one:\n  GOOGLE_OAUTH_ACCESS_TOKEN=<token>\n  GOOGLE_SERVICE_ACCOUNT_JSON='<service-account-json>'\n  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n\nNotes:\n  - Service-account uploads require the target Drive folder to be shared with the service account email.\n  - The script does not store credentials and never prints token/private-key values.\n`;
}

function parseArgs(argv) {
  const args = [...argv];
  const files = [];
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  while (args.length) {
    const arg = args.shift();
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--folder') {
      folderId = args.shift() || '';
      continue;
    }
    if (!arg?.startsWith('--')) {
      files.push(arg);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (files.length === 0) {
    files.push(DEFAULT_PACKAGE);
  }
  if (!folderId) {
    throw new Error('Missing Google Drive folder id. Pass --folder or set GOOGLE_DRIVE_FOLDER_ID.');
  }
  return { files, folderId };
}

const MIME_BY_EXT = {
  '.zip': 'application/zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
};

function mimeForFile(filePath) {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function expandInputs(inputs) {
  const resolved = [];
  for (const input of inputs) {
    const absolutePath = path.resolve(input);
    if (!existsSync(absolutePath)) {
      throw new Error(`Input does not exist: ${input}`);
    }
    const info = await stat(absolutePath);
    if (info.isDirectory()) {
      const entries = await readdir(absolutePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) resolved.push(path.join(absolutePath, entry.name));
      }
    } else {
      resolved.push(absolutePath);
    }
  }
  if (resolved.length === 0) {
    throw new Error('No files to upload after expanding inputs.');
  }
  return resolved;
}

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getServiceAccount() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  return null;
}

async function getAccessToken() {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const serviceAccount = await getServiceAccount();
  if (!serviceAccount) {
    throw new Error('Missing Google credentials. Set GOOGLE_OAUTH_ACCESS_TOKEN, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Service account JSON must include client_email and private_key.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const { createSign } = await import('node:crypto');
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token request failed (${response.status}): ${text}`);
  }
  const token = await response.json();
  return token.access_token;
}

async function uploadFile({ filePath, folderId, accessToken }) {
  const absolutePath = path.resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Upload file does not exist: ${filePath}`);
  }
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size === 0) {
    throw new Error(`Upload file is empty or not a file: ${filePath}`);
  }

  const boundary = `funqa-${Date.now().toString(36)}`;
  const mimeType = mimeForFile(absolutePath);
  const metadata = {
    name: path.basename(filePath),
    parents: [folderId],
    mimeType,
  };
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const { Readable } = await import('node:stream');
  const body = Readable.from((async function* () {
    yield prefix;
    for await (const chunk of createReadStream(absolutePath)) yield chunk;
    yield suffix;
  })());

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(prefix.length + stats.size + suffix.length),
    },
    body,
    duplex: 'half',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${text}`);
  }
  return response.json();
}

try {
  const { files, folderId } = parseArgs(process.argv.slice(2));
  const accessToken = await getAccessToken();
  const inputs = await expandInputs(files);
  const results = [];
  for (const filePath of inputs) {
    const uploaded = await uploadFile({ filePath, folderId, accessToken });
    console.error(`uploaded: ${uploaded.name} -> ${uploaded.webViewLink || uploaded.id}`);
    results.push(uploaded);
  }
  console.log(JSON.stringify({ status: 'uploaded', count: results.length, files: results }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error('\n' + usage());
  process.exit(1);
}
