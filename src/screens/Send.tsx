import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import bs58 from 'bs58';
import { PrimaryButton, Screen, SecondaryButton, TextInput } from '../ui/components';
import { useWallet } from '../state/wallet';
import { fetchAccount, type AccountState } from '../lib/nodeApi';

export type SendDraft = {
  fromAccountId: string;
  to: string;
  amount: number;
  fee: number;
  memo: string;
};

export function Send({ back, next }: { back: () => void; next: (draft: SendDraft) => void }) {
  const wallet = useWallet();
  const isTab = useMemo(() => document.documentElement.dataset.mode === 'tab', []);
  const accounts = wallet.data?.accounts ?? [];
  const selected = wallet.selectedAccount;
  const nodeUrl = wallet.data?.settings.nodeUrl ?? '';

  const [fromId, setFromId] = useState<string>(selected?.id ?? '');
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement | null>(null);
  const [to, setTo] = useState('');
  const [amountRaw, setAmountRaw] = useState('0');
  const [feeRaw, setFeeRaw] = useState('1000');
  const [memo, setMemo] = useState('');
  const [fromState, setFromState] = useState<AccountState | null>(null);
  const [fromStateLoading, setFromStateLoading] = useState(false);

  const amount = useMemo(() => Number(amountRaw), [amountRaw]);
  const fee = useMemo(() => Number(feeRaw), [feeRaw]);

  const toIsValid = useMemo(() => {
    const v = to.trim();
    if (!v) return false;
    try {
      const decoded = bs58.decode(v);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }, [to]);

  const valid = useMemo(() => {
    if (!fromId) return false;
    if (!toIsValid) return false;
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (!Number.isFinite(fee) || fee < 0) return false;
    return true;
  }, [fromId, toIsValid, amount, fee]);

  const fromAccount = useMemo(() => accounts.find((a) => a.id === fromId) ?? null, [accounts, fromId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fromAccount || !nodeUrl) {
        setFromState(null);
        return;
      }
      setFromStateLoading(true);
      try {
        const state = await fetchAccount(nodeUrl, fromAccount.pub);
        if (!cancelled) setFromState(state);
      } catch {
        if (!cancelled) setFromState(null);
      } finally {
        if (!cancelled) setFromStateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromAccount?.pub, nodeUrl]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!acctRef.current) return;
      if (e.target instanceof Node && !acctRef.current.contains(e.target)) setAcctOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <Screen
      variant={isTab ? 'plain' : 'framed'}
      className={['flex min-h-[520px] flex-col', isTab ? 'w-full border border-white/10 bg-black/10 p-6 backdrop-blur-md' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Transfer</p>
          <p className="mt-1 text-sm font-semibold text-gray-100">Create transaction</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-brand-accent/40 hover:bg-black/40"
          onClick={back}
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-auto">
        {/* Single main glass container (avoid "frame-in-frame" look) */}
        <div className="rounded-2xl bg-black/20 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="space-y-4">
          <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-semibold text-gray-100">From</p>

            <div className="relative mt-2" ref={acctRef}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-black/20 px-4 py-3 text-left text-sm text-gray-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition hover:shadow-[inset_0_0_0_1px_rgba(245,180,0,0.20)]"
                onClick={() => setAcctOpen((v) => !v)}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-100">
                    {fromAccount ? `${fromAccount.name} · ${fromAccount.pub.slice(0, 8)}…` : 'Select account'}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{fromAccount?.pub ?? ''}</p>
                </div>
                <ChevronDown className={['h-5 w-5 text-gray-300 transition', acctOpen ? 'rotate-180' : ''].join(' ')} />
              </button>

              <AnimatePresence>
                {acctOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.99 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-black/60 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-md ring-1 ring-white/10"
                  >
                    <div className="max-h-56 overflow-auto p-1">
                      {accounts.map((a) => {
                        const active = a.id === fromId;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            className={[
                              'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition',
                              active ? 'bg-brand-accent/10 text-gray-100' : 'hover:bg-white/5 text-gray-200'
                            ].join(' ')}
                            onClick={() => {
                              setAcctOpen(false);
                              setFromId(a.id);
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
          </div>

          <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-semibold text-gray-100">To</p>
            <TextInput
              className={[
                'mt-2',
                to.length > 0 && !toIsValid ? 'border-red-500/30 focus:border-red-500/50 focus:ring-red-500/10' : ''
              ].join(' ')}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient address (base58)"
            />
            {to.length > 0 && !toIsValid ? (
              <p className="mt-2 text-[11px] text-red-200/80">Invalid address. Expected a base58 public key (32 bytes).</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-semibold text-gray-100">Balance</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-xs text-gray-500">Available for amount + fee</p>
              <p className="font-mono text-2xl font-semibold tracking-tight text-gray-100">
                {fromStateLoading ? '…' : fromState ? fromState.balance : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
              <p className="text-sm font-semibold text-gray-100">Amount</p>
              <TextInput className="mt-2" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} placeholder="50000000" />
              <p className="mt-3 text-[11px] text-gray-500">Use smallest unit (integer).</p>
            </div>
            <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
              <p className="text-sm font-semibold text-gray-100">Fee</p>
              <TextInput className="mt-2" value={feeRaw} onChange={(e) => setFeeRaw(e.target.value)} placeholder="1000" />
            </div>
          </div>

          <div className="rounded-xl bg-black/25 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-semibold text-gray-100">Memo (optional)</p>
            <TextInput className="mt-2" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice #582" />
          </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={back}>Cancel</SecondaryButton>
        <PrimaryButton
          className="group"
          disabled={!valid}
          onClick={() =>
            next({
              fromAccountId: fromId,
              to: to.trim(),
              amount,
              fee,
              memo
            })
          }
        >
          Continue
          <ArrowRight className="h-4 w-4 text-brand-accent transition-transform group-hover:translate-x-1.5" />
        </PrimaryButton>
      </div>
    </Screen>
  );
}


