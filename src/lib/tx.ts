import { stableJsonStringify } from './codec';
import { signDetachedBase64 } from './crypto/ed25519';

export type TransferTxDraft = {
  v: 1;
  type: 'transfer';
  from: string;
  to: string;
  amount: number;
  fee: number;
  nonce: number;
  payload?: Record<string, unknown> | null;
};

function asString(value: unknown) {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
}

export function txPreimage(tx: Omit<TransferTxDraft, 'payload'> & { payload?: unknown }) {
  const payloadJson = stableJsonStringify(tx.payload ?? {});
  return [
    asString(tx.v ?? 0),
    asString(tx.from ?? ''),
    asString(tx.to ?? ''),
    asString(tx.amount ?? 0),
    asString(tx.fee ?? 0),
    asString(tx.nonce ?? 0),
    payloadJson
  ].join(':');
}

export async function localTxId(preimage: string): Promise<string> {
  const bytes = new TextEncoder().encode(preimage);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const u8 = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < u8.length; i++) hex += u8[i].toString(16).padStart(2, '0');
  return hex;
}

export async function buildAndSignTransferTx(params: {
  from: string;
  seedB64: string;
  to: string;
  amount: number;
  fee: number;
  nonce: number;
  payload?: Record<string, unknown> | null;
}) {
  const draft: TransferTxDraft = {
    v: 1,
    type: 'transfer',
    from: params.from,
    to: params.to,
    amount: params.amount,
    fee: params.fee,
    nonce: params.nonce,
    payload: params.payload ?? {}
  };

  const preimage = txPreimage(draft);
  const sig = signDetachedBase64(preimage, params.seedB64);
  const tx = { ...draft, sig };
  const id = await localTxId(preimage);

  return { tx, preimage, sig, id };
}


