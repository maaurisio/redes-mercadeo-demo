import { useState } from 'react';
import { Check, Settings2 } from 'lucide-react';
import type { CuentaId, PlanId } from '../types';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { Btn, Card, CardHeader, Encabezado, Pill, inputClass } from '../components/ui';

const CATALOGO: Array<{ id: PlanId; nombre: string; socios: number; lideres: number; funciones: string[] }> = [
  { id: 'inicial', nombre: 'Plan Inicial', socios: 100, lideres: 3, funciones: ['Tablero y directorio', 'Segmentación básica', 'Agenda de 21 días', 'Exportación XLSX'] },
  { id: 'lider', nombre: 'Plan Líder', socios: 500, lideres: 8, funciones: ['Todo lo del Plan Inicial', 'Proyecciones y comparación de métodos', 'Desempeño por líderes', 'Plantillas WhatsApp'] },
  { id: 'expansion', nombre: 'Plan Expansión', socios: 2000, lideres: 25, funciones: ['Todo lo del Plan Líder', 'Evolución anual completa', 'Múltiples cuentas y auditoría', 'Soporte prioritario'] },
];

export function Planes() {
  const { state, actualizarConfigCuenta } = useApp();
  const [cuenta, setCuenta] = useState<CuentaId>(state.cuenta);
  const cfg = state.cuentas.find((c) => c.id === cuenta);
  const [duracion, setDuracion] = useState(cfg?.duracionCampana ?? 21);
  const [meta, setMeta] = useState(cfg?.metaDefault ?? 7500);
  const [guardado, setGuardado] = useState(false);

  const seleccionar = (id: CuentaId) => {
    const c = state.cuentas.find((x) => x.id === id);
    setCuenta(id);
    setDuracion(c?.duracionCampana ?? 21);
    setMeta(c?.metaDefault ?? 7500);
    setGuardado(false);
  };

  return (
    <>
      <Encabezado titulo="Planes y configuraciones" descripcion="RF-60 / CA-17 / RF-63 · catálogo configurable sin tarifas ni pasarela de pago" />
      <div className="grid gap-4 lg:grid-cols-3">
        {CATALOGO.map((p) => (
          <Card key={p.id} className="flex flex-col p-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">{p.nombre}</p>
              {cfg?.plan === p.id && <Pill tono="emerald">Plan actual</Pill>}
            </div>
            <p className="mt-3 text-sm font-medium text-indigo-600">Hasta {fmt(p.socios)} socios · {p.lideres} líderes</p>
            <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-600">
              {p.funciones.map((f) => <li key={f} className="flex gap-2"><Check size={14} className="mt-0.5 text-emerald-500" /> {f}</li>)}
            </ul>
            <p className="mt-4 text-xs text-slate-400">Sin tarifa monetaria fija en el prototipo.</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader titulo="Parámetros por cuenta" subtitulo="Los cambios afectan únicamente la cuenta seleccionada" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Cuenta</span>
            <select className={inputClass} value={cuenta} onChange={(e) => seleccionar(e.target.value as CuentaId)}>
              {state.cuentas.map((c) => <option key={c.id} value={c.id}>Cuenta {c.id} · {c.titular}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Duración de campaña (días)</span>
            <input type="number" min="7" max="30" className={`${inputClass} text-right tabular-nums`} value={duracion} onChange={(e) => { setDuracion(Number(e.target.value)); setGuardado(false); }} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Meta de puntos por defecto</span>
            <input type="number" min="100" step="100" className={`${inputClass} text-right tabular-nums`} value={meta} onChange={(e) => { setMeta(Number(e.target.value)); setGuardado(false); }} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4">
          <Btn onClick={() => { actualizarConfigCuenta(cuenta, duracion, meta); setGuardado(true); }}>
            <Settings2 size={15} /> Guardar configuración
          </Btn>
          {guardado && <Pill tono="emerald">Configuración guardada para la Cuenta {cuenta}</Pill>}
          <span className="ml-auto text-xs text-slate-500">Otras cuentas permanecen intactas.</span>
        </div>
      </Card>
    </>
  );
}
