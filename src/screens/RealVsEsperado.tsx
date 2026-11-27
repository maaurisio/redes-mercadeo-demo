import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt, incentivo } from '../lib/format';
import { brechaMeta, fmtVariacion, proyectar, variacion } from '../utils/projections';
import { Barra, Card, CardHeader, Encabezado, KpiCard, Pill, Vacio } from '../components/ui';

export function RealVsEsperado() {
  const { state, activeCorte, sociosActivos } = useApp();
  const lineBase = state.lineaBase?.puntos ?? 0;
  const revisada = useMemo(
    () => proyectar(sociosActivos, state.metodo, state.factor, state.manuales).ajustada,
    [sociosActivos, state.metodo, state.factor, state.manuales],
  );
  const real = activeCorte?.kpis.puntos ?? 0;
  const brecha = brechaMeta(activeCorte?.kpis.meta ?? 0, real);
  const lideres = useMemo(() => Array.from(new Set(sociosActivos.map((s) => String(s.ID_Lider_Subred)))).sort(), [sociosActivos]);
  const cortes = state.cortes.filter((c) => c.cuenta === state.cuenta);
  const corte1 = cortes.find((c) => c.fileName.includes('Corte1'));
  const corte2 = cortes.find((c) => c.fileName.includes('Corte2'));

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para comparar" /></Card>;

  return (
    <>
      <Encabezado titulo="Real versus Esperado" descripcion="Flujo F07 · línea base, proyección revisada y puntos reales del corte activo" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard etiqueta="Línea base" valor={fmt(lineBase)} detalle={state.lineaBase?.origen === 'precargada' ? 'Día 1 · precargada' : `fijada día ${state.lineaBase?.dia ?? 1}`} tono="slate" />
        <KpiCard etiqueta="Proyección revisada" valor={fmt(revisada)} detalle={`${state.metodo} · factor ${state.factor.toFixed(2)}`} tono="indigo" />
        <KpiCard etiqueta="Puntos reales" valor={fmt(real)} detalle={activeCorte.fileName} tono="emerald" />
        <KpiCard etiqueta="Incentivo real" valor={`${incentivo(real)}%`} detalle="escala de red" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Desviación contra línea base y revisión" subtitulo="RN-10 / RN-11 · variación firmada y porcentual" />
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-600">Real − Línea base</span>
              <span className="font-semibold tabular-nums text-slate-900">{fmtVariacion(variacion(real, lineBase))}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-600">Real − Proyección revisada</span>
              <span className="font-semibold tabular-nums text-slate-900">{fmtVariacion(variacion(real, revisada))}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-600">Brecha de meta</span>
              <span className="font-semibold tabular-nums">
                {brecha.superada ? <Pill tono="emerald">Meta superada · excedente +{fmt(brecha.excedente)} pts</Pill> : <Pill tono="amber">Faltan {fmt(brecha.faltante)} pts</Pill>}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Brecha firmada: <span className="tabular-nums font-medium">{brecha.firmada > 0 ? '+' : ''}{fmt(brecha.firmada)} pts</span>. Si la meta se supera, el faltante reportado es <strong>0 pts</strong>.
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Evolución del corte" subtitulo="Corte 1 → Corte 2 en la Cuenta A" />
          <div className="p-5">
            {corte1 && corte2 ? (
              <>
                <div className="flex items-end justify-between">
                  <div><p className="text-xs text-slate-500">Corte 1 · día {corte1.diaCampana}</p><p className="text-2xl font-semibold tabular-nums text-slate-900">{fmt(corte1.kpis.puntos)}</p></div>
                  <TrendingUp size={20} className="mb-1 text-emerald-500" />
                  <div className="text-right"><p className="text-xs text-slate-500">Corte 2 · día {corte2.diaCampana}</p><p className="text-2xl font-semibold tabular-nums text-emerald-600">{fmt(corte2.kpis.puntos)}</p></div>
                </div>
                <div className="mt-4"><Barra valor={corte2.kpis.puntos} maximo={Math.max(corte2.kpis.meta, corte2.kpis.puntos)} tono="bg-emerald-500" /></div>
                <p className="mt-3 text-sm text-slate-600">
                  Variación: <strong className="tabular-nums">{fmtVariacion(variacion(corte2.kpis.puntos, corte1.kpis.puntos))}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-500">5 socios pasaron de Sin Pedido a Con Pedido; el incentivo subió de {corte1.kpis.incentivo}% a {corte2.kpis.incentivo}%.</p>
              </>
            ) : (
              <Vacio mensaje="Importa el Corte 1 y el Corte 2 para ver la evolución" />
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader titulo="Desglose por líder" subtitulo="Desviación absoluta y porcentual (N/A si el proyectado es 0)" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-5 py-2.5">Líder</th><th className="px-5 py-2.5 text-right">Socios</th><th className="px-5 py-2.5 text-right">Proyectado</th><th className="px-5 py-2.5 text-right">Real</th><th className="px-5 py-2.5 text-right">Desviación</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lideres.map((lid) => {
                const grupo = sociosActivos.filter((s) => String(s.ID_Lider_Subred) === lid);
                const proyectado = proyectar(grupo, state.metodo, state.factor, state.manuales).ajustada;
                const puntosReales = grupo.reduce((a, s) => a + (typeof s.Puntos_Personales === 'number' ? s.Puntos_Personales : 0), 0);
                const v = variacion(puntosReales, proyectado);
                return (
                  <tr key={lid} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{lid}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">{grupo.length}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmt(proyectado)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{fmt(puntosReales)}</td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${v.absoluta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtVariacion(v)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
