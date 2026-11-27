import { useMemo } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt, fmt2, incentivo } from '../lib/format';
import { cobertura, METODOS, notaCobertura, valorMetodo } from '../utils/projections';
import type { Metodo } from '../utils/projections';
import { Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

export function Comparacion() {
  const { sociosActivos, activeCorte, state } = useApp();
  const lideres = useMemo(() => Array.from(new Set(sociosActivos.map((s) => String(s.ID_Lider_Subred)))).sort(), [sociosActivos]);

  const escenarios = useMemo(() => METODOS.map((m) => {
    const total = sociosActivos.reduce((a, s) => a + valorMetodo(s, m.key as Metodo, state.manuales[String(s.ID_Socio)]), 0);
    return { key: m.key, etiqueta: m.etiqueta, total, incentivo: incentivo(total) };
  }), [sociosActivos, state.manuales]);
  const maximo = Math.max(1, ...escenarios.map((e) => e.total));

  const casos = ['200101', '200102'].map((id) => sociosActivos.find((s) => String(s.ID_Socio) === id)).filter(Boolean);

  if (!activeCorte || !sociosActivos.length) return <Card><Vacio mensaje="Carga un corte para comparar métodos" /></Card>;

  return (
    <>
      <Encabezado titulo="Comparación de métodos" descripcion="Flujo F05 · proyecto toda la red con cada criterio y muestra el incentivo resultante" />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader titulo="Proyección total de la red" subtitulo="Sin factor de ajuste, para comparar criterios" />
          <div className="space-y-4 p-5">
            {escenarios.map((e) => (
              <div key={e.key}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{e.etiqueta}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{fmt(e.total)} pts <span className="ml-1 text-xs text-indigo-600">{e.incentivo}%</span></span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${e.key === state.metodo ? 'bg-indigo-600' : 'bg-slate-400'}`} style={{ width: `${(e.total / maximo) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">El método activo aparece en índigo. El incentivo se calcula con la escala oficial de red.</p>
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Casos testigo" subtitulo="Cobertura real de períodos válidos" />
          <div className="space-y-3 p-5">
            {casos.map((s) => s && (
              <div key={String(s.ID_Socio)} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{String(s.ID_Socio)} · {String(s.Nombre_Completo)}</p>
                  <Pill tono={cobertura(s).incompleta ? 'amber' : 'emerald'}>{cobertura(s).validos}/17 períodos</Pill>
                </div>
                <p className="mt-1 text-xs text-slate-500">{notaCobertura(s)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {METODOS.map((m) => (
                    <div key={m.key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="block text-[11px] text-slate-500">{m.etiqueta}</span>
                      <span className="font-semibold tabular-nums text-slate-800">{m.key === 'promedio' ? fmt2(valorMetodo(s, 'promedio')) : fmt(valorMetodo(s, m.key as Metodo, state.manuales[String(s.ID_Socio)]))} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader titulo="Comparativa por líder de subred" subtitulo="Puntos proyectados bajo cada criterio" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-5 py-2.5">Líder</th><th className="px-5 py-2.5 text-right">Socios</th>{METODOS.map((m) => <th key={m.key} className="px-5 py-2.5 text-right">{m.etiqueta}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lideres.map((lid) => {
                const grupo = sociosActivos.filter((s) => String(s.ID_Lider_Subred) === lid);
                return (
                  <tr key={lid} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{lid} · {String(grupo[0].Nombre_Lider_Subred)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">{grupo.length}</td>
                    {escenarios.map((e) => {
                      const total = grupo.reduce((a, s) => a + valorMetodo(s, e.key as Metodo, state.manuales[String(s.ID_Socio)]), 0);
                      return <td key={e.key} className="px-5 py-2.5 text-right tabular-nums">{fmt(total)} <span className="text-[11px] text-indigo-500">{incentivo(total)}%</span></td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><GitCompareArrows size={13} /> Los valores manuales requieren motivo y se etiquetan como origen Manual; no se mezclan con el Excel oficial.</p>
    </>
  );
}
