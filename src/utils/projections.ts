import type { Socio } from '../types';

export type Metodo = 'promedio' | 'mediana' | 'maximo' | 'manual';
export type FactorAjuste = 0.8 | 0.9 | 1 | 1.1 | 1.2;

export const FACTORES: FactorAjuste[] = [0.8, 0.9, 1, 1.1, 1.2];

export const METODOS: Array<{ key: Metodo; etiqueta: string; descripcion: string }> = [
  { key: 'promedio', etiqueta: 'Promedio aritmético', descripcion: 'Suma de períodos válidos entre la cantidad de períodos.' },
  { key: 'mediana', etiqueta: 'Mediana', descripcion: 'Valor central; si hay un número par de períodos, promedio de los dos centrales.' },
  { key: 'maximo', etiqueta: 'Máximo anterior', descripcion: 'El mejor resultado histórico del socio.' },
  { key: 'manual', etiqueta: 'Manual', descripcion: 'Valor definido por el usuario con motivo obligatorio; nunca se mezcla con datos del Excel.' },
];

export interface ManualEntry {
  puntos: number;
  motivo: string;
}

export type ManualMap = Record<string, ManualEntry>;

export interface Cobertura {
  validos: number;
  total: number;
  porcentaje: number;
  incompleta: boolean;
}

export interface Proyeccion {
  base: number;
  ajustada: number;
  coberturaPromedio: number;
  sociosCompletos: number;
  socios: number;
}

/** RN-02 / RN-05 / RF-42: sólo celdas numéricas no nulas; nunca ceros inventados. */
export function valoresHistorial(socio: Socio | undefined): number[] {
  if (!socio) return [];
  const valores: number[] = [];
  for (let k = 1; k <= 17; k += 1) {
    const v = socio[`Pts_Camp_Ant_${String(k).padStart(2, '0')}`];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (typeof v === 'string' && Number.isNaN(Number(v))) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) valores.push(n);
  }
  return valores;
}

export function cobertura(socio: Socio | undefined): Cobertura {
  const validos = valoresHistorial(socio).length;
  return {
    validos,
    total: 17,
    porcentaje: Math.round((validos / 17) * 100),
    incompleta: validos < 17,
  };
}

export function promedio(valores: number[]): number {
  if (!valores.length) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function mediana(valores: number[]): number {
  if (!valores.length) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 === 0 ? (orden[medio - 1] + orden[medio]) / 2 : orden[medio];
}

export function maximoAnterior(valores: number[]): number {
  return valores.length ? Math.max(...valores) : 0;
}

export function notaCobertura(socio: Socio | undefined): string {
  const c = cobertura(socio);
  return c.incompleta
    ? `Historial parcial: ${c.validos} de 17 períodos. El resto corresponde a campañas previas a la inscripción (sin ceros inventados).`
    : 'Cobertura completa: 17 de 17 períodos.';
}

/** Valor de proyección de un socio según el método activo. Manual sin valor cae al promedio. */
export function valorMetodo(
  socio: Socio | undefined,
  metodo: Metodo,
  manual?: ManualEntry,
): number {
  const valores = valoresHistorial(socio);
  switch (metodo) {
    case 'mediana': return mediana(valores);
    case 'maximo': return maximoAnterior(valores);
    case 'manual': return manual ? manual.puntos : promedio(valores);
    case 'promedio':
    default: return promedio(valores);
  }
}

export function proyectar(
  socios: Socio[],
  metodo: Metodo,
  factor: FactorAjuste,
  manual: ManualMap = {},
): Proyeccion {
  const base = socios.reduce((acc, s) => acc + valorMetodo(s, metodo, manual[String(s.ID_Socio)]), 0);
  const coberturas = socios.map((s) => cobertura(s).validos);
  return {
    base: Math.round(base * 100) / 100,
    ajustada: Math.round(base * factor * 100) / 100,
    coberturaPromedio: socios.length ? Math.round((coberturas.reduce((a, b) => a + b, 0) / socios.length / 17) * 100) : 0,
    sociosCompletos: coberturas.filter((n) => n === 17).length,
    socios: socios.length,
  };
}

export interface Brecha {
  faltante: number;
  excedente: number;
  firmada: number;
  superada: boolean;
}

/** RN-10: si la meta se superó, el faltante es 0 y el excedente se reporta aparte. */
export function brechaMeta(meta: number, reales: number): Brecha {
  const firmada = meta - reales;
  return {
    faltante: Math.max(0, firmada),
    excedente: Math.max(0, -firmada),
    firmada,
    superada: firmada < 0,
  };
}

export interface Variacion {
  absoluta: number;
  porcentual: number | null;
}

/** RN-11: nunca dividir entre cero; si Proyectado === 0, el % es N/A. */
export function variacion(real: number, proyectado: number): Variacion {
  const absoluta = real - proyectado;
  return {
    absoluta,
    porcentual: proyectado === 0 ? null : (absoluta / proyectado) * 100,
  };
}

export function fmtVariacion(v: Variacion): string {
  const signo = v.absoluta >= 0 ? '+' : '';
  const pctTexto = v.porcentual === null ? 'N/A' : `${v.porcentual >= 0 ? '+' : ''}${v.porcentual.toFixed(1)}%`;
  return `${signo}${Math.round(v.absoluta).toLocaleString('es-MX')} pts (${pctTexto})`;
}
