import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, ListOrdered } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { colorSegmento, puntosPotenciales, SEGMENTOS } from '../lib/segmentos';
import { Btn, Card, CardHeader, Encabezado, Pill } from '../components/ui';

export function Prioridades() {
  const { state, setPriorities, sociosActivos } = useApp();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const claves = state.priorities.filter((k) => SEGMENTOS.some((s) => s.key === k));
  SEGMENTOS.forEach((s) => { if (!claves.includes(s.key)) claves.push(s.key); });

  const mover = (origen: string, destino: string) => {
    if (origen === destino) return;
    const copia = [...claves];
    const i = copia.indexOf(origen);
    const j = copia.indexOf(destino);
    copia.splice(i, 1);
    copia.splice(j, 0, origen);
    setPriorities(copia);
  };
  const subir = (idx: number) => { if (idx > 0) { const c = [...claves]; [c[idx - 1], c[idx]] = [c[idx], c[idx - 1]]; setPriorities(c); } };
  const bajar = (idx: number) => { if (idx < claves.length - 1) { const c = [...claves]; [c[idx + 1], c[idx]] = [c[idx], c[idx + 1]]; setPriorities(c); } };

  const totalPendiente = claves.reduce((acc, k) => acc + sociosActivos.filter(SEGMENTOS.find((s) => s.key === k)!.test).length, 0);

  return (
    <>
      <Encabezado
        titulo="Prioridades de atención"
        descripcion="Define el orden en que atenderás los segmentos durante la campaña"
        acciones={<Btn variant="outline" onClick={() => setPriorities(SEGMENTOS.map((s) => s.key))}>Restablecer orden</Btn>}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader titulo="Orden de atención" subtitulo="Arrastra las tarjetas o usa los botones para subir/bajar" />
          <div className="space-y-2 p-4">
            {claves.map((key, idx) => {
              const def = SEGMENTOS.find((s) => s.key === key)!;
              const socios = sociosActivos.filter(def.test);
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setArrastrando(key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (arrastrando) mover(arrastrando, key); setArrastrando(null); }}
                  className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 ${arrastrando === key ? 'opacity-60' : ''}`}
                >
                  <GripVertical size={16} className="cursor-grab text-slate-300" />
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-xs font-semibold tabular-nums text-indigo-700">{idx + 1}</span>
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${colorSegmento(key)}`}>{def.nombre}</span>
                  <span className="ml-auto text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900">{fmt(socios.length)} socios</span>
                    <span className="block text-[11px] tabular-nums text-slate-500">{fmt(puntosPotenciales(socios))} pts potenciales</span>
                  </span>
                  <button onClick={() => subir(idx)} disabled={idx === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Subir"><ArrowUp size={14} /></button>
                  <button onClick={() => bajar(idx)} disabled={idx === claves.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Bajar"><ArrowDown size={14} /></button>
                </div>
              );
            })}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-indigo-600"><ListOrdered size={18} /><p className="text-sm font-semibold">Carga de trabajo</p></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{fmt(totalPendiente)}</p>
            <p className="text-xs text-slate-500">socios en los segmentos prioritarios</p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              La agenda de 21 días usa este orden para sugerir contactos. Los segmentos se recalculan automáticamente al importar un nuevo corte.
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">Progreso de la campaña</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Prioridad actual</span><Pill tono="indigo">{SEGMENTOS.find((s) => s.key === claves[0])?.nombre ?? '—'}</Pill></div>
              <div className="flex justify-between"><span className="text-slate-500">Segmentos configurados</span><span className="tabular-nums font-medium">{claves.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Orden personalizado</span><span className="font-medium text-emerald-600">Guardado</span></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
