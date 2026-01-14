import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SecondaryButton, PrimaryButton } from '../ui/components';
import { useWallet, type WalletTxRecord } from '../state/wallet';
import { fetchTransaction, type TransactionReceipt } from '../lib/nodeApi';

const EXPLORER_BASE = 'https://testnet.explorer.modulr.cloud';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

type NodeStatus = 'loading' | 'pending' | 'confirmed' | 'failed' | 'error';

export function TxDetails({ tx, back }: { tx: WalletTxRecord; back: () => void }) {
  const wallet = useWallet();
  const explorerUrl = `${EXPLORER_BASE}/tx/${tx.id}`;
  const isTab = useMemo(() => document.documentElement.dataset.mode === 'tab', []);
  const [copied, setCopied] = useState<string | null>(null);

  // Real status from node
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('loading');
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const nodeUrl = wallet.data?.settings.nodeUrl ?? '';

  const fetchStatus = async () => {
    if (!nodeUrl || !tx.id) {
      setNodeStatus('error');
      setStatusError('No node URL configured');
      return;
    }

    setNodeStatus('loading');
    setStatusError(null);

    const result = await fetchTransaction(nodeUrl, tx.id);

    if (result.found) {
      setReceipt(result.data.receipt);
      setNodeStatus(result.data.receipt.success ? 'confirmed' : 'failed');
    } else {
      // Not found = still pending in mempool or never submitted
      setReceipt(null);
      if (result.error && !result.error.includes('Not found')) {
        setNodeStatus('error');
        setStatusError(result.error);
      } else {
        setNodeStatus('pending');
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.id, nodeUrl]);

  const copyValue = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 900);
  };

  // Determine display status
  const statusDisplay = useMemo(() => {
    if (nodeStatus === 'loading') {
      return { label: 'Checking…', className: 'border-white/10 bg-black/20 text-gray-300' };
    }
    if (nodeStatus === 'confirmed') {
      return { label: 'Confirmed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' };
    }
    if (nodeStatus === 'failed') {
      return { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-200' };
    }
    if (nodeStatus === 'pending') {
      return { label: 'Pending', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' };
    }
    // error
    return { label: 'Unknown', className: 'border-white/10 bg-black/20 text-gray-300' };
  }, [nodeStatus]);

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
        <span className={['rounded-full border px-4 py-2 text-sm font-semibold', statusDisplay.className].join(' ')}>
          {nodeStatus === 'loading' ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusDisplay.label}
            </span>
          ) : (
            statusDisplay.label
          )}
        </span>
        <span className="text-sm text-gray-400">{formatTime(tx.time)}</span>
        <button
          type="button"
          onClick={fetchStatus}
          disabled={nodeStatus === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-gray-200 transition hover:border-brand-accent/40 disabled:opacity-50"
        >
          <RefreshCw className={['h-3.5 w-3.5', nodeStatus === 'loading' ? 'animate-spin' : ''].join(' ')} />
          Refresh
        </button>
      </div>

      {/* Status error */}
      {statusError ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-xs text-red-200">Failed to fetch status: {statusError}</p>
        </div>
      ) : null}

      {/* Receipt info (if confirmed) */}
      {receipt ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-xs text-gray-400">Block</span>
            <span className="font-mono text-xs text-gray-200">{receipt.block}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-xs text-gray-400">Position</span>
            <span className="font-mono text-xs text-gray-200">{receipt.position}</span>
          </div>
        </div>
      ) : null}

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

            {/* Local error (from wallet) */}
            {tx.error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
                <p className="text-xs font-medium tracking-wide text-red-200/80">Local Error</p>
                <p className="mt-2 text-sm text-red-200">{tx.error}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
