export type AccountState = {
  balance: number;
  nonce: number;
};

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




