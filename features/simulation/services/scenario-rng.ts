/** Deterministic PRNG. Seed stays internal — never surface it in UI copy. */

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(parts: Array<string | number>): number {
  const text = parts.join(':');
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(rand() * items.length))]!;
}

export function gaussian(rand: () => number): number {
  const u = Math.max(1e-9, rand());
  const v = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pickN<T>(rand: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const chosen: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const index = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
    chosen.push(pool.splice(index, 1)[0]!);
  }
  return chosen;
}

export function intIn(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
