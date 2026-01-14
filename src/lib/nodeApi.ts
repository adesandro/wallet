export type AccountState = {
  balance: number;
  nonce: number;
};

export type TransactionReceipt = {
  block: string;
  position: number;
  success: boolean;
};

export type TxWithReceipt = {
  tx: {
    v: number;
    from: string;
    to: string;
    amount: number;
    fee: number;
    sig: string;
    nonce: number;
    payload: Record<string, unknown>;
  };
  receipt: TransactionReceipt;
};

export type FetchTxResult =
  | { found: true; data: TxWithReceipt }
  | { found: false; error?: string };

export async function fetchAccount(nodeUrl: string, accountId: string): Promise<AccountState> {
  const base = nodeUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/account/${encodeURIComponent(accountId)}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as AccountState;
}

export async function submitTransaction(nodeUrl: string, tx: unknown): Promise<any> {
  const base = nodeUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Fetch transaction by hash from the node.
 * Returns the tx + receipt if found, or { found: false } if not yet included in a block.
 */
export async function fetchTransaction(nodeUrl: string, txHash: string): Promise<FetchTxResult> {
  const base = nodeUrl.replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/transaction/${encodeURIComponent(txHash)}`);
    if (res.status === 404) {
      return { found: false };
    }
    if (!res.ok) {
      const text = await res.text();
      return { found: false, error: text };
    }
    const data = (await res.json()) as TxWithReceipt;
    return { found: true, data };
  } catch (err: any) {
    return { found: false, error: err?.message ?? 'Network error' };
  }
}




