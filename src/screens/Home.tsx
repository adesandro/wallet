import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Copy, Lock, Plus, RefreshCw, Send, Settings } from 'lucide-react';
import { useWallet, type WalletTxRecord } from '../state/wallet';
import { OpenInTabButton, PrimaryButton, Screen, SecondaryButton } from '../ui/components';

function shorten(value: string, left = 8, right = 8) {
  if (!value) return '—';
  if (value.length <= left + right + 1) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

export type HomeNav = 'home' | 'send' | 'settings';

export function Home({ navigate, onTxClick }: { navigate: (to: HomeNav) => void; onTxClick?: (tx: WalletTxRecord) => void }) {
  const wallet = useWallet();
  const selected = wallet.selectedAccount;
  const [copied, setCopied] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    wallet.refreshSelectedAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.data?.selectedAccountId, wallet.data?.settings.nodeUrl]);

  const balance = wallet.selectedAccountState?.balance ?? null;
  const nonce = wallet.selectedAccountState?.nonce ?? null;

  const txs = wallet.txs ?? [];
  const nodeUrl = wallet.data?.settings.nodeUrl ?? '';

  const txPreview = useMemo(() => txs.slice(0, 6), [txs]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!acctRef.current) return;
      const el = acctRef.current;
      if (e.target instanceof Node && !el.contains(e.target)) setAcctOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <Screen>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Wallet</p>
          <p className="mt-1 text-sm font-semibold text-gray-100">Accounts & Activity</p>
          <p className="mt-1 truncate text-xs text-gray-500">Node: {nodeUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <OpenInTabButton />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-brand-accent/40 hover:bg-black/40"
            onClick={() => navigate('settings')}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-brand-accent/40 hover:bg-black/40"
            onClick={() => wallet.lock()}
            title="Lock"
          >
            <Lock className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Active account</p>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-gray-200 transition hover:border-brand-accent/40"
            onClick={async () => {
              await wallet.refreshSelectedAccount();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="relative mt-3" ref={acctRef}>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left text-sm text-gray-100 transition hover:border-brand-accent/30 hover:bg-black/30"
            onClick={() => setAcctOpen((v) => !v)}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-100">
                {selected ? `${selected.name} · ${selected.pub.slice(0, 8)}…` : 'Select account'}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{selected?.pub ?? ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-gray-200 transition hover:border-brand-accent/40 hover:bg-black/30"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!selected?.pub) return;
                  await navigator.clipboard.writeText(selected.pub);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 850);
                }}
                title="Copy address"
              >
                <Copy className="h-5 w-5" />
              </button>
              <ChevronDown className={['h-5 w-5 text-gray-300 transition', acctOpen ? 'rotate-180' : ''].join(' ')} />
            </div>
          </button>

          <AnimatePresence>
            {acctOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur"
              >
                <div className="max-h-56 overflow-auto p-1">
                  {(wallet.data?.accounts ?? []).map((a) => {
                    const active = a.id === wallet.data?.selectedAccountId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={[
                          'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition',
                          active ? 'bg-brand-accent/10 text-gray-100' : 'hover:bg-white/5 text-gray-200'
                        ].join(' ')}
                        onClick={async () => {
                          setAcctOpen(false);
                          await wallet.selectAccount(a.id);
                          await wallet.refreshSelectedAccount();
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{a.name}</p>
                          <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{a.pub}</p>
                        </div>
                        {active ? <Check className="h-4 w-4 text-brand-accent" /> : null}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {copied ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mt-2 text-xs text-brand-accent"
            >
              Copied
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Balance</p>
            <p className="mt-2 font-mono text-sm text-gray-100">{balance === null ? '—' : balance}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Nonce</p>
            <p className="mt-2 font-mono text-sm text-gray-100">{nonce === null ? '—' : nonce}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SecondaryButton
            onClick={async () => {
              await wallet.createAccount();
            }}
          >
            <Plus className="h-4 w-4 text-brand-accent" />
            Create account
          </SecondaryButton>
          <SecondaryButton className="group" onClick={() => navigate('send')}>
            <Send className="h-4 w-4 text-brand-accent group-hover:animate-[planeHover_420ms_ease-out_1]" />
            Send
          </SecondaryButton>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Recent transactions</p>
          <span className="text-xs text-gray-500">{txs.length}</span>
        </div>

        {txPreview.length === 0 ? (
          <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-sm text-gray-400">
            No transactions yet.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {txPreview.map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left transition hover:border-brand-accent/30"
                onClick={() => onTxClick?.(t)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-mono text-xs text-brand-accent" title={t.id}>
                    {shorten(t.id, 10, 10)}
                  </p>
                  <span
                    className={[
                      'rounded-full border px-2 py-1 text-[11px] font-semibold',
                      t.status === 'submitted'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : t.status === 'failed'
                          ? 'border-red-500/30 bg-red-500/10 text-red-200'
                          : 'border-white/10 bg-black/20 text-gray-300'
                    ].join(' ')}
                  >
                    {t.status === 'submitted' ? 'Success' : t.status === 'failed' ? 'Failed' : t.status === 'created' ? 'Created' : t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {shorten(t.from)} → {shorten(t.to)} · amt {t.amount} · fee {t.fee}
                </p>
                {t.error ? <p className="mt-1 text-xs text-red-200">{t.error}</p> : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <PrimaryButton className="group" onClick={() => navigate('send')}>
          <Send className="h-4 w-4 text-brand-accent group-hover:animate-[planeHover_420ms_ease-out_1]" />
          New transfer
        </PrimaryButton>
      </div>
    </Screen>
  );
}


