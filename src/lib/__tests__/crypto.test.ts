import { describe, test, expect } from "bun:test";
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encrypt,
  decrypt,
} from "../crypto";

describe("crypto", () => {
  test("generateKeyPair creates valid keypair", async () => {
    const keyPair = await generateKeyPair();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey.type).toBe("public");
    expect(keyPair.privateKey.type).toBe("private");
  });

  test("exportPublicKey and importPublicKey are inverse operations", async () => {
    const keyPair = await generateKeyPair();
    const exported = await exportPublicKey(keyPair.publicKey);
    expect(typeof exported).toBe("string");
    expect(exported.length).toBeGreaterThan(0);

    const imported = await importPublicKey(exported);
    expect(imported.type).toBe("public");
  });

  test("deriveSharedKey produces same key for both parties", async () => {
    const aliceKeyPair = await generateKeyPair();
    const bobKeyPair = await generateKeyPair();

    const aliceShared = await deriveSharedKey(
      aliceKeyPair.privateKey,
      bobKeyPair.publicKey
    );
    const bobShared = await deriveSharedKey(
      bobKeyPair.privateKey,
      aliceKeyPair.publicKey
    );

    const testMessage = "Hello, secure world!";
    const encryptedByAlice = await encrypt(testMessage, aliceShared);
    const decryptedByBob = await decrypt(encryptedByAlice, bobShared);

    expect(decryptedByBob).toBe(testMessage);
  });

  test("encrypt produces base64 ciphertext different from plaintext", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "Secret message";
    const ciphertext = await encrypt(plaintext, sharedKey);

    expect(typeof ciphertext).toBe("string");
    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext.length).toBeGreaterThan(plaintext.length);
  });

  test("decrypt reverses encrypt", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "This is a test message with special chars: !@#$%^&*()";
    const ciphertext = await encrypt(plaintext, sharedKey);
    const decrypted = await decrypt(ciphertext, sharedKey);

    expect(decrypted).toBe(plaintext);
  });

  test("encrypt produces different ciphertext each time (random IV)", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "Same message";
    const ciphertext1 = await encrypt(plaintext, sharedKey);
    const ciphertext2 = await encrypt(plaintext, sharedKey);

    expect(ciphertext1).not.toBe(ciphertext2);

    expect(await decrypt(ciphertext1, sharedKey)).toBe(plaintext);
    expect(await decrypt(ciphertext2, sharedKey)).toBe(plaintext);
  });

  test("decrypt with wrong key throws error", async () => {
    const keyPair1 = await generateKeyPair();
    const keyPair2 = await generateKeyPair();
    const sharedKey1 = await deriveSharedKey(keyPair1.privateKey, keyPair1.publicKey);
    const sharedKey2 = await deriveSharedKey(keyPair2.privateKey, keyPair2.publicKey);

    const plaintext = "Secret message";
    const ciphertext = await encrypt(plaintext, sharedKey1);

    await expect(decrypt(ciphertext, sharedKey2)).rejects.toThrow();
  });

  test("handles unicode and emoji correctly", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "Hello 世界! 🔐🎉 Привет!";
    const ciphertext = await encrypt(plaintext, sharedKey);
    const decrypted = await decrypt(ciphertext, sharedKey);

    expect(decrypted).toBe(plaintext);
  });

  test("handles empty string", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "";
    const ciphertext = await encrypt(plaintext, sharedKey);
    const decrypted = await decrypt(ciphertext, sharedKey);

    expect(decrypted).toBe(plaintext);
  });

  test("handles long messages", async () => {
    const keyPair = await generateKeyPair();
    const sharedKey = await deriveSharedKey(keyPair.privateKey, keyPair.publicKey);

    const plaintext = "A".repeat(10000);
    const ciphertext = await encrypt(plaintext, sharedKey);
    const decrypted = await decrypt(ciphertext, sharedKey);

    expect(decrypted).toBe(plaintext);
    expect(decrypted.length).toBe(10000);
  });
});
