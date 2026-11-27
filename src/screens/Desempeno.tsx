import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3 } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt, incentivo, numero, texto } from '../lib/format';
import { brechaMeta } from '../utils/projections';
import { Barra, Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

type Orden = 'puntos' | 'cumplimiento';

export function Desempeno() {
  const { sociosActivos, activeCorte } = useApp();
  const [orden, setOrden] = useState<Orden>('puntos');
  const meta = activeCorte?.kpis.meta ?? 0;

  const filas = useMemo(() => {
    const mapa = new Map<string, typeof sociosActivos>();
    sociosActivos.forEach((s) => {
      const id = texto(s, 'ID_Lider_Subred');
      mapa.set(id, [...(mapa.get(id) ?? []), s]);
    });
    const total = sociosActivos.length || 1;
    return Array.from(mapa.entries()).map(([id, grupo]) => {
      const puntos = grupo.reduce((a, s) => a + numero(s, 'Puntos_Personales'), 0);
      const activos = grupo.filter((s) => numero(s, 'Campanas_Sin_Pedido') === 0).length;
      const metaLider = Math.round(meta * (grupo.length / total));
      const b = brechaMeta(metaLider, puntos);
      return {
        id, nombre: texto(grupo[0], 'Nombre_Lider_Subred'), socios: grupo.length,
        activos, tasa: grupo.length ? Math.round((activos / grupo.length) * 100) : 0,
        puntos, incentivo: incentivo(puntos), metaLider, brecha: b.faltante,
        superada: b.superada, cumplimiento: metaLider ? (puntos / metaLider) * 100 : 0,
      };
    }).sort((a, b) => orden === 'puntos' ? b.puntos - a.puntos : b.cumplimiento - a.cumplimiento);
  }, [sociosActivos, meta, orden]);

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para ver el desempeño" /></Card>;

  return (
    <>
      <Encabezado
        titulo="Desempeño por líderes"
        descripcion="Ranking de subredes por puntos o cumplimiento de meta"
        acciones={
          <div className="flex gap-2">
            <button onClick={() => setOrden('puntos')} className={`rounded-lg border px-3 py-1.5 text-xs ${orden === 'puntos' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}><ArrowDown size={13} /> Por puntos</button>
            <button onClick={() => setOrden('cumplimiento')} className={`rounded-lg border px-3 py-1.5 text-xs ${orden === 'cumplimiento' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}><ArrowUp size={13} /> Por cumplimiento</button>
          </div>
        }
      />
      <Card>
        <CardHeader titulo="Ranking" subtitulo={`Meta de red: ${fmt(meta)} pts · meta por líder proporcional al tamaño de subred`} />
        {filas.length === 0 ? <Vacio mensaje="Sin líderes en la selección" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr><th className="px-5 py-2.5">#</th><th className="px-5 py-2.5">Líder</th><th className="px-5 py-2.5 text-right">Socios</th><th className="px-5 py-2.5 text-right">Activos</th><th className="px-5 py-2.5 text-right">Tasa actividad</th><th className="px-5 py-2.5 text-right">Puntos</th><th className="px-5 py-2.5 text-right">Incentivo</th><th className="px-5 py-2.5">Meta / brecha</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f, i) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs font-semibold tabular-nums text-indigo-700">{i + 1}</span></td>
                    <td className="px-5 py-2.5"><span className="font-medium text-slate-800">{f.nombre}</span><span className="block text-[11px] tabular-nums text-slate-400">{f.id}</span></td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{f.socios}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-emerald-600">{f.activos}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{f.tasa}%</td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{fmt(f.puntos)}</td>
                    <td className="px-5 py-2.5 text-right"><Pill tono={f.incentivo >= 15 ? 'emerald' : 'indigo'}>{f.incentivo}%</Pill></td>
                    <td className="px-5 py-2.5">
                      <div className="w-40"><Barra valor={f.puntos} maximo={Math.max(f.metaLider, f.puntos)} tono={f.superada ? 'bg-emerald-500' : 'bg-indigo-500'} /></div>
                      <span className={`text-[11px] tabular-nums ${f.superada ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {f.superada ? `+${fmt(-f.brecha)} sobre meta` : `${fmt(f.brecha)} pts por cubrir`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><BarChart3 size={13} /> La brecha por líder usa la meta proporcional al número de socios; el total coincide con la meta de la red.</p>
    </>
  );
}
