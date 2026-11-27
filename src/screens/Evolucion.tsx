import { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { Vacio, Card, CardHeader, Encabezado, Pill } from '../components/ui';

interface Punto {
  n: number;
  campana: string;
  puntos: number;
  activos: number;
  cobertura: number;
  futuro: boolean;
}

export function Evolucion() {
  const { sociosActivos, activeCorte } = useApp();
  const puntos = useMemo<Punto[]>(() => {
    const totalSocios = sociosActivos.length || 1;
    return Array.from({ length: 17 }, (_, i) => {
      const n = i + 1;
      const futuro = n > 15;
      let valores: number[] = [];
      if (futuro) {
        valores = [];
      } else if (n === 15) {
        valores = sociosActivos.map((s) => (typeof s.Puntos_Personales === 'number' ? s.Puntos_Personales : 0));
      } else {
        const col = `Pts_Camp_Ant_${String(15 - n).padStart(2, '0')}`;
        valores = sociosActivos
          .map((s) => s[col])
          .filter((v) => v !== null && v !== undefined && !Number.isNaN(v))
          .map((v) => (typeof v === 'number' ? v : Number(v)));
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
  }, [sociosActivos]);
  const maximo = Math.max(1, ...puntos.map((p) => p.puntos));

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para ver la evolución" /></Card>;

  return (
    <>
      <Encabezado titulo="Evolución anual" descripcion="17 campañas del año · puntos totales y socios activos por campaña" />
      <Card>
        <CardHeader titulo="Tendencia de puntos" subtitulo={`C01-2026 a C17-2026 · ${fmt(sociosActivos.length)} socios en la selección`} />
        <div className="px-5 py-6">
          <div className="flex h-64 items-end gap-1.5">
            {puntos.map((p) => (
              <div key={p.n} className="group flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[9px] tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">{fmt(p.puntos)}</span>
                <div
                  className={`w-full rounded-t transition-all ${p.futuro ? 'bg-slate-100' : p.cobertura < 100 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                  style={{ height: `${Math.max(3, (p.puntos / maximo) * 100)}%` }}
                  title={`${p.campana}: ${fmt(p.puntos)} pts · ${p.activos} activos · cobertura ${p.cobertura}%`}
                />
                <span className="text-[9px] text-slate-400">{p.n}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-indigo-500" /> Cobertura completa</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-400" /> Cobertura parcial (socios nuevos / períodos sin dato)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-slate-200" /> Campaña futura sin datos</span>
          </div>
        </div>
      </Card>
      <Card className="mt-5">
        <CardHeader titulo="Detalle por campaña" subtitulo="Los períodos previos a la inscripción se dejan vacíos: nunca se inventan ceros (RN-02/RN-05)" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-5 py-2.5">Campaña</th><th className="px-5 py-2.5 text-right">Puntos totales</th><th className="px-5 py-2.5 text-right">Socios activos</th><th className="px-5 py-2.5 text-right">Cobertura</th><th className="px-5 py-2.5">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {puntos.map((p) => (
                <tr key={p.n} className="hover:bg-slate-50">
                  <td className="px-5 py-2 font-medium text-slate-800">{p.campana}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{fmt(p.puntos)}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{p.activos}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{p.futuro ? '—' : `${p.cobertura}%`}</td>
                  <td className="px-5 py-2">{p.futuro ? <Pill>Sin datos aún</Pill> : p.cobertura < 100 ? <Pill tono="amber">Cobertura parcial</Pill> : <Pill tono="emerald">Completa</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><LineChart size={13} /> El filtro global de líder de la barra superior afecta esta gráfica.</p>
    </>
  );
}
