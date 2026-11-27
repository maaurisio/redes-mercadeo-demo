import type { CellValue, Socio } from '../types';

export function valor(s: Socio | undefined, columna: string): CellValue {
  return s ? (s[columna] ?? null) : null;
}

export function texto(s: Socio | undefined, columna: string): string {
  const v = valor(s, columna);
  if (v === null || v === undefined || v === '') return 'N/D';
  return String(v);
}

export function numero(s: Socio | undefined, columna: string): number {
  const v = valor(s, columna);
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function fecha(s: Socio | undefined, columna: string): string {
  const v = valor(s, columna);
  if (!v) return 'N/D';
  if (v instanceof Date) return v.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmt(n: number): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n);
}

export function fmt2(n: number): string {
  return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function mxn(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

export function pct(n: number): string {
  return `${n}%`;
}

export function incentivo(puntos: number): number {
  const escala: Array<[number, number, number]> = [
    [0, 249, 0], [250, 499, 3], [500, 999, 6], [1000, 1999, 9],
    [2000, 3499, 12], [3500, 5499, 15], [5500, 7499, 18], [7500, Infinity, 25],
  ];
  return escala.find(([min, max]) => puntos >= min && puntos <= max)?.[2] ?? 0;
}

export function brechaTexto(brecha: number): string {
  return brecha > 0 ? `Faltan ${fmt(brecha)} pts` : `Meta superada +${fmt(Math.abs(brecha))}`;
}

export function idCorto(id: string | null | undefined): string {
  return id ? String(id) : 'N/D';
}

export function esCumpleanero(s: Socio | undefined): boolean {
  const v = valor(s, 'Fecha_Nacimiento');
  if (!v) return false;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return false;
  const clave = (d.getMonth() + 1) * 100 + d.getDate();
  return clave >= 1022 && clave <= 1111;
}
