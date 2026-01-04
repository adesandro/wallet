import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { OpenInTabButton, PasswordInput, PrimaryButton, Screen } from '../ui/components';
import { useWallet } from '../state/wallet';

export function Onboarding() {
  const wallet = useWallet();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => password.length >= 6 && password === password2, [password, password2]);

  return (
    <Screen>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setErr(null);
          setLoading(true);
          try {
            await wallet.createVault(password);
          } catch (e: any) {
            setErr(e?.message ?? 'Failed to create vault');
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="flex items-center justify-end">
          <OpenInTabButton />
        </div>

        <div className="mt-3 flex flex-col items-center text-center">
          <img
            src="/brand/footer_logo.png"
            alt="Modulr"
            className="h-16 w-16 rounded-2xl border border-white/10 bg-black/30 p-2 shadow-[0_12px_46px_rgba(0,0,0,0.55)]"
          />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-100">Create Wallet</h1>
          <p className="mt-2 text-sm text-gray-400">Choose a password to protect your encrypted storage</p>
        </div>

        <div className="mt-6 space-y-3">
          <PasswordInput name="password" placeholder="Password (min 6 chars)" value={password} onChange={setPassword} autoFocus />
          <PasswordInput name="password2" placeholder="Repeat password" value={password2} onChange={setPassword2} />
          {err ? <p className="text-sm text-red-200">{err}</p> : null}
        </div>

        <div className="mt-5">
          <PrimaryButton type="submit" loading={loading} disabled={!canSubmit || loading} className="py-4 text-base">
            Create wallet
          </PrimaryButton>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>After unlock, we keep a short session so you won’t retype the password every time.</span>
        </div>
      </form>

      <p className="mt-3 text-xs text-gray-500">
        Your data will be stored encrypted in the browser storage. For MVP, keep the password safe.
      </p>
    </Screen>
  );
}


