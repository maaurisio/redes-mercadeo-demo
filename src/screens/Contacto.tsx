import { useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { getSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { fmt, texto } from '../lib/format';
import { Btn, Card, Campo, Encabezado, Pill, Vacio, inputClass } from '../components/ui';

const ESTADOS = ['Pendiente', 'Contactado', 'Compromiso', 'Sin interés', 'Completado'];

export function Contacto({ navegar }: { navegar: (r: Ruta) => void }) {
  const { sociosActivos, activeCorte, addContacto, setTarea } = useApp();
  const [id, setId] = useState(() => getSocioSeleccionado() ?? '200101');
  const socio = sociosActivos.find((s) => String(s.ID_Socio) === id) ?? sociosActivos[0];
  const [canal, setCanal] = useState('WhatsApp');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('2026-10-29');
  const [puntos, setPuntos] = useState(100);
  const [estado, setEstado] = useState('Compromiso');
  const [guardado, setGuardado] = useState(false);

  if (!socio) return <Card><Vacio mensaje="No hay socios disponibles" /></Card>;

  const guardar = () => {
    addContacto({
      socioId: String(socio.ID_Socio), canal, observaciones,
      fechaSeguimiento: fecha, puntosPrometidos: puntos, estado,
    });
    if (activeCorte) setTarea(activeCorte.diaCampana, String(socio.ID_Socio), estado);
    setGuardado(true);
  };

  return (
    <>
      <Encabezado titulo="Registro de contacto y compromiso" descripcion="Documenta una gestión manual sin alterar los pedidos reales" />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{texto(socio, 'Nombre_Completo')}</p>
                <p className="text-xs text-slate-500">ID {texto(socio, 'ID_Socio')} · {texto(socio, 'Segmento_Estado')}</p>
              </div>
              <select className={`${inputClass} w-auto`} value={String(socio.ID_Socio)} onChange={(e) => { setId(e.target.value); setGuardado(false); }}>
                {sociosActivos.slice(0, 400).map((s) => <option key={String(s.ID_Socio)} value={String(s.ID_Socio)}>{String(s.ID_Socio)} · {String(s.Nombre_Completo)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Campo etiqueta="Canal de gestión">
              <select className={inputClass} value={canal} onChange={(e) => setCanal(e.target.value)}>
                <option>WhatsApp</option><option>Llamada</option><option>Visita</option>
              </select>
            </Campo>
            <Campo etiqueta="Estado de la gestión">
              <select className={inputClass} value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Próximo seguimiento" ayuda="Dentro de los 21 días de la campaña (22/10/2026 – 11/11/2026)">
              <input type="date" className={inputClass} min="2026-10-22" max="2026-11-11" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Campo>
            <Campo etiqueta="Puntos prometidos / intención de compra">
              <input type="number" min="0" max="5000" className={`${inputClass} text-right tabular-nums`} value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} />
            </Campo>
            <div className="sm:col-span-2">
              <Campo etiqueta="Observaciones">
                <textarea rows={4} className={inputClass} placeholder="Ej. Confirma interés en pedido de programa de bienvenida…" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </Campo>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4">
            <Btn onClick={guardar}><Save size={15} /> Guardar gestión</Btn>
            {guardado && <Pill tono="emerald">Gestión guardada en el historial del socio</Pill>}
            <button onClick={() => navegar('socio')} className="ml-auto text-sm text-slate-500 hover:text-indigo-600">Volver a la ficha</button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-start gap-2 text-amber-700">
              <AlertCircle size={18} className="mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Estimación de gestión</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Los {fmt(puntos)} pts prometidos son una intención de compra reportada por el líder.
                  <strong> No se suman a los pedidos confirmados</strong> ni modifican los KPIs del tablero (RN-13).
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">Resumen de la gestión</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Socio</span><span className="font-medium">{texto(socio, 'ID_Socio')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Canal</span><span className="font-medium">{canal}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Estado</span><Pill tono="amber">{estado}</Pill></div>
              <div className="flex justify-between"><span className="text-slate-500">Puntos estimados</span><span className="font-semibold tabular-nums text-amber-700">{fmt(puntos)} pts</span></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
