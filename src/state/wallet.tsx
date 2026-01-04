import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sessionGet, sessionRemove, sessionSet, storageGet, storageRemove, storageSet } from '../lib/chromeStorage';
import { deriveVaultKeyRawB64, openVaultJson, openVaultJsonWithKeyB64, sealVaultJson, type VaultEnvelopeV1 } from '../lib/vault';
import { generateAccount, type GeneratedAccount } from '../lib/crypto/ed25519';
import { fetchAccount } from '../lib/nodeApi';

const STORAGE_VAULT_KEY = 'modulr.vault.v1';
const SESSION_UNLOCK_KEY = 'modulr.session.unlock.v1';
const DEFAULT_UNLOCK_TTL_MS = 15 * 60 * 1000;

export type WalletTxRecord = {
  id: string;
  time: number;
  status: 'created' | 'submitted' | 'failed';
  nodeUrl: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  nonce: number;
  sig?: string;
  error?: string;
};

export type WalletDataV1 = {
  v: 1;
  createdAt: number;
  selectedAccountId: string | null;
  accounts: Array<GeneratedAccount>;
  txs: WalletTxRecord[];
  settings: {
    nodeUrl: string;
  };
};

type WalletStatus = 'loading' | 'needs_onboarding' | 'locked' | 'unlocked';

type WalletContextValue = {
  status: WalletStatus;
  data: WalletDataV1 | null;
  lock: () => void;
  reset: () => Promise<void>;
  createVault: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  save: (next: WalletDataV1) => Promise<void>;
  createAccount: () => Promise<void>;
  selectAccount: (accountId: string) => Promise<void>;
  refreshSelectedAccount: () => Promise<void>;
  selectedAccount: GeneratedAccount | null;
  selectedAccountState: { balance: number; nonce: number } | null;
  setNodeUrl: (url: string) => Promise<void>;
  addTx: (tx: WalletTxRecord) => Promise<void>;
  updateTx: (id: string, patch: Partial<WalletTxRecord>) => Promise<void>;
};

const WalletCtx = createContext<WalletContextValue | null>(null);

function defaultData(): WalletDataV1 {
  return {
    v: 1,
    createdAt: Date.now(),
    selectedAccountId: null,
    accounts: [],
    txs: [],
    settings: {
      nodeUrl: 'http://localhost:7332'
    }
  };
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('loading');
  const [data, setData] = useState<WalletDataV1 | null>(null);
  const [vault, setVault] = useState<VaultEnvelopeV1 | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [selectedAccountState, setSelectedAccountState] = useState<{ balance: number; nonce: number } | null>(null);

  useEffect(() => {
    (async () => {
      const env = await storageGet<VaultEnvelopeV1>(STORAGE_VAULT_KEY);
      if (!env) {
        setStatus('needs_onboarding');
        setVault(null);
        setData(null);
        return;
      }
      setVault(env);
      // Try session-unlock: keep decrypted state for N minutes (like common wallets).
      const cached = await sessionGet<{ until: number; keyB64: string }>(SESSION_UNLOCK_KEY);
      if (cached && typeof cached.until === 'number' && cached.until > Date.now() && typeof cached.keyB64 === 'string') {
        try {
          const json = await openVaultJsonWithKeyB64(cached.keyB64, env);
          const parsed = JSON.parse(json) as WalletDataV1;
          setData(parsed);
          setPassword(null);
          setStatus('unlocked');
          setSelectedAccountState(null);
          return;
        } catch {
          await sessionRemove(SESSION_UNLOCK_KEY);
        }
      }
      setStatus('locked');
    })().catch(() => {
      setStatus('needs_onboarding');
    });
  }, []);

  const persist = useCallback(
    async (pwd: string, next: WalletDataV1) => {
      const env = await sealVaultJson(pwd, JSON.stringify(next));
      await storageSet(STORAGE_VAULT_KEY, env);
      setVault(env);
      setData(next);
    },
    []
  );

  const createVault = useCallback(
    async (pwd: string) => {
      const first = defaultData();
      const acct = generateAccount({ name: 'Account 1' });
      first.accounts = [acct];
      first.selectedAccountId = acct.id;

      await persist(pwd, first);
      setPassword(pwd);
      setStatus('unlocked');
      setSelectedAccountState(null);

      // cache unlock key in session for convenience
      const env = await storageGet<VaultEnvelopeV1>(STORAGE_VAULT_KEY);
      if (env) {
        const keyB64 = await deriveVaultKeyRawB64(pwd, env);
        await sessionSet(SESSION_UNLOCK_KEY, { until: Date.now() + DEFAULT_UNLOCK_TTL_MS, keyB64 });
      }
    },
    [persist]
  );

  const unlock = useCallback(
    async (pwd: string) => {
      const env = vault ?? (await storageGet<VaultEnvelopeV1>(STORAGE_VAULT_KEY));
      if (!env) throw new Error('Vault not found');
      const json = await openVaultJson(pwd, env);
      const parsed = JSON.parse(json) as WalletDataV1;
      setVault(env);
      setPassword(pwd);
      setData(parsed);
      setStatus('unlocked');
      setSelectedAccountState(null);

      const keyB64 = await deriveVaultKeyRawB64(pwd, env);
      await sessionSet(SESSION_UNLOCK_KEY, { until: Date.now() + DEFAULT_UNLOCK_TTL_MS, keyB64 });
    },
    [vault]
  );

  const lock = useCallback(() => {
    sessionRemove(SESSION_UNLOCK_KEY).catch(() => {});
    setPassword(null);
    setData(null);
    setSelectedAccountState(null);
    setStatus(vault ? 'locked' : 'needs_onboarding');
  }, [vault]);

  const save = useCallback(
    async (next: WalletDataV1) => {
      if (!password) throw new Error('Wallet is locked');
      await persist(password, next);
    },
    [password, persist]
  );

  const createAccount = useCallback(async () => {
    if (!data) throw new Error('Wallet not unlocked');
    const next = structuredClone(data) as WalletDataV1;
    const acct = generateAccount({ name: `Account ${next.accounts.length + 1}` });
    next.accounts.push(acct);
    next.selectedAccountId = acct.id;
    await save(next);
  }, [data, save]);

  const selectAccount = useCallback(
    async (accountId: string) => {
      if (!data) throw new Error('Wallet not unlocked');
      const next = { ...data, selectedAccountId: accountId };
      await save(next);
      setSelectedAccountState(null);
    },
    [data, save]
  );

  const selectedAccount = useMemo(() => {
    if (!data?.selectedAccountId) return null;
    return data.accounts.find((a) => a.id === data.selectedAccountId) ?? null;
  }, [data]);

  const refreshSelectedAccount = useCallback(async () => {
    if (!data || !selectedAccount) return;
    const nodeUrl = data.settings.nodeUrl;
    try {
      const state = await fetchAccount(nodeUrl, selectedAccount.pub);
      setSelectedAccountState(state);
    } catch {
      setSelectedAccountState(null);
    }
  }, [data, selectedAccount]);

  const setNodeUrl = useCallback(
    async (url: string) => {
      if (!data) throw new Error('Wallet not unlocked');
      const next = { ...data, settings: { ...data.settings, nodeUrl: url } };
      await save(next);
    },
    [data, save]
  );

  const addTx = useCallback(
    async (tx: WalletTxRecord) => {
      if (!data) throw new Error('Wallet not unlocked');
      const next = structuredClone(data) as WalletDataV1;
      next.txs.unshift(tx);
      await save(next);
    },
    [data, save]
  );

  const updateTx = useCallback(
    async (id: string, patch: Partial<WalletTxRecord>) => {
      if (!data) throw new Error('Wallet not unlocked');
      const next = structuredClone(data) as WalletDataV1;
      const idx = next.txs.findIndex((t) => t.id === id);
      if (idx >= 0) next.txs[idx] = { ...next.txs[idx], ...patch };
      await save(next);
    },
    [data, save]
  );

  const reset = useCallback(async () => {
    await storageRemove(STORAGE_VAULT_KEY);
    await sessionRemove(SESSION_UNLOCK_KEY);
    setVault(null);
    setPassword(null);
    setData(null);
    setSelectedAccountState(null);
    setStatus('needs_onboarding');
  }, []);

  const value: WalletContextValue = {
    status,
    data,
    lock,
    reset,
    createVault,
    unlock,
    save,
    createAccount,
    selectAccount,
    refreshSelectedAccount,
    selectedAccount,
    selectedAccountState,
    setNodeUrl,
    addTx,
    updateTx
  };

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}


