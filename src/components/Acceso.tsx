import { Building2, Lock, ShieldAlert } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { Btn, Card, Encabezado } from './ui';

export function PantallaRestringida({ navegar }: { navegar: (r: Ruta) => void }) {
  return (
    <>
      <Encabezado titulo="Acceso restringido por rol" descripcion="RN-14 · Privacidad de roles SaaS" />
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Lock size={24} /></span>
        <p className="mt-4 text-lg font-semibold text-slate-900">Modo Administrador del Producto</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Este rol no puede consultar datos privados de socios ni de las redes de las cuentas clientes.
          Puede gestionar cuentas, planes, límites y auditoría en las pantallas 21 y 22.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Btn onClick={() => navegar('cuentas')}><Building2 size={15} /> Gestión de cuentas</Btn>
          <Btn variant="outline" onClick={() => navegar('planes')}>Planes y configuración</Btn>
        </div>
      </Card>
    </>
  );
}

export function PantallaSuspendida() {
  const { state, cuentaActual, seleccionarCuenta, registrarAuditoria } = useApp();
  return (
    <>
      <Encabezado titulo="Cuenta suspendida" descripcion="Flujo F10 · acceso a la red bloqueado" />
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><ShieldAlert size={24} /></span>
        <p className="mt-4 text-lg font-semibold text-slate-900">Cuenta {state.cuenta} · {cuentaActual?.titular}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {cuentaActual?.motivo ?? 'El acceso a la red está pausado. Los datos de socios no se muestran mientras la cuenta esté suspendida.'}
        </p>
        <p className="mt-1 text-xs text-slate-400">Plan {cuentaActual?.plan} · {cuentaActual?.socios} socios registrados</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Btn variant="emerald" onClick={() => registrarAuditoria('Solicitud de regularización', `Solicitud enviada para la cuenta ${state.cuenta}`)}>
            Solicitar regularización
          </Btn>
          <Btn variant="outline" onClick={() => seleccionarCuenta('A')}>Volver a Cuenta A</Btn>
        </div>
        <p className="mt-4 text-xs text-slate-400">La solicitud queda registrada en la auditoría administrativa (RF-64).</p>
      </Card>
    </>
  );
}
