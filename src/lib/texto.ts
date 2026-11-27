export function limpio(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}
