import { PieChart } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { DonutSVG } from '../components/Charts';
import { Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

const COLORES = ['#4f46e5', '#f59e0b', '#fb923c', '#f97316', '#8b5cf6', '#64748b', '#10b981'];

export function Distribucion({ navegar }: { navegar: (r: Ruta) => void }) {
  const { activeCorte, state, setSegmentoActivo } = useApp();
  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para ver la distribución" /></Card>;
  const k = activeCorte.kpis;
  const partes = [
    { key: 'sin_pedido', label: 'Activos (con pedido)', n: k.activos, color: COLORES[0] },
    { key: 'inactivo_1', label: 'Inactivos 1 campaña', n: k.inactivos1, color: COLORES[1] },
    { key: 'inactivo_2', label: 'Inactivos 2 campañas', n: k.inactivos2, color: COLORES[2] },
    { key: 'inactivo_3', label: 'Inactivos 3 campañas', n: k.inactivos3, color: COLORES[3] },
    { key: 'durmiente', label: 'Durmientes 4–17', n: k.durmientes, color: COLORES[4] },
    { key: 'historico', label: 'Históricos 18–51', n: k.historicos, color: COLORES[5] },
    { key: 'bienvenida', label: 'Programa de Bienvenida', n: k.bienvenida, color: COLORES[6] },
  ];
  const sumaSegmentos = k.activos + k.sinPedido;
  const total = k.total || 1;

  const ir = (key: string) => { setSegmentoActivo(key); navegar('segmentos'); };

  return (
    <>
      <Encabezado titulo="Distribución de la red" descripcion="CA-13 · validación cruzada con la pantalla 08 Segmentación" />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader titulo="Composición" subtitulo={`${fmt(k.total)} socios válidos`} />
          <div className="flex flex-col items-center p-6">
            <DonutSVG
              partes={partes.slice(0, 6).map((p) => ({ label: p.label, value: p.n, color: p.color }))}
              total={k.activos + k.inactivos1 + k.inactivos2 + k.inactivos3 + k.durmientes + k.historicos}
              centro={fmt(k.total)}
            />
            <p className="mt-4 text-xs text-slate-500">Anillo: segmentos excluyentes de RN-04. Bienvenida se muestra aparte por ser un atributo transversal.</p>
          </div>
        </Card>
        <Card>
          <CardHeader titulo="Conteo por segmento" subtitulo="Haz clic en cualquier renglón para abrir su lista filtrada" />
          <div className="divide-y divide-slate-100">
            {partes.map((p) => (
              <button key={p.key} onClick={() => ir(p.key)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <span className="flex-1 text-sm text-slate-700">{p.label}</span>
                <span className="w-32"><span className="block h-1.5 rounded-full bg-slate-100"><span className="block h-1.5 rounded-full" style={{ width: `${(p.n / total) * 100}%`, background: p.color }} /></span></span>
                <span className="w-14 text-right text-sm font-semibold tabular-nums text-slate-900">{fmt(p.n)}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <Pill tono={sumaSegmentos === k.total ? 'emerald' : 'amber'}>
              CA-13: {fmt(k.activos)} activos + {fmt(k.sinPedido)} sin pedido = {fmt(sumaSegmentos)} de {fmt(k.total)}
            </Pill>
            {state.hideBuyers && <span className="ml-2 text-xs text-slate-500">El switch «ocultar con pedido» de la pantalla 08 está activo.</span>}
          </div>
        </Card>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><PieChart size={13} /> Cobertura de bienvenida: {fmt(k.bienvenida)} socios en campañas 1–4 (pueden solaparse con activos o inactivos).</p>
    </>
  );
}
