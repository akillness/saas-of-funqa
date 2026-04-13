import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";

const ALGORITHM = "aes-256-gcm";

function deriveKey(secret: string) {
  if (!secret) {
    throw new Error("SECRET_ENCRYPTION_KEY is required for provider-key storage.");
  }

  return createHash("sha256").update(secret).digest();
}

export type EncryptedPayload = {
  algorithm: string;
  keyVersion: string;
  nonce: string;
  authTag: string;
  ciphertext: string;
  aad: string;
};

export function encryptSecret(value: string, aad: string): EncryptedPayload {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, deriveKey(config.secretEncryptionKey), nonce);
  cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: ALGORITHM,
    keyVersion: config.secretEncryptionKeyVersion,
    nonce: nonce.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    aad
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const decipher = createDecipheriv(
    payload.algorithm,
    deriveKey(config.secretEncryptionKey),
    Buffer.from(payload.nonce, "base64")
  ) as ReturnType<typeof createDecipheriv> & {
    setAAD(buffer: Buffer): void;
    setAuthTag(buffer: Buffer): void;
  };

  decipher.setAAD(Buffer.from(payload.aad, "utf8"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]);

  return plaintext.toString("utf8");
}
