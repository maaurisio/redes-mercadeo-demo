import { useMemo, useState } from 'react';
import { ArrowRight, Cake, CreditCard, Gift, Mail, Phone, UserRound } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { getSocioSeleccionado, setSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { esCumpleanero, fecha, fmt, mxn, numero, texto } from '../lib/format';
import { Btn, Card, CardHeader, Encabezado, KpiCard, Pill, Vacio, inputClass } from '../components/ui';

function etiquetaHist(k: number): string {
  const idx = 31 - k;
  const anio = 2025 + Math.floor(idx / 17);
  const n = (((idx % 17) + 17) % 17) + 1;
  return `C${n}-${anio}`;
}

export function SocioDetalle({ navegar }: { navegar: (r: Ruta) => void }) {
  const { sociosActivos, state } = useApp();
  const [id, setId] = useState<string>(() => getSocioSeleccionado() ?? '200101');
  const socio = sociosActivos.find((s) => String(s.ID_Socio) === id) ?? sociosActivos[0];

  const historial = useMemo(() => Array.from({ length: 17 }, (_, i) => {
    const columna = `Pts_Camp_Ant_${String(i + 1).padStart(2, '0')}`;
    const v = socio?.[columna];
    return { k: i + 1, columna, campana: etiquetaHist(i + 1), valor: v === null || v === undefined ? null : Number(v) };
  }), [socio]);
  const valores = historial.map((h) => h.valor).filter((v): v is number => v !== null);
  const promedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  const mediana = valores.length ? [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)] : 0;
  const maximo = valores.length ? Math.max(...valores) : 0;
  const gestiones = state.contactos.filter((c) => c.socioId === String(socio?.ID_Socio));

  if (!socio) return <Card><Vacio mensaje="No hay socios cargados en la cuenta activa" /></Card>;

  const cambiar = (nuevo: string) => { setSocioSeleccionado(nuevo); setId(nuevo); };

  return (
    <>
      <Encabezado
        titulo="Ficha del socio"
        descripcion="Detalle integral del socio, su historial real de campañas y gestiones registradas"
        acciones={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => cambiar('200101')}>Caso 17 campañas</Btn>
            <Btn variant="outline" size="sm" onClick={() => cambiar('200102')}>Caso 5 campañas</Btn>
            <Btn onClick={() => { setSocioSeleccionado(String(socio.ID_Socio)); navegar('contacto'); }}>Registrar compromiso <ArrowRight size={14} /></Btn>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Seleccionar socio</label>
          <select className={inputClass} value={String(socio.ID_Socio)} onChange={(e) => cambiar(e.target.value)}>
            {sociosActivos.map((s) => <option key={String(s.ID_Socio)} value={String(s.ID_Socio)}>{String(s.ID_Socio)} · {String(s.Nombre_Completo)}</option>)}
          </select>
        </div>
        <Card className="col-span-2 flex items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><UserRound size={18} /></span>
          <div>
            <p className="font-semibold text-slate-900">{texto(socio, 'Nombre_Completo')}</p>
            <p className="text-xs text-slate-500">ID {texto(socio, 'ID_Socio')} · {texto(socio, 'Tipo_Membresia')} · {texto(socio, 'Nivel_Jerarquico')}</p>
          </div>
          {esCumpleanero(socio) && <Pill tono="rose"><Cake size={11} /> Cumpleaños en campaña</Pill>}
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard etiqueta="Puntos personales" valor={fmt(numero(socio, 'Puntos_Personales'))} detalle="campaña vigente" />
        <KpiCard etiqueta="Saldo monedero" valor={mxn(numero(socio, 'Saldo_Monedero_MXN'))} detalle="disponible" tono="emerald" />
        <KpiCard etiqueta="Sin pedido" valor={fmt(numero(socio, 'Campanas_Sin_Pedido'))} detalle="campañas consecutivas" tono="rose" />
        <KpiCard etiqueta="Histórico válido" valor={`${valores.length} / 17`} detalle="períodos con datos" tono="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Datos de contacto y jerarquía" />
          <div className="divide-y divide-slate-100 px-5 text-sm">
            {[
              { i: Phone, k: 'Teléfono', v: texto(socio, 'Telefono') },
              { i: Mail, k: 'Email', v: texto(socio, 'Email') },
              { i: UserRound, k: 'Líder directo', v: `${texto(socio, 'ID_Lider_Directo')} · ${texto(socio, 'Nombre_Lider_Directo')}` },
              { i: CreditCard, k: 'Crédito', v: `${mxn(numero(socio, 'Saldo_Credito_MXN'))} de ${mxn(numero(socio, 'Limite_Credito_MXN'))}` },
              { i: Gift, k: 'Premio', v: texto(socio, 'Premio_Ganado_Campana') },
            ].map((f) => {
              const Icono = f.i;
              return <div key={f.k} className="flex items-center gap-3 py-2.5"><Icono size={15} className="text-slate-400" /><span className="w-28 text-slate-500">{f.k}</span><span className={`font-medium ${f.v === 'N/D' ? 'text-slate-400' : 'text-slate-800'}`}>{f.v}</span></div>;
            })}
            <div className="flex items-center gap-3 py-2.5 text-sm"><span className="w-28 text-slate-500">Inscripción</span><span className="font-medium text-slate-800">{fecha(socio, 'Fecha_Inscripcion')}</span></div>
            <div className="flex items-center gap-3 py-2.5 text-sm"><span className="w-28 text-slate-500">Nacimiento</span><span className="font-medium text-slate-800">{fecha(socio, 'Fecha_Nacimiento')}</span></div>
            <div className="flex items-center gap-3 py-2.5 text-sm"><span className="w-28 text-slate-500">Catálogo impreso</span><Pill tono={texto(socio, 'Recibe_Catalogo_Impreso') === 'Sí' ? 'emerald' : 'amber'}>{texto(socio, 'Recibe_Catalogo_Impreso')}</Pill></div>
            <div className="flex items-center gap-3 py-2.5 text-sm"><span className="w-28 text-slate-500">Bienvenida</span><Pill tono="indigo">{texto(socio, 'Nivel_Programa_Bienvenida')}</Pill></div>
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Historial de 17 campañas anteriores" subtitulo={`Cobertura real: ${valores.length} de 17 períodos con historial`} />
          <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-5 py-4">
            <KpiCard etiqueta="Promedio anterior" valor={fmt(Math.round(promedio * 100) / 100)} tono="slate" />
            <KpiCard etiqueta="Mediana" valor={fmt(mediana)} tono="indigo" />
            <KpiCard etiqueta="Máximo anterior" valor={fmt(maximo)} tono="emerald" />
          </div>
          <div className="max-h-[330px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-5 py-2">Campaña</th><th className="px-5 py-2 text-right">Puntos</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((h) => (
                  <tr key={h.columna}><td className="px-5 py-1.5 text-slate-500">{h.campana}</td><td className="px-5 py-1.5 text-right tabular-nums">{h.valor === null ? <span className="text-slate-300">—</span> : fmt(h.valor)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader titulo="Historial de gestiones" subtitulo="Compromisos manuales — estimaciones, no pedidos confirmados" />
        {gestiones.length === 0 ? <Vacio mensaje="Sin gestiones registradas para este socio" /> : (
          <div className="divide-y divide-slate-100">
            {gestiones.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <Pill tono="indigo">{g.canal}</Pill>
                <span className="text-slate-600">{g.observaciones || 'Sin observaciones'}</span>
                <span className="ml-auto text-xs text-slate-500">Seguimiento: {g.fechaSeguimiento}</span>
                <Pill tono="amber">{g.puntosPrometidos} pts prometidos</Pill>
                <Pill tono="emerald">{g.estado}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
