import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { setSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { fmt, numero, texto } from '../lib/format';
import { SEGMENTOS, segmentoPorKey } from '../lib/segmentos';
import { Card, CardHeader, Encabezado, Pill, Vacio, inputClass } from '../components/ui';

const FASES = [
  { desde: 1, hasta: 3, titulo: 'Bienvenida y Monedero', claves: ['bienvenida', 'monedero'] },
  { desde: 4, hasta: 7, titulo: 'Inactivos recientes', claves: ['inactivo_1', 'compro_antes'] },
  { desde: 8, hasta: 12, titulo: 'Durmientes + catálogo digital', claves: ['durmiente', 'inactivo_2'] },
  { desde: 13, hasta: 17, titulo: 'Inactivos 3 e históricos', claves: ['inactivo_3', 'historico'] },
  { desde: 18, hasta: 21, titulo: 'Cierre de puntos', claves: ['sin_pedido'] },
];
const ESTADOS = ['Pendiente', 'Contactado', 'Compromiso', 'Sin interés', 'Completado'];

export function Agenda({ navegar }: { navegar: (r: Ruta) => void }) {
  const { activeCorte, sociosActivos, state, setTarea } = useApp();
  const [dia, setDia] = useState(() => activeCorte?.diaCampana ?? 8);
  const fase = FASES.find((f) => dia >= f.desde && dia <= f.hasta) ?? FASES[0];

  const sugeridos = useMemo(() => {
    const vistos = new Set<string>();
    const salida: Array<{ socio: typeof sociosActivos[number]; clave: string }> = [];
    for (const clave of fase.claves) {
      const def = SEGMENTOS.find((s) => s.key === clave);
      if (!def) continue;
      for (const s of sociosActivos.filter(def.test)) {
        const id = String(s.ID_Socio);
        if (vistos.has(id)) continue;
        vistos.add(id);
        salida.push({ socio: s, clave });
        if (salida.length >= 12) return salida;
      }
    }
    return salida;
  }, [fase, sociosActivos]);

  if (!activeCorte) return <Card><Vacio mensaje="Cargando agenda…" /></Card>;

  return (
    <>
      <Encabezado titulo="Agenda de campaña (21 días)" descripcion={`${activeCorte.campana} · Día ${activeCorte.diaCampana} de 21 · ruta crítica de gestión`} />
      <Card className="mb-5">
        <CardHeader titulo="Ruta crítica" subtitulo="Selecciona un día para ver los contactos sugeridos" />
        <div className="grid grid-cols-7 gap-1.5 p-4">
          {Array.from({ length: 21 }, (_, i) => {
            const d = i + 1;
            const f = FASES.find((x) => d >= x.desde && d <= x.hasta)!;
            return (
              <button
                key={d}
                onClick={() => setDia(d)}
                className={`rounded-lg border px-1 py-2 text-center transition ${dia === d ? 'border-indigo-500 bg-indigo-600 text-white' : d === activeCorte.diaCampana ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}
              >
                <span className="block text-xs font-semibold tabular-nums">Día {d}</span>
                <span className={`mt-0.5 block truncate text-[9px] ${dia === d ? 'text-indigo-100' : 'text-slate-400'}`}>{f.titulo.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader titulo={`Día ${dia} · ${fase.titulo}`} subtitulo={`Días ${fase.desde}–${fase.hasta}`} />
          <div className="space-y-2 p-4">
            {FASES.map((f) => (
              <div key={f.desde} className={`rounded-lg border p-3 text-sm ${dia >= f.desde && dia <= f.hasta ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200'}`}>
                <p className="font-medium text-slate-800">Días {f.desde}–{f.hasta}: {f.titulo}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {f.claves.map((c) => <Pill key={c}>{segmentoPorKey(c)?.nombre ?? c}</Pill>)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo="Contactos sugeridos para hoy"
            subtitulo={`${sugeridos.length} sugerencias · el estado se guarda en la sesión`}
            derecha={<Pill tono="indigo"><CalendarDays size={12} /> Día {dia}</Pill>}
          />
          {sugeridos.length === 0 ? <Vacio mensaje="No hay contactos sugeridos para este día" /> : (
            <div className="divide-y divide-slate-100">
              {sugeridos.map(({ socio, clave }) => {
                const id = String(socio.ID_Socio);
                const key = `${activeCorte.id}:${dia}:${id}`;
                const estado = state.tareas[key] ?? 'Pendiente';
                return (
                  <div key={id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <button onClick={() => { setSocioSeleccionado(id); navegar('socio'); }} className="text-left">
                      <p className="text-sm font-medium text-slate-800 hover:text-indigo-600">{texto(socio, 'Nombre_Completo')}</p>
                      <p className="text-[11px] tabular-nums text-slate-400">{id} · {texto(socio, 'Segmento_Estado')}</p>
                    </button>
                    <Pill tono="violet">{segmentoPorKey(clave)?.nombre.split(' ')[0]}</Pill>
                    <span className="ml-auto text-right text-xs text-slate-500">
                      <span className="block tabular-nums">{numero(socio, 'Saldo_Monedero_MXN') > 0 ? `Monedero ${fmt(numero(socio, 'Saldo_Monedero_MXN'))}` : '—'}</span>
                    </span>
                    <select className={`${inputClass} w-auto py-1 text-xs`} value={estado} onChange={(e) => setTarea(dia, id, e.target.value)}>
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <button onClick={() => { setSocioSeleccionado(id); navegar('contacto'); }} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Registrar</button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> {Object.keys(state.tareas).filter((k) => k.startsWith(`${activeCorte.id}:${dia}:`)).length} gestiones actualizadas en este día
          </div>
        </Card>
      </div>
    </>
  );
}
