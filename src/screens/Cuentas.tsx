import { useState } from 'react';
import { Building2, Check, Pause, Play, Plus, ShieldCheck } from 'lucide-react';
import type { CuentaId, CuentaConfig } from '../types';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { Btn, Card, CardHeader, Campo, Encabezado, Pill, inputClass } from '../components/ui';

type Modal = { tipo: 'crear' } | { tipo: 'estado'; cuenta: CuentaId } | null;

const PLANES: Record<CuentaConfig['plan'], string> = {
  inicial: 'Plan Inicial', lider: 'Plan Líder', expansion: 'Plan Expansión',
};

export function Cuentas() {
  const { state, crearCuenta, alternarCuenta, seleccionarCuenta, registrarAuditoria } = useApp();
  const [modal, setModal] = useState<Modal>(null);
  const [titular, setTitular] = useState('');
  const [plan, setPlan] = useState<CuentaConfig['plan']>('lider');
  const [socios, setSocios] = useState(50);
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState('');

  const crear = () => {
    if (!titular.trim()) { setAviso('El titular es obligatorio'); return; }
    const id = crearCuenta(titular.trim(), plan, socios);
    setModal(null); setTitular(''); setAviso('');
    seleccionarCuenta(id);
  };

  const cambiarEstado = () => {
    if (!modal || modal.tipo !== 'estado') return;
    if (!motivo.trim()) { setAviso('El motivo es obligatorio para pausar o activar una cuenta'); return; }
    alternarCuenta(modal.cuenta, motivo.trim());
    setModal(null); setMotivo(''); setAviso('');
  };

  return (
    <>
      <Encabezado
        titulo="Gestión de cuentas"
        descripcion="Flujos F09 y F10 · aislamiento multicuenta, alta de pruebas y control de acceso (RF-64)"
        acciones={<Btn onClick={() => setModal({ tipo: 'crear' })}><Plus size={15} /> Crear cuenta de prueba</Btn>}
      />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader titulo="Cuentas comerciales" subtitulo="Cada cuenta tiene su propia red, meta y configuración" />
          <div className="divide-y divide-slate-100">
            {state.cuentas.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Building2 size={18} /></span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Cuenta {c.id} · {c.titular}</p>
                  <p className="text-xs text-slate-500">{PLANES[c.plan]} · {fmt(c.socios)} socios · {c.duracionCampana} días · meta {fmt(c.metaDefault)} pts</p>
                  {c.motivo && <p className="mt-1 text-[11px] text-rose-500">Motivo: {c.motivo}</p>}
                </div>
                <Pill tono={c.estado === 'Activa' ? 'emerald' : 'rose'}>{c.estado}</Pill>
                <Btn size="sm" variant="outline" onClick={() => { setModal({ tipo: 'estado', cuenta: c.id }); setMotivo(''); setAviso(''); }}>
                  {c.estado === 'Activa' ? <><Pause size={13} /> Pausar</> : <><Play size={13} /> Activar</>}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => seleccionarCuenta(c.id)}>Abrir</Btn>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader titulo="Aislamiento SaaS" subtitulo="Flujo F09" />
          <div className="space-y-3 p-5 text-sm text-slate-600">
            <p className="flex gap-2"><ShieldCheck size={16} className="shrink-0 text-emerald-600" /> Cuenta A: 383 socios con prefijo 200XXX y meta 7,500 pts.</p>
            <p className="flex gap-2"><ShieldCheck size={16} className="shrink-0 text-emerald-600" /> Cuenta B: 120 socios con prefijo 500XXX y meta 4,500 pts. Sin mezcla de datos.</p>
            <p className="flex gap-2"><ShieldCheck size={16} className="shrink-0 text-emerald-600" /> El historial de cortes se conserva por cuenta al cambiar el selector superior.</p>
            <p className="flex gap-2"><ShieldCheck size={16} className="shrink-0 text-emerald-600" /> Al pausar una cuenta, al abrirla se muestra la pantalla de suspensión (F10).</p>
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <Btn variant="outline" size="sm" onClick={() => registrarAuditoria('Verificación de aislamiento', 'Se verificó la separación de Cuenta A y Cuenta B')}>
              <Check size={13} /> Registrar verificación
            </Btn>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader titulo="Auditoría administrativa" subtitulo="RF-64 · fecha, actor, cuenta afectada y motivo" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-5 py-2.5">Fecha</th><th className="px-5 py-2.5">Actor</th><th className="px-5 py-2.5">Cuenta</th><th className="px-5 py-2.5">Acción</th><th className="px-5 py-2.5">Motivo</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.auditoria.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-2.5 text-slate-500">{a.fecha}</td>
                  <td className="px-5 py-2.5">{a.actor}</td>
                  <td className="px-5 py-2.5 tabular-nums">{a.cuenta}</td>
                  <td className="px-5 py-2.5 font-medium text-slate-800">{a.accion}</td>
                  <td className="px-5 py-2.5 text-slate-600">{a.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-semibold text-slate-900">
              {modal.tipo === 'crear'
                ? 'Crear cuenta de prueba'
                : `${state.cuentas.find((c) => c.id === modal.cuenta)?.estado === 'Activa' ? 'Pausar acceso' : 'Activar acceso'} · Cuenta ${modal.cuenta}`}
            </p>
            <p className="mt-1 text-sm text-slate-500">Los cambios quedan registrados en auditoría.</p>
            <div className="mt-4 space-y-4">
              {modal.tipo === 'crear' ? (
                <>
                  <Campo etiqueta="Titular de la red"><input className={inputClass} value={titular} onChange={(e) => setTitular(e.target.value)} placeholder="Nombre ficticio" /></Campo>
                  <Campo etiqueta="Plan"><select className={inputClass} value={plan} onChange={(e) => setPlan(e.target.value as CuentaConfig['plan'])}><option value="inicial">Plan Inicial</option><option value="lider">Plan Líder</option><option value="expansion">Plan Expansión</option></select></Campo>
                  <Campo etiqueta="Socios de la red"><input type="number" min="1" className={`${inputClass} text-right tabular-nums`} value={socios} onChange={(e) => setSocios(Number(e.target.value))} /></Campo>
                </>
              ) : (
                <Campo etiqueta="Motivo del cambio" ayuda="Obligatorio para pausar o reactivar">
                  <textarea rows={3} className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Solicitud de suspensión temporal del líder" />
                </Campo>
              )}
            </div>
            {aviso && <p className="mt-3 text-sm text-rose-600">{aviso}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={modal.tipo === 'crear' ? crear : cambiarEstado}>Confirmar</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
