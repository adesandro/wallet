import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { base64ToBytes, bytesToBase64, utf8ToBytes } from '../codec';

export type GeneratedAccount = {
  id: string;
  name: string;
  pub: string; // base58 of 32-byte ed25519 public key
  seedB64: string; // base64 of 32-byte ed25519 seed
};

function randomSeed32() {
  const seed32 = new Uint8Array(32);
  crypto.getRandomValues(seed32);
  return seed32;
}

function randomId() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function generateAccount(params?: {
  name?: string;
}): GeneratedAccount {
  const seed32 = randomSeed32();
  const kp = nacl.sign.keyPair.fromSeed(seed32);

  return {
    id: randomId(),
    name: params?.name ?? `Account ${new Date().toLocaleTimeString()}`,
    pub: bs58.encode(kp.publicKey),
    seedB64: bytesToBase64(seed32)
  };
}

export function signDetachedBase64(preimage: string, seed32B64: string): string {
  const seed32 = base64ToBytes(seed32B64);
  if (seed32.length !== 32) throw new Error('Invalid seed length');
  const kp = nacl.sign.keyPair.fromSeed(seed32);
  const sig = nacl.sign.detached(utf8ToBytes(preimage), kp.secretKey);
  return bytesToBase64(sig);
}


