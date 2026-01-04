import { useMemo, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PrimaryButton, Screen, SecondaryButton, TextInput } from '../ui/components';
import { useWallet } from '../state/wallet';

export function Settings({ back }: { back: () => void }) {
  const wallet = useWallet();
  const current = wallet.data?.settings.nodeUrl ?? '';
  const [nodeUrl, setNodeUrl] = useState(current);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const changed = useMemo(() => nodeUrl.trim() !== current.trim(), [nodeUrl, current]);

  return (
    <Screen>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Settings</p>
          <p className="mt-1 text-sm font-semibold text-gray-100">Node & Storage</p>
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-gray-200 transition hover:border-brand-accent/40 hover:bg-black/50"
          onClick={back}
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Node URL</p>
        <p className="mt-2 text-xs text-gray-500">Used for `GET /account/:id` and `POST /transaction`.</p>
        <div className="mt-3 space-y-2">
          <TextInput value={nodeUrl} onChange={(e) => setNodeUrl(e.target.value)} placeholder="http://localhost:7332" />
          {err ? <p className="text-sm text-red-200">{err}</p> : null}
          <PrimaryButton
            loading={saving}
            disabled={!changed || saving}
            onClick={async () => {
              setErr(null);
              setSaving(true);
              try {
                await wallet.setNodeUrl(nodeUrl.trim());
                await wallet.refreshSelectedAccount();
                back();
              } catch (e: any) {
                setErr(e?.message ?? 'Failed to save');
              } finally {
                setSaving(false);
              }
            }}
          >
            Save
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-red-200/80">Danger zone</p>
        <p className="mt-2 text-xs text-red-200/80">
          Reset will delete encrypted storage (accounts + tx history). This cannot be undone.
        </p>
        <div className="mt-3">
          <SecondaryButton
            onClick={async () => {
              // eslint-disable-next-line no-alert
              const ok = confirm('Delete wallet data? This cannot be undone.');
              if (!ok) return;
              await wallet.reset();
            }}
          >
            <Trash2 className="h-4 w-4 text-red-200" />
            Reset wallet
          </SecondaryButton>
        </div>
      </div>
    </Screen>
  );
}


