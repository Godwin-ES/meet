export type CardProps = { result: Record<string, unknown> };
export const text = (value: unknown, fallback = '—') =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
