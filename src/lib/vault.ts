import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from './codec';

export type VaultEnvelopeV1 = {
  v: 1;
  kdf: 'pbkdf2-sha256';
  iter: number;
  saltB64: string;
  ivB64: string;
  ctB64: string;
};

const DEFAULT_ITER = 310_000;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Ensure we pass a real ArrayBuffer (not ArrayBufferLike) to WebCrypto APIs.
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveVaultKeyRaw(password: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const pwdBytes = utf8ToBytes(password);
  const keyMaterial = await crypto.subtle.importKey('raw', toArrayBuffer(pwdBytes), { name: 'PBKDF2' }, false, [
    'deriveBits'
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations: iter },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function importAesKey(rawKey: Uint8Array, usages: KeyUsage[]) {
  return crypto.subtle.importKey('raw', toArrayBuffer(rawKey), { name: 'AES-GCM', length: 256 }, false, usages);
}

function randomBytes(size: number) {
  const out = new Uint8Array(size);
  crypto.getRandomValues(out);
  return out;
}

export async function sealVaultJson(password: string, json: string): Promise<VaultEnvelopeV1> {
  const iter = DEFAULT_ITER;
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const raw = await deriveVaultKeyRaw(password, salt, iter);
  const key = await importAesKey(raw, ['encrypt']);
  const pt = utf8ToBytes(json);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(pt));

  return {
    v: 1,
    kdf: 'pbkdf2-sha256',
    iter,
    saltB64: bytesToBase64(salt),
    ivB64: bytesToBase64(iv),
    ctB64: bytesToBase64(ct)
  };
}

export async function openVaultJson(password: string, env: VaultEnvelopeV1): Promise<string> {
  if (env?.v !== 1 || env.kdf !== 'pbkdf2-sha256') throw new Error('Unsupported vault format');
  const salt = base64ToBytes(env.saltB64);
  const iv = base64ToBytes(env.ivB64);
  const ct = base64ToBytes(env.ctB64);
  const raw = await deriveVaultKeyRaw(password, salt, env.iter);
  const key = await importAesKey(raw, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return bytesToUtf8(pt);
}

export async function deriveVaultKeyRawB64(password: string, env: VaultEnvelopeV1): Promise<string> {
  const salt = base64ToBytes(env.saltB64);
  const raw = await deriveVaultKeyRaw(password, salt, env.iter);
  return bytesToBase64(raw);
}

export async function openVaultJsonWithKeyB64(keyB64: string, env: VaultEnvelopeV1): Promise<string> {
  const iv = base64ToBytes(env.ivB64);
  const ct = base64ToBytes(env.ctB64);
  const raw = base64ToBytes(keyB64);
  const key = await importAesKey(raw, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return bytesToUtf8(pt);
}


