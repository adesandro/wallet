import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { PrimaryButton, Screen, SecondaryButton } from '../ui/components';
import { useWallet, type WalletTxRecord } from '../state/wallet';
import { buildAndSignTransferTx } from '../lib/tx';
import { fetchAccount, submitTransaction } from '../lib/nodeApi';
import type { SendDraft } from './Send';

export function Confirm({ back, draft, done }: { back: () => void; draft: SendDraft; done: () => void }) {
  const wallet = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const account = useMemo(() => wallet.data?.accounts.find((a) => a.id === draft.fromAccountId) ?? null, [wallet.data, draft]);
  const nodeUrl = wallet.data?.settings.nodeUrl ?? '';

  return (
    <Screen>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Confirm</p>
          <p className="mt-1 text-sm font-semibold text-gray-100">Review & submit</p>
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-gray-200 transition hover:border-brand-accent/40 hover:bg-black/50"
          onClick={back}
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">From</p>
          <p className="mt-2 truncate font-mono text-xs text-gray-200">{account?.pub ?? '—'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">To</p>
          <p className="mt-2 truncate font-mono text-xs text-gray-200">{draft.to}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Amount</p>
            <p className="mt-2 font-mono text-sm text-gray-100">{draft.amount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Fee</p>
            <p className="mt-2 font-mono text-sm text-gray-100">{draft.fee}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Node</p>
          <p className="mt-2 truncate text-xs text-gray-300">{nodeUrl}</p>
        </div>

        {err ? <p className="text-sm text-red-200">{err}</p> : null}
        {ok ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">Submitted</p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={back} disabled={submitting}>
          Back
        </SecondaryButton>
        <PrimaryButton
          loading={submitting}
          disabled={submitting || !account}
          onClick={async () => {
            if (!account) return;
            setErr(null);
            setSubmitting(true);

            try {
              // nonce: fetch account state and use nonce+1 (matches js-sdk example).
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

              // refresh balance/nonce
              await wallet.refreshSelectedAccount();
              setTimeout(() => done(), 700);
            } catch (e: any) {
              const msg = e?.message ?? 'Failed to submit transaction';
              setErr(msg);
              // update most recent tx if created
              // best-effort: nothing if we failed before addTx.
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
              Submitting
            </>
          ) : (
            'Confirm & send'
          )}
        </PrimaryButton>
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">
        Signature is generated locally. Tx id shown in history is a local SHA-256 of the preimage.
      </p>
    </Screen>
  );
}


