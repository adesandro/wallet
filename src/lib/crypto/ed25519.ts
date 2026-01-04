import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { base64ToBytes, bytesToBase64, utf8ToBytes } from '../codec';

export type GeneratedAccount = {
  id: string;
  name: string;
  pub: string; // base58 of 32-byte ed25519 public key
  seedB64: string; // base64 of 32-byte ed25519 seed
  // Optional: mnemonic-based derivation (encrypted in vault). Useful for backup/import.
  mnemonic?: string;
  mnemonicPassword?: string;
  bip44Path?: [number, number, number, number];
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

const DEFAULT_BIP44: [number, number, number, number] = [44, 7337, 0, 0];

function hardened(n: number) {
  return (0x80000000 | n) >>> 0;
}

// Lazy imports so the app still loads even before deps are installed; build will fail until deps are added.
async function deriveSeed32FromMnemonic(
  mnemonic: string,
  mnemonicPassword: string,
  bip44Path: [number, number, number, number]
): Promise<Uint8Array> {
  const { mnemonicToSeedSync, validateMnemonic } = await import('@scure/bip39');
  const { wordlist } = await import('@scure/bip39/wordlists/english.js');
  const { HDKey } = await import('@scure/bip32');

  const phrase = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!validateMnemonic(phrase, wordlist)) throw new Error('Invalid seed phrase');

  const seed = mnemonicToSeedSync(phrase, mnemonicPassword ?? '');
  const root = HDKey.fromMasterSeed(seed);

  const [a, b, c, d] = bip44Path;
  const child = root.deriveChild(hardened(a)).deriveChild(hardened(b)).deriveChild(hardened(c)).deriveChild(hardened(d));
  if (!child.privateKey) throw new Error('Failed to derive private key');
  const seed32 = child.privateKey.slice(0, 32);
  if (seed32.length !== 32) throw new Error('Invalid derived seed length');
  return seed32;
}

async function generateEnglishMnemonic(strength = 256): Promise<string> {
  const { generateMnemonic } = await import('@scure/bip39');
  const { wordlist } = await import('@scure/bip39/wordlists/english.js');
  return generateMnemonic(wordlist, strength);
}

export function generateAccount(params?: {
  name?: string;
}): GeneratedAccount {
  // Legacy/random account generator (kept for compatibility). Prefer mnemonic-based accounts below.
  const seed32 = randomSeed32();
  const kp = nacl.sign.keyPair.fromSeed(seed32);
  return { id: randomId(), name: params?.name ?? `Account ${new Date().toLocaleTimeString()}`, pub: bs58.encode(kp.publicKey), seedB64: bytesToBase64(seed32) };
}

export async function generateAccountFromMnemonic(params: {
  name?: string;
  mnemonic: string;
  mnemonicPassword?: string;
  bip44Path?: [number, number, number, number];
}): Promise<GeneratedAccount> {
  const bip44Path = params.bip44Path ?? DEFAULT_BIP44;
  const mnemonicPassword = params.mnemonicPassword ?? '';
  const seed32 = await deriveSeed32FromMnemonic(params.mnemonic, mnemonicPassword, bip44Path);
  const kp = nacl.sign.keyPair.fromSeed(seed32);

  return {
    id: randomId(),
    name: params.name ?? `Account ${new Date().toLocaleTimeString()}`,
    pub: bs58.encode(kp.publicKey),
    seedB64: bytesToBase64(seed32),
    mnemonic: params.mnemonic.trim().toLowerCase().replace(/\s+/g, ' '),
    mnemonicPassword,
    bip44Path
  };
}

export async function generateNewDefaultAccount(params?: { name?: string; mnemonicPassword?: string }): Promise<GeneratedAccount> {
  const mnemonic = await generateEnglishMnemonic(256);
  return generateAccountFromMnemonic({
    name: params?.name,
    mnemonic,
    mnemonicPassword: params?.mnemonicPassword ?? '',
    bip44Path: DEFAULT_BIP44
  });
}

export function signDetachedBase64(preimage: string, seed32B64: string): string {
  const seed32 = base64ToBytes(seed32B64);
  if (seed32.length !== 32) throw new Error('Invalid seed length');
  const kp = nacl.sign.keyPair.fromSeed(seed32);
  const sig = nacl.sign.detached(utf8ToBytes(preimage), kp.secretKey);
  return bytesToBase64(sig);
}


