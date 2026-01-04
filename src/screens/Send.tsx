import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { PrimaryButton, Screen, SecondaryButton, TextInput } from '../ui/components';
import { useWallet } from '../state/wallet';

export type SendDraft = {
  fromAccountId: string;
  to: string;
  amount: number;
  fee: number;
  memo: string;
};

export function Send({ back, next }: { back: () => void; next: (draft: SendDraft) => void }) {
  const wallet = useWallet();
  const accounts = wallet.data?.accounts ?? [];
  const selected = wallet.selectedAccount;

  const [fromId, setFromId] = useState<string>(selected?.id ?? '');
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement | null>(null);
  const [to, setTo] = useState('');
  const [amountRaw, setAmountRaw] = useState('0');
  const [feeRaw, setFeeRaw] = useState('1000');
  const [memo, setMemo] = useState('');

  const amount = useMemo(() => Number(amountRaw), [amountRaw]);
  const fee = useMemo(() => Number(feeRaw), [feeRaw]);

  const valid = useMemo(() => {
    if (!fromId) return false;
    if (!to.trim()) return false;
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (!Number.isFinite(fee) || fee < 0) return false;
    return true;
  }, [fromId, to, amount, fee]);

  const fromAccount = useMemo(() => accounts.find((a) => a.id === fromId) ?? null, [accounts, fromId]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!acctRef.current) return;
      if (e.target instanceof Node && !acctRef.current.contains(e.target)) setAcctOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <Screen className="flex min-h-[520px] flex-col">
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

      <div className="mt-4 flex-1 space-y-3 overflow-auto">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">From</p>
          <div className="relative mt-2" ref={acctRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left text-sm text-gray-100 transition hover:border-brand-accent/30 hover:bg-black/30"
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
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur"
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

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">To</p>
          <TextInput className="mt-2" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient address (base58)" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Amount</p>
            <TextInput className="mt-2" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} placeholder="50000000" />
            <p className="mt-3 text-[11px] text-gray-500">Use smallest unit (integer).</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Fee</p>
            <TextInput className="mt-2" value={feeRaw} onChange={(e) => setFeeRaw(e.target.value)} placeholder="1000" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Memo (optional)</p>
          <TextInput className="mt-2" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice #582" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={back}>Cancel</SecondaryButton>
        <PrimaryButton
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
          <ArrowRight className="h-4 w-4 text-brand-accent" />
        </PrimaryButton>
      </div>
    </Screen>
  );
}


