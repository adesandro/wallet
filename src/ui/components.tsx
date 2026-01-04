import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Maximize2 } from 'lucide-react';

export function Screen({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={['glow-card gradient-border rounded-2xl p-4', className].filter(Boolean).join(' ')}
    >
      {children}
    </motion.div>
  );
}

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-black/40"
      style={{ width: size, height: size }}
    >
      <img src="/brand/modulr.svg" alt="Modulr" className="h-8 w-8" />
      <div className="pointer-events-none absolute -inset-6 bg-[radial-gradient(circle_at_center,rgba(245,180,0,0.18),transparent_55%)]" />
    </div>
  );
}

export function OpenInTabButton() {
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-brand-accent/40 hover:bg-black/40"
      onClick={() => {
        try {
          const ch = (globalThis as any).chrome;
          const url = ch?.runtime?.getURL ? ch.runtime.getURL('index.html?mode=tab') : `${window.location.href}?mode=tab`;
          window.open(url, '_blank');
        } catch {
          // ignore
        }
      }}
      title="Open in tab"
    >
      <Maximize2 className="h-5 w-5" />
    </button>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const { className, loading, disabled, children, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[
        'inline-flex w-full items-center justify-center gap-2 rounded-xl',
        'border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-sm font-semibold text-gray-100',
        'transition hover:border-brand-accent/45 hover:bg-brand-accent/15 active:translate-y-[1px]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90" /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        'inline-flex w-full items-center justify-center gap-2 rounded-xl',
        'border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-gray-100',
        'transition hover:border-brand-accent/40 hover:bg-black/50 active:translate-y-[1px]',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-gray-100 outline-none',
        'placeholder:text-gray-500 focus:border-brand-accent/40 focus:ring-2 focus:ring-brand-accent/10',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

export function PasswordInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  name?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <TextInput
        name={props.name}
        autoFocus={props.autoFocus}
        placeholder={props.placeholder}
        type={show ? 'text' : 'password'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="pr-12"
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-gray-200 transition hover:border-brand-accent/40 hover:bg-black/30"
        onClick={() => setShow((s) => !s)}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{children}</p>;
}


