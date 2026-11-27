import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { setSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { fmt, mxn, numero, texto } from '../lib/format';
import { Card, CardHeader, Encabezado, Pill, Vacio, inputClass } from '../components/ui';

const TAMANO_PAGINA = 50;

export function Directory({ navegar }: { navegar: (r: Ruta) => void }) {
  const { sociosActivos } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [lider, setLider] = useState('');
  const [membresia, setMembresia] = useState('');
  const [pedido, setPedido] = useState('');
  const [monedero, setMonedero] = useState(false);
  const [pagina, setPagina] = useState(0);

  const lideres = useMemo(() => Array.from(new Set(sociosActivos.map((s) => String(s.ID_Lider_Subred)))).sort(), [sociosActivos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return sociosActivos.filter((s) => {
      if (q && !`${s.ID_Socio} ${s.Nombre_Completo}`.toLowerCase().includes(q)) return false;
      if (lider && String(s.ID_Lider_Subred) !== lider) return false;
      if (membresia && String(s.Tipo_Membresia) !== membresia) return false;
      if (pedido && String(s.Hizo_Pedido) !== pedido) return false;
      if (monedero && numero(s, 'Saldo_Monedero_MXN') <= 0) return false;
      return true;
    });
  }, [sociosActivos, busqueda, lider, membresia, pedido, monedero]);

  const paginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA));
  const segura = Math.min(pagina, paginas - 1);
  const visibles = filtrados.slice(segura * TAMANO_PAGINA, (segura + 1) * TAMANO_PAGINA);

  const abrir = (id: string) => { setSocioSeleccionado(id); navegar('socio'); };

  return (
    <>
      <Encabezado titulo="Directorio de socios" descripcion={`${fmt(filtrados.length)} de ${fmt(sociosActivos.length)} socios · paginado para 1,500 registros sin lag`} />
      <Card>
        <CardHeader titulo="Filtros" subtitulo="Búsqueda por nombre o ID y filtros combinables" />
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Buscar nombre o ID…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }} />
          </div>
          <select className={inputClass} value={lider} onChange={(e) => { setLider(e.target.value); setPagina(0); }}>
            <option value="">Todos los líderes</option>
            {lideres.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className={inputClass} value={membresia} onChange={(e) => { setMembresia(e.target.value); setPagina(0); }}>
            <option value="">Todas las membresías</option><option value="Socio">Socio</option><option value="Member">Member</option>
          </select>
          <select className={inputClass} value={pedido} onChange={(e) => { setPedido(e.target.value); setPagina(0); }}>
            <option value="">Todos los pedidos</option><option value="Sí">Con pedido</option><option value="No">Sin pedido</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={monedero} onChange={(e) => { setMonedero(e.target.checked); setPagina(0); }} />
            Solo con monedero
          </label>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5">Teléfono</th><th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Líder subred</th><th className="px-4 py-2.5">Segmento</th>
                <th className="px-4 py-2.5">Pedido</th><th className="px-4 py-2.5 text-right">Puntos</th>
                <th className="px-4 py-2.5 text-right">Monedero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((s) => (
                <tr key={String(s.ID_Socio)} onClick={() => abrir(String(s.ID_Socio))} className="cursor-pointer hover:bg-indigo-50/40">
                  <td className="px-4 py-2 tabular-nums text-slate-500">{texto(s, 'ID_Socio')}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">{texto(s, 'Nombre_Completo')}</td>
                  <td className="px-4 py-2 text-slate-500">{texto(s, 'Telefono')}</td>
                  <td className="px-4 py-2 text-slate-500">{texto(s, 'Email')}</td>
                  <td className="px-4 py-2 tabular-nums text-slate-500">{texto(s, 'ID_Lider_Subred')}</td>
                  <td className="px-4 py-2"><Pill>{texto(s, 'Segmento_Estado')}</Pill></td>
                  <td className="px-4 py-2"><Pill tono={String(s.Hizo_Pedido) === 'Sí' ? 'emerald' : 'rose'}>{texto(s, 'Hizo_Pedido')}</Pill></td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{fmt(numero(s, 'Puntos_Personales'))}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{numero(s, 'Saldo_Monedero_MXN') > 0 ? mxn(numero(s, 'Saldo_Monedero_MXN')) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibles.length === 0 && <Vacio mensaje="No hay socios con estos filtros" />}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>Mostrando {fmt(segura * TAMANO_PAGINA + 1)}–{fmt(Math.min((segura + 1) * TAMANO_PAGINA, filtrados.length))} de {fmt(filtrados.length)}</span>
          <div className="flex items-center gap-2">
            <button disabled={segura === 0} onClick={() => setPagina(segura - 1)} className="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40">Anterior</button>
            <span className="tabular-nums">Página {segura + 1} de {paginas}</span>
            <button disabled={segura >= paginas - 1} onClick={() => setPagina(segura + 1)} className="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </Card>
    </>
  );
}
