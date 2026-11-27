import { useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt, texto } from '../lib/format';
import { cobertura, notaCobertura, valorMetodo, valoresHistorial } from '../utils/projections';
import { Btn, Card, CardHeader, Encabezado, Pill, Vacio, inputClass } from '../components/ui';

export function ProyeccionSocio() {
  const { sociosActivos, state, setManual, setLeaderFilter } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return sociosActivos.filter((s) => !q || `${s.ID_Socio} ${s.Nombre_Completo}`.toLowerCase().includes(q));
  }, [sociosActivos, busqueda]);

  const abrirEdicion = (id: string) => {
    const actual = state.manuales[id];
    setPuntos(actual?.puntos ?? 100);
    setMotivo(actual?.motivo ?? '');
    setError('');
    setEditando(id);
  };

  const guardar = (id: string) => {
    if (!motivo.trim()) { setError('El motivo es obligatorio para una proyección manual.'); return; }
    setManual(id, puntos, motivo.trim());
    setEditando(null);
  };

  const casos = ['200101', '200102'].map((id) => sociosActivos.find((s) => String(s.ID_Socio) === id)).filter(Boolean);

  return (
    <>
      <Encabezado titulo="Proyección por socio" descripcion="Cobertura real, valor según método activo y edición manual con motivo obligatorio" />
      {casos.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {casos.map((s) => s && (
            <Card key={String(s.ID_Socio)} className="flex items-center gap-3 p-4">
              <Star size={18} className="text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{String(s.ID_Socio)} · {String(s.Nombre_Completo)}</p>
                <p className="text-xs text-slate-500">{notaCobertura(s)}</p>
              </div>
              <Pill tono={cobertura(s).incompleta ? 'amber' : 'emerald'}>{cobertura(s).validos}/17</Pill>
              <span className="text-lg font-semibold tabular-nums text-indigo-600">{fmt(valorMetodo(s, state.metodo, state.manuales[String(s.ID_Socio)]))}</span>
            </Card>
          ))}
          {casos.some((s) => s && cobertura(s).incompleta) && (
            <button onClick={() => setLeaderFilter(null)} className="text-xs text-indigo-600 underline">Quitar filtro de líder si no ves ambos casos</button>
          )}
        </div>
      )}

      <Card>
        <CardHeader titulo={`Socios (${fmt(filtrados.length)})`} subtitulo={`Método activo: ${state.metodo}`} />
        <div className="px-5 py-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Buscar socio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        {filtrados.length === 0 ? <Vacio mensaje="No hay socios con esa búsqueda" /> : (
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                <tr><th className="px-5 py-2">Socio</th><th className="px-5 py-2">Períodos</th><th className="px-5 py-2 text-right">Promedio</th><th className="px-5 py-2 text-right">Mediana</th><th className="px-5 py-2 text-right">Máximo</th><th className="px-5 py-2 text-right">Valor activo</th><th className="px-5 py-2">Origen</th><th className="px-5 py-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((s) => {
                  const id = String(s.ID_Socio);
                  const vals = valoresHistorial(s);
                  const manual = state.manuales[id];
                  return (
                    <tr key={id} className="hover:bg-slate-50">
                      <td className="px-5 py-2"><span className="font-medium text-slate-800">{texto(s, 'Nombre_Completo')}</span><span className="block text-[11px] tabular-nums text-slate-400">{id}</span></td>
                      <td className="px-5 py-2"><Pill tono={cobertura(s).incompleta ? 'amber' : 'emerald'}>{vals.length}/17</Pill></td>
                      <td className="px-5 py-2 text-right tabular-nums">{fmt(vals.reduce((a, b) => a + b, 0) / (vals.length || 1))}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{fmt(valorMetodo(s, 'mediana'))}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{fmt(valorMetodo(s, 'maximo'))}</td>
                      <td className="px-5 py-2 text-right font-semibold tabular-nums text-indigo-600">{fmt(valorMetodo(s, state.metodo, manual))}</td>
                      <td className="px-5 py-2">{manual ? <Pill tono="violet">Manual</Pill> : <Pill>Excel</Pill>}</td>
                      <td className="px-5 py-2"><button onClick={() => abrirEdicion(id)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Editar</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editando && (
        <Card className="mt-5 border-indigo-200">
          <CardHeader titulo={`Proyección manual · ${editando}`} subtitulo="Se etiqueta con origen Manual y no modifica los datos oficiales del Excel" />
          <div className="grid gap-4 p-5 sm:grid-cols-[160px_1fr_auto] sm:items-end">
            <label className="block"><span className="mb-1 block text-xs text-slate-600">Puntos</span><input type="number" min="0" className={`${inputClass} text-right tabular-nums`} value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} /></label>
            <label className="block"><span className="mb-1 block text-xs text-slate-600">Motivo (obligatorio)</span><input className={inputClass} placeholder="Ej. Cliente confirmó interés en pedido de 100 pts" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></label>
            <Btn onClick={() => guardar(editando)}>Guardar manual</Btn>
          </div>
          {error && <p className="px-5 pb-4 text-sm text-rose-600">{error}</p>}
          {state.manuales[editando] && <p className="px-5 pb-4 text-xs text-slate-500">Motivo actual: {state.manuales[editando].motivo}</p>}
        </Card>
      )}
    </>
  );
}
