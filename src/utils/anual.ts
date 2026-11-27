import type { Socio } from '../types';

export interface CampanaAnual {
  n: number;
  campana: string;
  puntos: number;
  activos: number;
  cobertura: number;
  futuro: boolean;
}

/** Serie de las 17 campañas del año calculada sólo desde los socios del corte activo. */
export function serieAnual(socios: Socio[]): CampanaAnual[] {
  const totalSocios = socios.length || 1;
  return Array.from({ length: 17 }, (_, i) => {
    const n = i + 1;
    const futuro = n > 15;
    let valores: number[] = [];
    if (!futuro) {
      if (n === 15) {
        valores = socios.map((s) => (typeof s.Puntos_Personales === 'number' ? s.Puntos_Personales : 0));
      } else {
        const columna = `Pts_Camp_Ant_${String(15 - n).padStart(2, '0')}`;
        valores = socios
          .map((s) => s[columna])
          .filter((v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(v))
          .map((v) => (typeof v === 'number' ? v : Number(v)))
          .filter((v) => Number.isFinite(v));
      }
    }
    return {
      n,
      campana: `C${String(n).padStart(2, '0')}-2026`,
      puntos: valores.reduce((a, b) => a + b, 0),
      activos: valores.filter((v) => v > 0).length,
      cobertura: futuro ? 0 : Math.round((valores.length / totalSocios) * 100),
      futuro,
    };
  });
}
