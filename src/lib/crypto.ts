const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" } as const;
const AES_PARAMS = { name: "AES-GCM", length: 256 } as const;
const IV_LENGTH = 12;

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey"]);
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", binary, ECDH_PARAMS, true, []);
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    AES_PARAMS,
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(base64: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

interface StoredKeyData {
  key: CryptoKey;
  isCreator: boolean;
}

export function storePrivateKey(roomId: string, key: CryptoKey, isCreator: boolean): void {
  const keys = getKeyStore();
  keys[roomId] = { key, isCreator };
}

export function getPrivateKey(roomId: string): StoredKeyData | null {
  return getKeyStore()[roomId] ?? null;
}

export function clearPrivateKey(roomId: string): void {
  const keys = getKeyStore();
  delete keys[roomId];
}

const keyStore: Record<string, StoredKeyData> = {};
function getKeyStore(): Record<string, StoredKeyData> {
  return keyStore;
}
