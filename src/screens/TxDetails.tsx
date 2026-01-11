import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SecondaryButton, PrimaryButton } from '../ui/components';
import type { WalletTxRecord } from '../state/wallet';

const EXPLORER_BASE = 'https://testnet.explorer.modulr.cloud';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export function TxDetails({ tx, back }: { tx: WalletTxRecord; back: () => void }) {
  const explorerUrl = `${EXPLORER_BASE}/tx/${tx.id}`;
  const isTab = useMemo(() => document.documentElement.dataset.mode === 'tab', []);
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={isTab ? 'w-full' : 'glow-card gradient-border rounded-2xl p-4'}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <img src="/brand/modulr.svg" alt="Modulr" className="h-12 w-12 rounded-2xl border border-white/10 bg-black/20 p-2" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Transaction</p>
            <p className="mt-1 text-sm font-semibold text-gray-100">Details</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton fullWidth={false} className="px-5 py-3" onClick={back}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </SecondaryButton>
          <PrimaryButton
            fullWidth={false}
            className="px-5 py-3"
            onClick={() => {
              window.open(explorerUrl, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 text-brand-accent" />
            See in Explorer
          </PrimaryButton>
        </div>
      </div>

      {/* Status row */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <span
          className={[
            'rounded-full border px-4 py-2 text-sm font-semibold',
            tx.status === 'submitted'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : tx.status === 'failed'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-white/10 bg-black/20 text-gray-300'
          ].join(' ')}
        >
          {tx.status === 'submitted' ? 'Success' : tx.status === 'failed' ? 'Failed' : tx.status === 'created' ? 'Created' : tx.status}
        </span>
        <span className="text-sm text-gray-400">{formatTime(tx.time)}</span>
      </div>

      {/* Main content */}
      <div className="mt-8">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <p className="text-xs font-medium tracking-wide text-gray-400">Transaction details</p>

          <div className="mt-4 space-y-3">
            {/* Tx ID */}
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-gray-400">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {copied === 'id' ? (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-xs font-semibold text-brand-accent"
                      >
                        Copied
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-gray-300 transition hover:border-brand-accent/40 hover:text-brand-accent"
                    onClick={() => copyValue(tx.id, 'id')}
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 break-all font-mono text-sm text-brand-accent">{tx.id}</p>
            </div>

            {/* From */}
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-gray-400">From</p>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {copied === 'from' ? (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-xs font-semibold text-brand-accent"
                      >
                        Copied
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-gray-300 transition hover:border-brand-accent/40 hover:text-brand-accent"
                    onClick={() => copyValue(tx.from, 'from')}
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 break-all font-mono text-sm text-gray-100">{tx.from}</p>
            </div>

            {/* To */}
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-gray-400">To</p>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {copied === 'to' ? (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-xs font-semibold text-brand-accent"
                      >
                        Copied
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-gray-300 transition hover:border-brand-accent/40 hover:text-brand-accent"
                    onClick={() => copyValue(tx.to, 'to')}
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 break-all font-mono text-sm text-gray-100">{tx.to}</p>
            </div>

            {/* Amount / Fee / Nonce row */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Amount</p>
                <p className="mt-2 font-mono text-lg font-semibold text-gray-100">{tx.amount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Fee</p>
                <p className="mt-2 font-mono text-lg font-semibold text-gray-100">{tx.fee}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Nonce</p>
                <p className="mt-2 font-mono text-lg font-semibold text-gray-100">{tx.nonce}</p>
              </div>
            </div>

            {/* Signature */}
            {tx.sig ? (
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium tracking-wide text-gray-400">Signature</p>
                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {copied === 'sig' ? (
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="text-xs font-semibold text-brand-accent"
                        >
                          Copied
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-gray-300 transition hover:border-brand-accent/40 hover:text-brand-accent"
                      onClick={() => copyValue(tx.sig!, 'sig')}
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 break-all font-mono text-[11px] text-gray-400">{tx.sig}</p>
              </div>
            ) : null}

            {/* Error */}
            {tx.error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
                <p className="text-xs font-medium tracking-wide text-red-200/80">Error</p>
                <p className="mt-2 text-sm text-red-200">{tx.error}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
