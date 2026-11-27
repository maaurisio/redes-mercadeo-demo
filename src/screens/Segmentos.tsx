import { useMemo, useState } from 'react';
import { ArrowRight, Check, MessageSquareText, Target } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { setSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { fmt, mxn, numero, texto } from '../lib/format';
import { colorSegmento, puntosPotenciales, SEGMENTOS } from '../lib/segmentos';
import { Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

export function Segmentos({ navegar }: { navegar: (r: Ruta) => void }) {
  const { sociosActivos, state, setHideBuyers, setSegmentoActivo } = useApp();
  const [activos, setActivos] = useState<string[]>(
    () => state.segmentoActivo ? [state.segmentoActivo] : [],
  );

  const base = useMemo(
    () => (state.hideBuyers ? sociosActivos.filter((s) => texto(s, 'Hizo_Pedido') !== 'Sí') : sociosActivos),
    [sociosActivos, state.hideBuyers],
  );

  const resultados = useMemo(() => {
    if (!activos.length) return base;
    return base.filter((s) => activos.every((k) => SEGMENTOS.find((d) => d.key === k)?.test(s)));
  }, [base, activos]);

  const toggle = (key: string) => setActivos((p) => {
    const siguiente = p.includes(key) ? p.filter((k) => k !== key) : [...p, key];
    setSegmentoActivo(siguiente[0] ?? null);
    return siguiente;
  });
  const compromiso = (id: string) => { setSocioSeleccionado(id); navegar('contacto'); };

  return (
    <>
      <Encabezado
        titulo="Segmentación inteligente"
        descripcion="Vistas rápidas con conteo en tiempo real y puntos potenciales"
        acciones={
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={state.hideBuyers} onChange={(e) => setHideBuyers(e.target.checked)} />
            Ocultar socios que ya hicieron pedido
          </label>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SEGMENTOS.map((seg) => {
          const socios = base.filter(seg.test);
          const seleccionado = activos.includes(seg.key);
          return (
            <button
              key={seg.key}
              onClick={() => toggle(seg.key)}
              className={`rounded-xl border p-4 text-left transition ${seleccionado ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${colorSegmento(seg.key)}`}>{seg.nombre}</span>
                {seleccionado && <Check size={15} className="text-indigo-600" />}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div><p className="text-2xl font-semibold tabular-nums text-slate-900">{fmt(socios.length)}</p><p className="text-[11px] text-slate-500">socios</p></div>
                <div className="text-right"><p className="text-sm font-semibold tabular-nums text-indigo-600">{fmt(puntosPotenciales(socios))}</p><p className="text-[11px] text-slate-500">pts potenciales</p></div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{seg.descripcion}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader
          titulo={activos.length ? ' Socios en los segmentos seleccionados' : 'Todos los socios'}
          subtitulo={`${fmt(resultados.length)} resultados · ${fmt(puntosPotenciales(resultados))} puntos potenciales`}
          derecha={
            <div className="flex gap-2">
              <button onClick={() => navegar('agenda')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Ver en agenda</button>
              <button onClick={() => navegar('plantillas')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"><MessageSquareText size={13} /> Plantilla</button>
            </div>
          }
        />
        {resultados.length === 0 ? <Vacio mensaje="No hay socios que cumplan todos los filtros" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr><th className="px-5 py-2">Socio</th><th className="px-5 py-2">Segmento</th><th className="px-5 py-2">Líder</th><th className="px-5 py-2 text-right">Pts anteriores</th><th className="px-5 py-2 text-right">Monedero</th><th className="px-5 py-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultados.slice(0, 60).map((s) => (
                  <tr key={String(s.ID_Socio)} className="hover:bg-slate-50">
                    <td className="px-5 py-2"><span className="font-medium text-slate-800">{texto(s, 'Nombre_Completo')}</span><span className="block text-[11px] tabular-nums text-slate-400">{texto(s, 'ID_Socio')}</span></td>
                    <td className="px-5 py-2"><Pill>{texto(s, 'Segmento_Estado')}</Pill></td>
                    <td className="px-5 py-2 tabular-nums text-slate-500">{texto(s, 'ID_Lider_Subred')}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{fmt(numero(s, 'Pts_Camp_Ant_01'))}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{numero(s, 'Saldo_Monedero_MXN') > 0 ? mxn(numero(s, 'Saldo_Monedero_MXN')) : '—'}</td>
                    <td className="px-5 py-2"><button onClick={() => compromiso(String(s.ID_Socio))} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"><Target size={13} /> Compromiso <ArrowRight size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resultados.length > 60 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Mostrando los primeros 60 de {fmt(resultados.length)} socios.</p>}
          </div>
        )}
      </Card>
    </>
  );
}
