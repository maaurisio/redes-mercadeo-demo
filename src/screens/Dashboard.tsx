import { ArrowRight, CalendarDays, FileSpreadsheet, Filter, MessageSquareText, Network, Users } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { brechaTexto, fmt, mxn, pct } from '../lib/format';
import { Barra, Btn, Card, CardHeader, Encabezado, KpiCard, Pill, Vacio } from '../components/ui';

export function Dashboard({ navegar }: { navegar: (r: Ruta) => void }) {
  const { state, activeCorte, sociosActivos } = useApp();
  if (state.cuenta === 'C') {
    return <Encabezado titulo="Cuenta suspendida" descripcion="No hay datos disponibles para este perfil." />;
  }
  if (!activeCorte) {
    return <Card><Vacio mensaje="Cargando el corte inicial…" /></Card>;
  }

  const k = activeCorte.kpis;
  const numeroCampana = activeCorte.campana.match(/C(\d+)/)?.[1] ?? '15';
  const anio = activeCorte.campana.match(/-(\d{4})/)?.[1] ?? '2026';
  const puntosFiltrados = sociosActivos.reduce((a, s) => a + (typeof s.Puntos_Personales === 'number' ? s.Puntos_Personales : 0), 0);
  const pending = [
    { label: 'Sin pedido en campaña actual', n: k.sinPedido, ruta: 'segmentos' as Ruta, tono: 'rose' },
    { label: 'Compraron la pasada y aún no esta', n: k.comproAntes, ruta: 'segmentos' as Ruta, tono: 'amber' },
    { label: 'Con monedero y sin pedido', n: k.monederoSinPedido, ruta: 'segmentos' as Ruta, tono: 'emerald' },
    { label: 'Durmientes sin catálogo impreso', n: k.durmientes, ruta: 'plantillas' as Ruta, tono: 'violet' },
  ];

  return (
    <>
      <Encabezado
        titulo="Tablero general"
        descripcion={`Cuenta ${state.cuenta} · ${activeCorte.fileName}`}
        acciones={<Btn onClick={() => navegar('importar')}><FileSpreadsheet size={15} /> Importar corte</Btn>}
      />

      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 text-white">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-100">Campaña vigente</p>
            <h2 className="mt-1 text-2xl font-bold">Campaña {numeroCampana} · Día {activeCorte.diaCampana} de 21</h2>
            <p className="mt-1 text-sm text-indigo-100">{anio} · 17 campañas al año · Corte del {activeCorte.fechaCorte}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-100">Incentivo alcanzado</p>
            <p className="text-3xl font-semibold tabular-nums">{pct(k.incentivo)}</p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="mb-2 flex items-end justify-between text-sm">
            <span className="text-slate-600">Avance de puntos vs. meta</span>
            <span className="font-semibold tabular-nums text-slate-900">{fmt(puntosFiltrados)} / {fmt(k.meta)} pts</span>
          </div>
          <Barra valor={puntosFiltrados} maximo={k.meta} tono={k.brecha > 0 ? 'bg-indigo-600' : 'bg-emerald-500'} />
          <p className={`mt-2 text-sm font-medium ${k.brecha > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {brechaTexto(k.brecha)}
          </p>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard etiqueta="Total red" valor={fmt(k.total)} detalle="socios válidos" tono="slate" />
        <KpiCard etiqueta="Activos con pedido" valor={fmt(k.activos)} detalle="campaña vigente" tono="emerald" />
        <KpiCard etiqueta="Sin pedido" valor={fmt(k.sinPedido)} detalle="pendientes de gestión" tono="rose" />
        <KpiCard etiqueta="Puntos actuales" valor={fmt(k.puntos)} detalle="pedidos confirmados" />
        <KpiCard etiqueta="Meta" valor={fmt(k.meta)} detalle="red principal" tono="slate" />
        <KpiCard etiqueta="Brecha" valor={k.brecha > 0 ? `+${fmt(k.brecha)}` : `+${fmt(Math.abs(k.brecha))}`} detalle={k.brecha > 0 ? 'puntos faltantes' : 'meta superada'} tono={k.brecha > 0 ? 'amber' : 'emerald'} />
        <KpiCard etiqueta="Nivel incentivo" valor={pct(k.incentivo)} detalle="escala de red" tono="indigo" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Accesos directos" subtitulo="Flujos principales de la campaña" />
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {[
              { r: 'socios' as Ruta, t: 'Directorio de socios', i: Users, d: `${fmt(k.total)} registros` },
              { r: 'lideres' as Ruta, t: 'Vista por líderes', i: Network, d: 'Subredes e incentivos' },
              { r: 'agenda' as Ruta, t: 'Agenda de 21 días', i: CalendarDays, d: `Día ${activeCorte.diaCampana}` },
              { r: 'plantillas' as Ruta, t: 'Plantillas WhatsApp', i: MessageSquareText, d: 'Apoyo manual' },
            ].map((a) => {
              const Icono = a.i;
              return (
                <button key={a.r} onClick={() => navegar(a.r)} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icono size={17} /></span>
                  <span className="flex-1"><span className="block text-sm font-medium text-slate-800">{a.t}</span><span className="block text-xs text-slate-500">{a.d}</span></span>
                  <ArrowRight size={15} className="text-slate-300" />
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader titulo="Pendientes del día" subtitulo={`Monedero disponible: ${mxn(activeCorte.validas.reduce((a, s) => a + (typeof s.Saldo_Monedero_MXN === 'number' ? s.Saldo_Monedero_MXN : 0), 0))}`} />
          <div className="divide-y divide-slate-100">
            {pending.map((p) => (
              <button key={p.label} onClick={() => navegar(p.ruta)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                <Pill tono={p.tono}>{p.label}</Pill>
                <span className="ml-auto text-sm font-semibold tabular-nums text-slate-900">{fmt(p.n)}</span>
                <ArrowRight size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <button onClick={() => navegar('segmentos')} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              <Filter size={14} /> Abrir segmentación inteligente <ArrowRight size={14} />
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
