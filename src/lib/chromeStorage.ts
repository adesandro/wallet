export async function storageGet<T>(key: string): Promise<T | undefined> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.local) {
    const res = await ch.storage.local.get(key);
    return (res as any)?.[key] as T | undefined;
  }

  // dev fallback (vite dev server)
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.local) {
    await ch.storage.local.set({ [key]: value } as any);
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export async function storageRemove(key: string): Promise<void> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.local) {
    await ch.storage.local.remove(key);
    return;
  }

  localStorage.removeItem(key);
}

export async function sessionGet<T>(key: string): Promise<T | undefined> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.session) {
    const res = await ch.storage.session.get(key);
    return (res as any)?.[key] as T | undefined;
  }

  const raw = sessionStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

export async function sessionSet<T>(key: string, value: T): Promise<void> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.session) {
    await ch.storage.session.set({ [key]: value } as any);
    return;
  }

  sessionStorage.setItem(key, JSON.stringify(value));
}

export async function sessionRemove(key: string): Promise<void> {
  const ch = (globalThis as any).chrome;
  if (ch?.storage?.session) {
    await ch.storage.session.remove(key);
    return;
  }

  sessionStorage.removeItem(key);
}


