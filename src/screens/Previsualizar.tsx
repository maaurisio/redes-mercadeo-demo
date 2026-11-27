import { AlertTriangle, CheckCircle2, Copy, FileWarning } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { texto } from '../lib/format';
import { Btn, Card, CardHeader, Encabezado, KpiCard, Pill, Vacio } from '../components/ui';

export function Previsualizar({ navegar }: { navegar: (r: Ruta) => void }) {
  const { preview, activeCorte, confirmarImport, cancelarPreview } = useApp();
  const historico = !preview?.parsed && !!activeCorte;
  const p = preview?.parsed ?? activeCorte;
  const campanaDestino = preview?.campanaDestino ?? activeCorte?.campana ?? 'C15-2026';
  if (!p) {
    return (
      <>
        <Encabezado titulo="Previsualizar importación" descripcion="No hay un archivo en preparación" />
        <Card><Vacio mensaje="Primero analiza un archivo en la pantalla Importar Excel." /></Card>
        <div className="mt-4"><Btn onClick={() => navegar('importar')}>Ir a Importar Excel</Btn></div>
      </>
    );
  }
  const quitados = p.duplicadas.filter((d) => d.omitir).length;

  return (
    <>
      <Encabezado
        titulo="Previsualizar importación"
        descripcion={`${p.fileName} · ${p.totalFilas} filas detectadas · campaña destino ${campanaDestino}${historico ? ' · último corte importado' : ''}`}
        acciones={<Btn variant="outline" onClick={() => navegar('importar')}>Cambiar archivo</Btn>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard etiqueta="Filas válidas" valor={String(p.validas.length)} detalle="listas para importar" tono="emerald" />
        <KpiCard etiqueta="Duplicadas" valor={String(p.duplicadas.length)} detalle={`${quitados} se omitirán`} tono="amber" />
        <KpiCard etiqueta="Observadas" valor={String(p.observadas.length)} detalle="requieren corrección" tono="rose" />
        <KpiCard etiqueta="Total filas" valor={String(p.totalFilas)} detalle="según el archivo" tono="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Filas duplicadas"
            subtitulo="Mismo ID_Socio repetido — marca las que deseas omitir"
            derecha={<Pill tono="amber">{p.duplicadas.length} detectadas</Pill>}
          />
          {p.duplicadas.length === 0 ? <Vacio mensaje="No se detectaron duplicados" /> : (
            <div className="divide-y divide-slate-100">
              {p.duplicadas.map((d) => (
                <label key={`${d.id}-${d.fila}`} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <Copy size={15} className="text-amber-500" />
                  <span className="flex-1">
                    <span className="font-medium text-slate-800">ID_Socio: {d.id}</span>
                    <span className="block text-xs text-slate-500">{d.nombre} · fila {d.fila}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={d.omitir}
                    onChange={(e) => {
                      const obj = p.duplicadas.find((x) => x.id === d.id && x.fila === d.fila);
                      if (obj) obj.omitir = e.target.checked;
                    }}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-xs text-slate-500">Omitir</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            titulo="Filas observadas"
            subtitulo="No se importan: el motivo se muestra tal cual se detectó"
            derecha={<Pill tono="rose">{p.observadas.length} observadas</Pill>}
          />
          {p.observadas.length === 0 ? <Vacio mensaje="No se detectaron observaciones" /> : (
            <div className="divide-y divide-slate-100">
              {p.observadas.map((o, i) => (
                <div key={`${o.fila}-${i}`} className="flex gap-3 px-5 py-3">
                  {o.motivo.includes('Puntos') ? <FileWarning size={16} className="mt-0.5 shrink-0 text-rose-500" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{o.motivo}</p>
                    <p className="text-xs text-slate-500">{o.detalle}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Fila {o.fila} · {o.id ? `ID_Socio ${o.id}` : 'sin ID'} · {texto(o.raw, 'Nombre_Completo')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Se importarán <strong className="tabular-nums text-slate-900">{p.validas.length}</strong> socios válidos al historial sin borrar los cortes anteriores.</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={cancelarPreview}>Cancelar</Btn>
            <Btn variant="emerald" onClick={() => { if (historico) navegar('dashboard'); else { confirmarImport(); navegar('dashboard'); } }}>
              {historico ? 'Ver tablero del corte actual' : 'Confirmar e Importar Corte'}
            </Btn>
          </div>
        </div>
      </Card>
    </>
  );
}
