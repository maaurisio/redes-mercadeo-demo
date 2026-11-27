import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../state/AppContext';
import { fmt, incentivo, numero, texto } from '../lib/format';
import { SEGMENTOS, puntosPotenciales } from '../lib/segmentos';
import { METODOS, brechaMeta, valorMetodo } from '../utils/projections';
import type { Metodo } from '../utils/projections';
import { Btn, Card, CardHeader, Encabezado, Vacio } from '../components/ui';

export function Exportar() {
  const { state, activeCorte, sociosActivos, cuentaActual } = useApp();

  const metadatos = () => [
    { Campo: 'Cuenta activa', Valor: `Cuenta ${state.cuenta} · ${cuentaActual?.titular ?? 'N/D'}` },
    { Campo: 'Campaña', Valor: activeCorte?.campana ?? 'N/D' },
    { Campo: 'Día de campaña', Valor: activeCorte?.diaCampana ?? 'N/D' },
    { Campo: 'Fecha de corte', Valor: activeCorte?.fechaCorte ?? 'N/D' },
    { Campo: 'Archivo origen', Valor: activeCorte?.fileName ?? 'N/D' },
    { Campo: 'Rol', Valor: state.rol === 'admin' ? 'Administrador del Producto' : 'Líder Titular' },
    { Campo: 'Nota de entorno', Valor: 'ENTORNO DE PROTOTIPO · DATOS FICTICIOS DE DEMOSTRACIÓN (RF-50)' },
    { Campo: 'Generado', Valor: new Date().toLocaleString('es-MX') },
  ];

  const exportar = (nombre: string, hoja: string, filas: Array<Record<string, string | number>>) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), hoja);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metadatos()), 'Metadatos');
    XLSX.writeFile(wb, nombre);
  };

  const seguimiento = () => {
    const filas: Array<Record<string, string | number>> = [];
    state.priorities.forEach((clave, prioridad) => {
      const def = SEGMENTOS.find((s) => s.key === clave);
      if (!def) return;
      sociosActivos.filter(def.test).forEach((s) => filas.push({
        Prioridad: prioridad + 1,
        Segmento: def.nombre,
        ID_Socio: texto(s, 'ID_Socio'),
        Nombre: texto(s, 'Nombre_Completo'),
        Lider_Subred: texto(s, 'ID_Lider_Subred'),
        Puntos_Anteriores: numero(s, 'Pts_Camp_Ant_01'),
        Saldo_Monedero_MXN: numero(s, 'Saldo_Monedero_MXN'),
        Telefono: texto(s, 'Telefono'),
      }));
    });
    exportar('redpulse_seguimiento.xlsx', 'Seguimiento', filas);
  };

  const comparativa = () => {
    const lideres = Array.from(new Set(sociosActivos.map((s) => String(s.ID_Lider_Subred)))).sort();
    const filas: Array<Record<string, string | number>> = [];
    lideres.forEach((lid) => {
      const grupo = sociosActivos.filter((s) => String(s.ID_Lider_Subred) === lid);
      const fila: Record<string, string | number> = {
        ID_Lider: lid,
        Nombre_Lider: texto(grupo[0], 'Nombre_Lider_Subred'),
        Socios: grupo.length,
        Puntos_Reales: grupo.reduce((a, s) => a + numero(s, 'Puntos_Personales'), 0),
      };
      METODOS.forEach((m) => {
        const total = grupo.reduce((a, s) => a + valorMetodo(s, m.key as Metodo, state.manuales[String(s.ID_Socio)]), 0);
        fila[m.etiqueta] = Math.round(total);
        fila[`Incentivo_${m.etiqueta}`] = `${incentivo(total)}%`;
      });
      filas.push(fila);
    });
    exportar('redpulse_proyecciones_por_lider.xlsx', 'Comparativa', filas);
  };

  const ejecutivo = () => {
    const k = activeCorte?.kpis;
    const b = brechaMeta(k?.meta ?? 0, k?.puntos ?? 0);
    exportar('redpulse_resumen_ejecutivo.xlsx', 'Resumen', [{
      Campana: activeCorte?.campana ?? 'N/D',
      Corte: activeCorte?.fileName ?? 'N/D',
      Socios_Totales: k?.total ?? 0,
      Activos: k?.activos ?? 0,
      Sin_Pedido: k?.sinPedido ?? 0,
      Durmientes: k?.durmientes ?? 0,
      Historicos: k?.historicos ?? 0,
      Bienvenida: k?.bienvenida ?? 0,
      Puntos_Reales: k?.puntos ?? 0,
      Meta: k?.meta ?? 0,
      Faltante: b.faltante,
      Excedente: b.excedente,
      Incentivo: `${k?.incentivo ?? 0}%`,
      Linea_Base: state.lineaBase?.puntos ?? 0,
      Metodo_Activo: state.metodo,
      Factor: state.factor,
    }]);
  };

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para exportar" /></Card>;

  const reportes = [
    { titulo: 'Lista priorizada de seguimiento', desc: `${fmt(sociosActivos.length)} socios ordenados por las prioridades de la pantalla 09`, action: seguimiento, icon: FileSpreadsheet },
    { titulo: 'Comparativa de proyecciones por líder', desc: 'Promedio, mediana, máximo anterior y manual con su incentivo', action: comparativa, icon: FileSpreadsheet },
    { titulo: 'Resumen ejecutivo de campaña', desc: 'KPIs, brecha, línea base y método activo', action: ejecutivo, icon: FileSpreadsheet },
  ];

  return (
    <>
      <Encabezado titulo="Exportación de resultados" descripcion="Archivos .xlsx reales generados en el navegador con SheetJS (RF-50)" />
      <div className="grid gap-4 lg:grid-cols-3">
        {reportes.map((r) => {
          const Icono = r.icon;
          return (
            <Card key={r.titulo} className="flex flex-col p-5">
              <Icono className="text-indigo-600" size={22} />
              <p className="mt-3 text-base font-semibold text-slate-900">{r.titulo}</p>
              <p className="mt-1 flex-1 text-sm text-slate-500">{r.desc}</p>
              <Btn className="mt-4" onClick={r.action}><Download size={15} /> Descargar .xlsx</Btn>
            </Card>
          );
        })}
      </div>
      <Card className="mt-5">
        <CardHeader titulo="Metadatos incluidos en cada archivo" subtitulo="Hoja «Metadatos» automática" />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {metadatos().map((m) => (
            <div key={m.Campo}><p className="text-[11px] uppercase tracking-wide text-slate-400">{m.Campo}</p><p className="text-sm font-medium text-slate-800">{String(m.Valor)}</p></div>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-xs text-slate-400">Puntos potenciales en la selección: {fmt(puntosPotenciales(sociosActivos))} pts</p>
    </>
  );
}
