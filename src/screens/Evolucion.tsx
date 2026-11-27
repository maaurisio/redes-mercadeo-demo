import { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { serieAnual } from '../utils/anual';
import { BarChartSVG } from '../components/Charts';
import { Vacio, Card, CardHeader, Encabezado, Pill } from '../components/ui';

export function Evolucion() {
  const { sociosActivos, activeCorte } = useApp();
  const puntos = useMemo(() => serieAnual(sociosActivos), [sociosActivos]);

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para ver la evolución" /></Card>;

  return (
    <>
      <Encabezado titulo="Evolución anual" descripcion="17 campañas del año · puntos totales y socios activos por campaña" />
      <Card>
        <CardHeader titulo="Tendencia de puntos" subtitulo={`C01-2026 a C17-2026 · ${fmt(sociosActivos.length)} socios en la selección`} />
        <div className="px-5 py-6">
          <BarChartSVG
            datos={puntos.map((p) => ({
              label: `C${p.n}`,
              value: p.puntos,
              color: p.futuro ? '#E2E8F0' : p.cobertura < 100 ? '#F59E0B' : '#4f46e5',
              partial: p.futuro || p.cobertura < 100,
              tooltip: `${p.campana}: ${fmt(p.puntos)} pts · ${p.activos} activos · cobertura ${p.cobertura}%`,
            }))}
            showLine
          />
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
