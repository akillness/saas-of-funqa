import { describe, it, expect } from "vitest";

// The config module reads SECRET_ENCRYPTION_KEY eagerly at import time and
// loads .env with override:false, so a pre-set process.env value wins. Set the
// key BEFORE the dynamic import so encryption uses a deterministic test secret.
process.env.SECRET_ENCRYPTION_KEY = "unit-test-secret-encryption-key-0123456789";
process.env.SECRET_ENCRYPTION_KEY_VERSION = "v-test";

const { encryptSecret, decryptSecret } = await import("./crypto.js");
const { config } = await import("../config.js");

describe("secrets/crypto", () => {
  describe("round trip", () => {
    it("decrypts back to the original plaintext", () => {
      const payload = encryptSecret("sk-provider-key-value", "tenant-a:openai");
      expect(decryptSecret(payload)).toBe("sk-provider-key-value");
    });

    it("round-trips an empty string", () => {
      const payload = encryptSecret("", "tenant-a:openai");
      expect(decryptSecret(payload)).toBe("");
    });

    it("round-trips multibyte unicode content", () => {
      const value = "한국어-키-🔐-値";
      const payload = encryptSecret(value, "tenant-한:gemini");
      expect(decryptSecret(payload)).toBe(value);
    });
  });

  describe("encrypted payload metadata", () => {
    it("uses aes-256-gcm and the configured key version", () => {
      const payload = encryptSecret("value", "aad");
      expect(payload.algorithm).toBe("aes-256-gcm");
      expect(payload.keyVersion).toBe(config.secretEncryptionKeyVersion);
      expect(payload.keyVersion).toBe("v-test");
    });

    it("preserves the provided aad and emits base64 fields", () => {
      const payload = encryptSecret("value", "tenant-x:cohere");
      expect(payload.aad).toBe("tenant-x:cohere");
      // 12-byte GCM nonce encoded as base64 is 16 chars.
      expect(payload.nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(Buffer.from(payload.nonce, "base64")).toHaveLength(12);
      expect(payload.authTag).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(Buffer.from(payload.authTag, "base64")).toHaveLength(16);
      expect(payload.ciphertext.length).toBeGreaterThan(0);
    });
  });

  describe("nonce randomness", () => {
    it("produces a distinct nonce and ciphertext for identical inputs", () => {
      const a = encryptSecret("same-value", "same-aad");
      const b = encryptSecret("same-value", "same-aad");
      expect(a.nonce).not.toBe(b.nonce);
      expect(a.ciphertext).not.toBe(b.ciphertext);
      // Both still decrypt to the same plaintext.
      expect(decryptSecret(a)).toBe(decryptSecret(b));
    });
  });

  describe("authenticated-encryption tamper detection", () => {
    it("rejects decryption when the aad is altered", () => {
      const payload = encryptSecret("value", "tenant-a:openai");
      const tampered = { ...payload, aad: "tenant-b:openai" };
      expect(() => decryptSecret(tampered)).toThrow();
    });

    it("rejects decryption when the ciphertext is altered", () => {
      const payload = encryptSecret("value", "tenant-a:openai");
      const bytes = Buffer.from(payload.ciphertext, "base64");
      bytes[0] = bytes[0] ^ 0xff;
      const tampered = { ...payload, ciphertext: bytes.toString("base64") };
      expect(() => decryptSecret(tampered)).toThrow();
    });

    it("rejects decryption when the auth tag is altered", () => {
      const payload = encryptSecret("value", "tenant-a:openai");
      const tag = Buffer.from(payload.authTag, "base64");
      tag[0] = tag[0] ^ 0xff;
      const tampered = { ...payload, authTag: tag.toString("base64") };
      expect(() => decryptSecret(tampered)).toThrow();
    });
  });

  describe("aad binding across secrets", () => {
    it("binds ciphertext to its aad so payloads are not interchangeable", () => {
      const a = encryptSecret("shared-plaintext", "aad-one");
      const b = encryptSecret("shared-plaintext", "aad-two");
      // Each decrypts correctly with its own bound aad.
      expect(decryptSecret(a)).toBe("shared-plaintext");
      expect(decryptSecret(b)).toBe("shared-plaintext");
      // Swapping the aad between payloads fails authentication.
      expect(() => decryptSecret({ ...a, aad: "aad-two" })).toThrow();
    });
  });
});
