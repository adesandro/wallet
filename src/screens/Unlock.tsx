import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { OpenInTabButton, PasswordInput, PrimaryButton, Screen, SecondaryButton } from '../ui/components';
import { useWallet } from '../state/wallet';

export function Unlock() {
  const wallet = useWallet();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (!err) return;
    const t = window.setTimeout(() => setErr(null), 2400);
    return () => window.clearTimeout(t);
  }, [err]);

  return (
    <Screen className="relative flex min-h-[520px] flex-col justify-between p-6">
      <form
        className="flex flex-1 flex-col"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setLoading(true);
          try {
            await wallet.unlock(password);
          } catch (e: any) {
            setErr(e?.message ?? 'Failed to unlock');
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="absolute right-5 top-5">
          <OpenInTabButton />
        </div>

        <div className="mt-2 flex flex-1 flex-col items-center justify-center text-center">
          <img
            src="/brand/modulr.svg"
            alt="Modulr"
            className="h-20 w-20 rounded-3xl border border-white/10 bg-black/20 p-3 shadow-[0_18px_38px_rgba(0,0,0,0.55)]"
          />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-100">Modulr Wallet</h1>
          <p className="mt-2 text-sm text-gray-400">Enter the password to unlock your wallet</p>
          <div className="mt-8 w-full space-y-3 text-left">
            <PasswordInput
              name="password"
              placeholder="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (err) setErr(null);
              }}
              autoFocus
              error={!!err}
            />
            {/* Fixed-height slot so the Unlock button never "jumps" when error appears/disappears */}
            <div className="relative h-5 overflow-hidden">
              <AnimatePresence>
                {err ? (
                  <motion.p
                    key="helper"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute inset-0 text-sm leading-5 text-red-200 whitespace-nowrap"
                  >
                    {err}
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    aria-hidden
                    className="absolute inset-0 text-sm leading-5 text-transparent whitespace-nowrap"
                  >
                    .
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <PrimaryButton type="submit" loading={loading} disabled={!password || loading} className="py-4 text-base">
              Unlock
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="mx-auto block text-center text-xs font-semibold text-gray-300 underline decoration-white/20 underline-offset-4 transition hover:text-brand-accent hover:decoration-brand-accent/60"
            onClick={() => setForgotOpen((v) => !v)}
          >
            Forgot password?
          </button>

          {forgotOpen ? (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                  <TriangleAlert className="h-5 w-5 text-red-200" />
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-red-200/80">Reset required</p>
                <p className="mt-2 text-xs text-red-200/80">
                  We do not store your passwords. If you forgot it, you can only reset the wallet and create a new one.
                </p>
                <div className="mt-4 w-full">
                  <SecondaryButton
                    type="button"
                    onClick={async () => {
                      // eslint-disable-next-line no-alert
                      const ok = confirm('Reset wallet? This will delete your encrypted storage and cannot be undone.');
                      if (!ok) return;
                      await wallet.reset();
                    }}
                    className="border-red-500/30 bg-red-500/10 hover:border-red-500/40 hover:bg-red-500/15"
                  >
                    Reset wallet
                  </SecondaryButton>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </Screen>
  );
}


