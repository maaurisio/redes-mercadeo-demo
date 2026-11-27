import { useMemo } from 'react';
import { AlertTriangle, Bookmark, Calculator } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { FACTORES, METODOS, proyectar } from '../utils/projections';
import type { FactorAjuste, Metodo } from '../utils/projections';
import { Btn, Card, CardHeader, Encabezado, KpiCard, Pill, Vacio } from '../components/ui';

export function Proyeccion() {
  const { state, sociosActivos, activeCorte, setMetodo, setFactor, fijarLineaBase, setLeaderFilter } = useApp();
  const lideres = useMemo(() => Array.from(new Set(activeCorte?.validas.map((s) => String(s.ID_Lider_Subred)) ?? [])).sort(), [activeCorte]);
  const proy = useMemo(
    () => proyectar(sociosActivos, state.metodo, state.factor, state.manuales),
    [sociosActivos, state.metodo, state.factor, state.manuales],
  );

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para proyectar la campaña" /></Card>;

  return (
    <>
      <Encabezado titulo="Proyección de campaña" descripcion="RN-05 a RN-09 · escenarios configurables sobre el historial real de cada socio" />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader titulo="Parámetros del escenario" subtitulo="Se aplican a todas las pantallas de proyección" />
          <div className="space-y-5 p-5">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Método de cálculo</p>
              <div className="grid grid-cols-2 gap-2">
                {METODOS.map((m) => (
                  <button key={m.key} onClick={() => setMetodo(m.key as Metodo)} className={`rounded-lg border p-3 text-left text-sm transition ${state.metodo === m.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <span className="block font-medium">{m.etiqueta}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{m.descripcion}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Líder / subred</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={state.leaderFilter ?? ''}
                onChange={(e) => setLeaderFilter(e.target.value || null)}
              >
                <option value="">Toda la red ({activeCorte.validas.length} socios)</option>
                {lideres.map((l) => <option key={l} value={l}>Subred {l}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Factor de ajuste / confianza</p>
              <div className="flex flex-wrap gap-2">
                {FACTORES.map((f) => (
                  <button key={f} onClick={() => setFactor(f)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums ${state.factor === f ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {f.toFixed(2)}
                  </button>
                ))}
              </div>
              <input
                aria-label="Factor de ajuste"
                type="range" min="0" max="4" step="1"
                value={FACTORES.indexOf(state.factor)}
                onChange={(e) => setFactor(FACTORES[Number(e.target.value)] as FactorAjuste)}
                className="mt-3 w-full accent-indigo-600"
              />
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>El factor de ajuste es un <strong>supuesto configurable por el usuario</strong> y no equivale a una probabilidad estadística validada.</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard etiqueta="Proyección base" valor={fmt(proy.base)} detalle="según método activo" />
            <KpiCard etiqueta="Proyección ajustada" valor={fmt(proy.ajustada)} detalle={`factor ${state.factor.toFixed(2)}`} tono="emerald" />
            <KpiCard etiqueta="Cobertura histórica" valor={`${proy.coberturaPromedio}%`} detalle="promedio de períodos válidos" tono="indigo" />
            <KpiCard etiqueta="Socios 17/17" valor={fmt(proy.sociosCompletos)} detalle={`de ${fmt(proy.socios)} socios`} tono="slate" />
          </div>
          <Card>
            <CardHeader titulo="Línea base de inicio de campaña" subtitulo={state.lineaBase ? `${state.lineaBase.campana} · Día ${state.lineaBase.dia} · ${state.lineaBase.origen === 'precargada' ? 'precargada' : 'fijada por usuario'}` : 'Sin línea base'} />
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <span className="text-3xl font-semibold tabular-nums text-indigo-600">{fmt(state.lineaBase?.puntos ?? 0)}</span>
              <span className="text-sm text-slate-500">pts</span>
              {state.lineaBase && <Pill tono="emerald">{state.lineaBase.fijadaEn}</Pill>}
              <Btn className="ml-auto" onClick={() => fijarLineaBase(proy.ajustada)}>
                <Bookmark size={15} /> Fijar como Línea Base de Inicio de Campaña
              </Btn>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-700"><Calculator size={17} className="text-indigo-600" /><p className="text-sm font-semibold">Cómo se calcula</p></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Sólo se consideran las celdas históricas numéricas no nulas. Los períodos previos a la inscripción se dejan vacíos y <strong>nunca se cuentan como cero</strong> (RN-02/RN-05/RF-42).
              La proyección ajustada es el resultado del método elegido multiplicado por el factor configurable.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

