import type { ReactNode } from 'react';
import {
  BarChart3, Building2, CalendarDays, ChevronDown, Download, FileCheck2,
  Filter, GitCompareArrows, History, LayoutDashboard, LineChart, ListOrdered,
  Lock, MessageSquareText, Network, PieChart, RotateCcw, Settings2, ShieldAlert,
  Sparkles, Target, TrendingUp, UploadCloud, UserCog, UserRound, Users, X,
  Calculator,
} from 'lucide-react';
import type { CuentaId, Rol } from '../types';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { Btn } from './ui';

const NAV: Array<{ titulo: string; items: Array<{ id: Ruta; n: string; label: string; icon: typeof LayoutDashboard }> }> = [
  {
    titulo: 'Operación',
    items: [
      { id: 'dashboard', n: '01', label: 'Inicio / Tablero', icon: LayoutDashboard },
      { id: 'importar', n: '02', label: 'Importar Excel', icon: UploadCloud },
      { id: 'previsualizar', n: '03', label: 'Previsualizar', icon: FileCheck2 },
      { id: 'historial', n: '04', label: 'Historial de cargas', icon: History },
    ],
  },
  {
    titulo: 'Seguimiento',
    items: [
      { id: 'socios', n: '05', label: 'Directorio de socios', icon: Users },
      { id: 'socio', n: '06', label: 'Ficha del socio', icon: UserRound },
      { id: 'lideres', n: '07', label: 'Vista por líderes', icon: Network },
      { id: 'segmentos', n: '08', label: 'Segmentación', icon: Filter },
      { id: 'prioridades', n: '09', label: 'Prioridades', icon: ListOrdered },
      { id: 'agenda', n: '10', label: 'Agenda de campaña', icon: CalendarDays },
      { id: 'contacto', n: '11', label: 'Registro de contacto', icon: UserCog },
      { id: 'plantillas', n: '19', label: 'Plantillas WhatsApp', icon: MessageSquareText },
    ],
  },
  {
    titulo: 'Proyecciones y Analítica',
    items: [
      { id: 'proyeccion', n: '12', label: 'Proyección de campaña', icon: Calculator },
      { id: 'comparacion', n: '13', label: 'Comparación de métodos', icon: GitCompareArrows },
      { id: 'proyeccion-socio', n: '14', label: 'Proyección por socio', icon: Target },
      { id: 'real-vs-esperado', n: '15', label: 'Real vs. Esperado', icon: TrendingUp },
      { id: 'desempeno', n: '16', label: 'Desempeño por líderes', icon: BarChart3 },
      { id: 'distribucion', n: '17', label: 'Distribución de la red', icon: PieChart },
      { id: 'evolucion', n: '18', label: 'Evolución anual', icon: LineChart },
      { id: 'exportar', n: '20', label: 'Exportación', icon: Download },
    ],
  },
  {
    titulo: 'Administración SaaS',
    items: [
      { id: 'cuentas', n: '21', label: 'Gestión de cuentas', icon: Building2 },
      { id: 'planes', n: '22', label: 'Planes y configuración', icon: Settings2 },
    ],
  },
];

export function Layout({
  ruta, navegar, children,
}: { ruta: Ruta; navegar: (r: Ruta) => void; children: ReactNode }) {
  const {
    state, activeCorte, cuentaActual, seleccionarCuenta, reiniciarDemo,
    setLeaderFilter, setRol,
  } = useApp();
  const lideres = Array.from(new Set(activeCorte?.validas.map((s) => String(s.ID_Lider_Subred)) ?? [])).filter(Boolean).sort();
  const esAdmin = state.rol === 'admin';
  const suspendida = cuentaActual?.estado === 'Suspendida';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">RedPulse</p>
            <p className="text-[11px] text-slate-500">Inteligencia comercial para redes</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((grupo) => (
            <div key={grupo.titulo} className="mb-5">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{grupo.titulo}</p>
              <div className="space-y-0.5">
                {grupo.items.map((item) => {
                  const Icono = item.icon;
                  const activo = ruta === item.id;
                  const restringido = esAdmin && !['cuentas', 'planes'].includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navegar(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${activo ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <Icono size={16} className={activo ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="flex-1">{item.label}</span>
                      {restringido ? <Lock size={11} className="text-slate-300" /> : <span className={`text-[10px] tabular-nums ${activo ? 'text-indigo-500' : 'text-slate-300'}`}>{item.n}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Prototipo navegable · Fase 2B<br />Datos ficticios de demostración
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="lg:hidden">
              <select aria-label="Navegación" value={ruta} onChange={(e) => navegar(e.target.value as Ruta)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm">
                {NAV.flatMap((g) => g.items).map((i) => <option key={i.id} value={i.id}>{i.n} · {i.label}</option>)}
              </select>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              <ShieldAlert size={12} /> Entorno de Prototipo · Datos Ficticios de Demostración
            </span>
            <div className="relative">
              <select
                aria-label="Rol activo"
                value={state.rol}
                onChange={(e) => setRol(e.target.value as Rol)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="lider">Líder Titular</option>
                <option value="admin">Administrador del Producto</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2 text-slate-400" />
            </div>
            <div className="relative ml-auto">
              <select
                aria-label="Cuenta activa"
                value={state.cuenta}
                onChange={(e) => seleccionarCuenta(e.target.value as CuentaId)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
              >
                {state.cuentas.map((c) => (
                  <option key={c.id} value={c.id}>Cuenta {c.id}: {c.titular} [{c.socios} socios]{c.estado === 'Suspendida' ? ' · Suspendida' : ''}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2 text-slate-400" />
            </div>
            <Btn variant="ghost" size="sm" onClick={() => void reiniciarDemo()} title="Reiniciar Demo">
              <RotateCcw size={14} /> Reiniciar Demo
            </Btn>
          </div>

          {esAdmin && (
            <div className="flex items-center gap-2 border-t border-indigo-100 bg-indigo-50 px-5 py-1.5 text-xs text-indigo-700">
              <Lock size={12} /> Modo Administrador: acceso restringido a datos privados de socios/redes. Solo gestión de cuentas, planes y auditoría (21–22).
            </div>
          )}
          {suspendida && !esAdmin && (
            <div className="flex flex-wrap items-center gap-2 border-t border-rose-100 bg-rose-50 px-5 py-1.5 text-xs text-rose-700">
              <ShieldAlert size={12} /> Cuenta {state.cuenta} suspendida — acceso a la red bloqueado.
              <button onClick={() => navegar('cuentas')} className="font-semibold underline">Ver regularización</button>
              <button onClick={() => seleccionarCuenta('A')} className="font-semibold underline">Volver a Cuenta A</button>
            </div>
          )}
          {state.leaderFilter && !esAdmin && !suspendida && (
            <div className="flex items-center gap-2 border-t border-indigo-100 bg-indigo-50 px-5 py-1.5 text-xs text-indigo-700">
              <Filter size={12} /> Filtro global de líder activo: <span className="font-semibold">{state.leaderFilter}</span> — se aplica en toda la app
              <button onClick={() => setLeaderFilter(null)} className="ml-auto rounded p-0.5 hover:bg-indigo-100" aria-label="Quitar filtro"><X size={13} /></button>
            </div>
          )}
          <div className="hidden gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 sm:flex">
            {NAV.flatMap((g) => g.items).map((i) => (
              <button key={i.id} onClick={() => navegar(i.id)} className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] ${ruta === i.id ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                {i.n} {i.label}
              </button>
            ))}
            {lideres.length > 0 && !esAdmin && !suspendida && (
              <select aria-label="Filtrar por líder" value={state.leaderFilter ?? ''} onChange={(e) => setLeaderFilter(e.target.value || null)} className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">
                <option value="">Todos los líderes</option>
                {lideres.map((l) => <option key={l} value={l}>Líder {l}</option>)}
              </select>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
