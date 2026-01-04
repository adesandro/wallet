export function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function bytesToUtf8(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new TextDecoder().decode(u8);
}

export function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// Go's json.Marshal on maps sorts keys. We do the same for deterministic hashing/signing.
export function stableJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  function inner(v: unknown): string {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return JSON.stringify(v as any);
    if (Array.isArray(v)) return `[${v.map(inner).join(',')}]`;
    if (isPlainObject(v)) {
      if (seen.has(v)) throw new Error('Circular structure');
      seen.add(v);
      const keys = Object.keys(v).sort();
      const parts = keys.map((k) => `${JSON.stringify(k)}:${inner((v as any)[k])}`);
      return `{${parts.join(',')}}`;
    }
    return JSON.stringify(v as any) ?? 'null';
  }

  return inner(value) as string;
}


