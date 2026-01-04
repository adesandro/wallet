import { AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { WalletProvider, useWallet } from './state/wallet';
import { Onboarding } from './screens/Onboarding';
import { Unlock } from './screens/Unlock';
import { Home, type HomeNav } from './screens/Home';
import { Settings } from './screens/Settings';
import { Send, type SendDraft } from './screens/Send';
import { Confirm } from './screens/Confirm';

type Route = HomeNav | 'confirm';

function AppInner() {
  const wallet = useWallet();
  const [nav, setNav] = useState<Route>('home');
  const [draft, setDraft] = useState<SendDraft | null>(null);
  const isTab = useMemo(() => document.documentElement.dataset.mode === 'tab', []);

  const screen = useMemo(() => {
    if (wallet.status === 'loading') return 'loading';
    if (wallet.status === 'needs_onboarding') return 'onboarding';
    if (wallet.status === 'locked') return 'unlock';
    return nav;
  }, [wallet.status, nav]);

  return (
    <div className={isTab ? 'min-h-screen w-full p-10' : 'min-h-[520px] min-w-[420px] p-4'}>
      <div className={isTab ? 'mx-auto w-full max-w-2xl' : ''}>
      <AnimatePresence mode="wait">
        {screen === 'loading' ? (
          <div key="loading" className="glow-card gradient-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Loading</p>
            <p className="mt-2 text-sm text-gray-200">Preparing wallet…</p>
          </div>
        ) : null}

        {screen === 'onboarding' ? <Onboarding key="onboarding" /> : null}
        {screen === 'unlock' ? <Unlock key="unlock" /> : null}

        {screen === 'home' ? (
          <Home
            key="home"
            navigate={(to) => {
              setNav(to);
            }}
          />
        ) : null}

        {screen === 'settings' ? (
          <Settings
            key="settings"
            back={() => {
              setNav('home');
            }}
          />
        ) : null}

        {screen === 'send' ? (
          <Send
            key="send"
            back={() => setNav('home')}
            next={(d) => {
              setDraft(d);
              setNav('confirm');
            }}
          />
        ) : null}

        {screen === 'confirm' ? (
          draft ? (
            <Confirm
              key="confirm"
              draft={draft}
              back={() => setNav('send')}
              done={() => {
                setDraft(null);
                setNav('home');
              }}
            />
          ) : (
            <Send
              key="send-fallback"
              back={() => setNav('home')}
              next={(d) => {
                setDraft(d);
                setNav('confirm');
              }}
            />
          )
        ) : null}
      </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  );
}
