import type { SegmentoDef, Socio } from '../types';
import { limpio } from './texto';
import { numero } from './format';

export const SEGMENTOS: SegmentoDef[] = [
  {
    key: 'sin_pedido',
    nombre: 'Sin pedido en campaña actual',
    descripcion: 'No han confirmado compra en la campaña vigente.',
    test: (s) => limpio(s.Hizo_Pedido) !== 'Sí',
  },
  {
    key: 'compro_antes',
    nombre: 'Compraron la pasada, aún no esta',
    descripcion: 'Compra en la campaña anterior y pendiente en la vigente.',
    test: (s) => limpio(s.Hizo_Pedido) !== 'Sí' && numero(s, 'Pts_Camp_Ant_01') > 0,
  },
  {
    key: 'inactivo_1',
    nombre: 'Inactivos 1 campaña',
    descripcion: 'Una campaña consecutiva sin pedido.',
    test: (s) => limpio(s.Segmento_Estado) === 'Inactivo_1',
  },
  {
    key: 'inactivo_2',
    nombre: 'Inactivos 2 campañas',
    descripcion: 'Dos campañas consecutivas sin pedido.',
    test: (s) => limpio(s.Segmento_Estado) === 'Inactivo_2',
  },
  {
    key: 'inactivo_3',
    nombre: 'Inactivos 3 campañas',
    descripcion: 'Tres campañas consecutivas sin pedido.',
    test: (s) => limpio(s.Segmento_Estado) === 'Inactivo_3',
  },
  {
    key: 'durmiente',
    nombre: 'Durmientes 4 a 17 campañas',
    descripcion: 'Sin catálogo impreso: requieren catálogo digital.',
    test: (s) => limpio(s.Segmento_Estado) === 'Durmiente',
  },
  {
    key: 'historico',
    nombre: 'Históricos 18 a 51 campañas',
    descripcion: 'Antigüedad prolongada sin pedido.',
    test: (s) => limpio(s.Segmento_Estado) === 'Historico',
  },
  {
    key: 'bienvenida',
    nombre: 'Programa de Bienvenida 1–4',
    descripcion: 'Socios nuevos cursando sus primeras campañas.',
    test: (s) => {
      const v = limpio(s.Nivel_Programa_Bienvenida);
      return v !== '' && v !== 'N/A';
    },
  },
  {
    key: 'monedero',
    nombre: 'Monedero > $0 sin pedido',
    descripcion: 'Saldo disponible para reactivación por monedero.',
    test: (s) => numero(s, 'Saldo_Monedero_MXN') > 0 && limpio(s.Hizo_Pedido) !== 'Sí',
  },
];

export function segmentoPorKey(key: string): SegmentoDef | undefined {
  return SEGMENTOS.find((s) => s.key === key);
}

export function filtrarSegmento(socios: Socio[], key: string): Socio[] {
  const def = segmentoPorKey(key);
  return def ? socios.filter(def.test) : [];
}

export function puntosPotenciales(socios: Socio[]): number {
  return socios.reduce((acc, s) => {
    if (limpio(s.Hizo_Pedido) === 'Sí') return acc + numero(s, 'Puntos_Personales');
    return acc + Math.max(numero(s, 'Pts_Camp_Ant_01'), 70);
  }, 0);
}

export function colorSegmento(key: string): string {
  const mapa: Record<string, string> = {
    sin_pedido: 'bg-rose-50 text-rose-700 ring-rose-200',
    compro_antes: 'bg-amber-50 text-amber-700 ring-amber-200',
    inactivo_1: 'bg-orange-50 text-orange-700 ring-orange-200',
    inactivo_2: 'bg-orange-50 text-orange-700 ring-orange-200',
    inactivo_3: 'bg-orange-50 text-orange-700 ring-orange-200',
    durmiente: 'bg-violet-50 text-violet-700 ring-violet-200',
    historico: 'bg-slate-100 text-slate-600 ring-slate-200',
    bienvenida: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    monedero: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };
  return mapa[key] ?? 'bg-slate-50 text-slate-600 ring-slate-200';
}
