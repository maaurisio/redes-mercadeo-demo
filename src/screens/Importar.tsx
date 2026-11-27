import { useRef, useState } from 'react';
import { Check, FileSpreadsheet, UploadCloud } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { COLUMNAS } from '../lib/excel';
import { Btn, Card, CardHeader, Campo, Encabezado, Pill, inputClass } from '../components/ui';

const ARCHIVOS = [
  { nombre: '01_Red_Mediana_383_Corte1.xlsx', etiqueta: 'Corte 1 · 383 socios (con filas sucias)' },
  { nombre: '02_Red_Mediana_383_Corte2.xlsx', etiqueta: 'Corte 2 · 383 socios (5 conversiones)' },
  { nombre: '03_Red_Pequena_25_Socios.xlsx', etiqueta: 'Red pequeña · 25 socios' },
  { nombre: '04_Red_Grande_1500_Socios.xlsx', etiqueta: 'Red grande · 1,500 socios' },
  { nombre: '05_Cuenta_B_Aislada_120_Socios.xlsx', etiqueta: 'Cuenta B · 120 socios (aislada)' },
];

export function Importar({ navegar }: { navegar: (r: Ruta) => void }) {
  const {
    quickLoad, cargarArchivo, cargando, error, preview,
    setPreviewCampana, setPreviewMapping, saveMappingTemplate, state,
  } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const columnas = preview?.parsed?.headers ?? COLUMNAS;
  const mapping = preview?.mapping ?? Object.fromEntries(COLUMNAS.map((c) => [c, c]));

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files?.[0];
    if (archivo) await cargarArchivo(archivo);
  };

  return (
    <>
      <Encabezado titulo="Importar Excel" descripcion="Lectura real de archivos .xlsx con SheetJS · 53 columnas detectadas" />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader titulo="Arrastra tu reporte" subtitulo="Formatos aceptados: .xlsx — procesamiento local en el navegador" />
            <div
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => void onDrop(e)}
              className={`m-5 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${arrastrando ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/60'}`}
            >
              <UploadCloud className="mx-auto text-indigo-500" size={34} />
              <p className="mt-3 text-sm font-medium text-slate-700">Suelta aquí el archivo de la red</p>
              <p className="mt-1 text-xs text-slate-500">Se validarán duplicados, observaciones y columnas antes de importar</p>
              <Btn className="mt-4" variant="outline" onClick={() => inputRef.current?.click()} disabled={cargando}>
                Seleccionar archivo
              </Btn>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void cargarArchivo(f); }}
              />
            </div>
            {error && <p className="mx-5 mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          </Card>

          <Card>
            <CardHeader titulo="Carga rápida de prueba" subtitulo="Archivos ficticios generados en data/mock_excel/" />
            <div className="divide-y divide-slate-100">
              {ARCHIVOS.map((a) => (
                <button
                  key={a.nombre}
                  onClick={async () => { await quickLoad(a.nombre, true); navegar('dashboard'); }}
                  disabled={cargando}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FileSpreadsheet size={16} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-800">{a.nombre}</span>
                    <span className="block text-xs text-slate-500">{a.etiqueta}</span>
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">Cargar y aplicar</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader titulo="Campaña destino" subtitulo="Se asigna al corte que se está preparando" />
            <div className="space-y-4 p-5">
              <Campo etiqueta="Campaña">
                <select className={inputClass} value={preview?.campanaDestino ?? 'C15-2026'} onChange={(e) => setPreviewCampana(e.target.value)}>
                  {Array.from({ length: 17 }, (_, i) => `C${i + 1}-2026`).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Duración establecida: <strong>21 días</strong> · 17 campañas por año.
                {preview?.parsed && <> Archivo detectado: <strong>{preview.parsed.fileName}</strong> · {preview.parsed.totalFilas} filas.</>}
              </div>
              {preview ? (
                <Btn className="w-full" onClick={() => navegar('previsualizar')}>Ver previsualización <Check size={15} /></Btn>
              ) : (
                <p className="text-xs text-slate-500">Carga un archivo para habilitar la previsualización.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Mapeo de columnas"
              subtitulo="53 columnas del esquema canónico"
              derecha={<Btn size="sm" variant="outline" onClick={saveMappingTemplate}>Guardar plantilla</Btn>}
            />
            <div className="max-h-[430px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-4 py-2">Detectada</th><th className="px-4 py-2">Destino</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {columnas.map((col) => (
                    <tr key={col}>
                      <td className="px-4 py-1.5 text-slate-600">{col}</td>
                      <td className="px-4 py-1.5">
                        <select
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                          value={mapping[col] ?? col}
                          onChange={(e) => setPreviewMapping(col, e.target.value)}
                        >
                          {COLUMNAS.map((dest) => <option key={dest} value={dest}>{dest}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Pill tono={Object.keys(state.mappingTemplate).length ? 'emerald' : 'slate'}>
                {Object.keys(state.mappingTemplate).length ? 'Plantilla guardada' : 'Sin plantilla guardada'}
              </Pill>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
