import { useMemo } from 'react';
import { Filter, Network } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { fmt, incentivo, numero, texto } from '../lib/format';
import { Barra, Btn, Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

export function Lideres({ navegar }: { navegar: (r: Ruta) => void }) {
  const { sociosActivos, activeCorte, state, setLeaderFilter } = useApp();
  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof sociosActivos>();
    sociosActivos.forEach((s) => {
      const id = texto(s, 'ID_Lider_Subred');
      mapa.set(id, [...(mapa.get(id) ?? []), s]);
    });
    return Array.from(mapa.entries()).map(([id, socios]) => {
      const puntos = socios.reduce((a, s) => a + numero(s, 'Puntos_Personales'), 0);
      return {
        id,
        nombre: texto(socios[0], 'Nombre_Lider_Subred'),
        socios: socios.length,
        activos: socios.filter((s) => numero(s, 'Campanas_Sin_Pedido') === 0).length,
        sinPedido: socios.filter((s) => texto(s, 'Hizo_Pedido') !== 'Sí').length,
        puntos,
        incentivo: incentivo(puntos),
      };
    }).sort((a, b) => b.socios - a.socios);
  }, [sociosActivos]);

  const totalPuntos = activeCorte?.kpis.puntos ?? 0;

  return (
    <>
      <Encabezado titulo="Vista por líderes" descripcion="Agrupación jerárquica por subred · filtro F04 aplicado en toda la aplicación" />
      {grupos.length === 0 ? <Card><Vacio mensaje="No hay líderes para la selección actual" /></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {grupos.map((g) => (
            <Card key={g.id}>
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Network size={18} /></span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{g.nombre}</p>
                  <p className="text-xs text-slate-500">ID_Lider_Subred {g.id} · {fmt(g.socios)} integrantes</p>
                </div>
                <Pill tono={g.incentivo >= 15 ? 'emerald' : g.incentivo > 0 ? 'indigo' : 'slate'}>{g.incentivo}% incentivo</Pill>
              </div>
              <div className="grid grid-cols-4 gap-3 px-5 py-4 text-center">
                <div><p className="text-xl font-semibold tabular-nums text-slate-900">{fmt(g.socios)}</p><p className="text-[11px] text-slate-500">Integrantes</p></div>
                <div><p className="text-xl font-semibold tabular-nums text-emerald-600">{fmt(g.activos)}</p><p className="text-[11px] text-slate-500">Activos</p></div>
                <div><p className="text-xl font-semibold tabular-nums text-rose-600">{fmt(g.sinPedido)}</p><p className="text-[11px] text-slate-500">Sin pedido</p></div>
                <div><p className="text-xl font-semibold tabular-nums text-indigo-600">{fmt(g.puntos)}</p><p className="text-[11px] text-slate-500">Puntos subred</p></div>
              </div>
              <div className="px-5 pb-3">
                <Barra valor={g.puntos} maximo={Math.max(totalPuntos, g.puntos)} tono="bg-indigo-500" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <span className="text-xs text-slate-500">
                  {totalPuntos > 0 ? `${((g.puntos / totalPuntos) * 100).toFixed(1)}% de la red` : 'Sin puntos'}
                </span>
                <Btn
                  size="sm"
                  variant={state.leaderFilter === g.id ? 'emerald' : 'outline'}
                  onClick={() => { setLeaderFilter(state.leaderFilter === g.id ? null : g.id); navegar('socios'); }}
                >
                  <Filter size={13} /> {state.leaderFilter === g.id ? 'Quitar filtro' : 'Filtrar toda la app por este líder'}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-5">
        <CardHeader titulo="Nota de negocio" />
        <p className="px-5 py-4 text-sm text-slate-600">
          El porcentaje de incentivo se calcula con la escala de red sobre los puntos de cada subred.
          El titular de la cuenta concentra el total de la red ({fmt(totalPuntos)} pts).
        </p>
      </Card>
    </>
  );
}
