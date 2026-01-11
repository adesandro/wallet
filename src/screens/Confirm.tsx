import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '../ui/components';
import { useWallet, type WalletTxRecord } from '../state/wallet';
import { buildAndSignTransferTx } from '../lib/tx';
import { fetchAccount, submitTransaction } from '../lib/nodeApi';
import type { SendDraft } from './Send';

export function Confirm({ back, draft, done }: { back: () => void; draft: SendDraft; done: () => void }) {
  const wallet = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const isTab = useMemo(() => document.documentElement.dataset.mode === 'tab', []);

  const account = useMemo(() => wallet.data?.accounts.find((a) => a.id === draft.fromAccountId) ?? null, [wallet.data, draft]);
  const nodeUrl = wallet.data?.settings.nodeUrl ?? '';

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
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Confirm</p>
            <p className="mt-1 text-sm font-semibold text-gray-100">Review & submit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton fullWidth={false} className="px-5 py-3" onClick={back} disabled={submitting}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </SecondaryButton>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <p className="text-xs font-medium tracking-wide text-gray-400">Transaction summary</p>

          <div className="mt-4 space-y-3">
            {/* From */}
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
              <p className="text-xs font-medium tracking-wide text-gray-400">From</p>
              <p className="mt-2 break-all font-mono text-sm text-gray-100">{account?.pub ?? '—'}</p>
            </div>

            {/* To */}
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
              <p className="text-xs font-medium tracking-wide text-gray-400">To</p>
              <p className="mt-2 break-all font-mono text-sm text-gray-100">{draft.to}</p>
            </div>

            {/* Amount / Fee */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Amount</p>
                <p className="mt-2 font-mono text-lg font-semibold text-gray-100">{draft.amount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Fee</p>
                <p className="mt-2 font-mono text-lg font-semibold text-gray-100">{draft.fee}</p>
              </div>
            </div>

            {/* Memo (if present) */}
            {draft.memo ? (
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 transition hover:border-brand-accent/25">
                <p className="text-xs font-medium tracking-wide text-gray-400">Memo</p>
                <p className="mt-2 text-sm text-gray-200">{draft.memo}</p>
              </div>
            ) : null}

            {/* Error */}
            {err ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
                <p className="text-xs font-medium tracking-wide text-red-200/80">Error</p>
                <p className="mt-2 text-sm text-red-200">{err}</p>
              </div>
            ) : null}

            {/* Success */}
            {ok ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-emerald-200">Transaction submitted</p>
                  <p className="mt-1 text-xs text-emerald-300/70">Redirecting to home…</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SecondaryButton onClick={back} disabled={submitting || ok}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </SecondaryButton>
            <PrimaryButton
              disabled={submitting || !account || ok}
              onClick={async () => {
                if (!account) return;
                setErr(null);
                setSubmitting(true);

                try {
                  const state = await fetchAccount(nodeUrl, account.pub);
                  const nonce = state.nonce + 1;

                  const payload = draft.memo ? { memo: draft.memo } : {};
                  const built = await buildAndSignTransferTx({
                    from: account.pub,
                    seedB64: account.seedB64,
                    to: draft.to,
                    amount: draft.amount,
                    fee: draft.fee,
                    nonce,
                    payload
                  });

                  const rec: WalletTxRecord = {
                    id: built.id,
                    time: Date.now(),
                    status: 'created',
                    nodeUrl,
                    from: account.pub,
                    to: draft.to,
                    amount: draft.amount,
                    fee: draft.fee,
                    nonce,
                    sig: built.sig
                  };
                  await wallet.addTx(rec);

                  await submitTransaction(nodeUrl, built.tx);
                  await wallet.updateTx(built.id, { status: 'submitted' });
                  setOk(true);

                  await wallet.refreshSelectedAccount();
                  setTimeout(() => done(), 800);
                } catch (e: any) {
                  const msg = e?.message ?? 'Failed to submit transaction';
                  setErr(msg);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-brand-accent" />
                  Confirm & send
                </>
              )}
            </PrimaryButton>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            Signature is generated locally. Tx id is the BLAKE3 hash of the transaction preimage.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
