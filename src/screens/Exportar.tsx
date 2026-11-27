import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { fmt, incentivo, numero, texto } from '../lib/format';
import { SEGMENTOS, puntosPotenciales } from '../lib/segmentos';
import { serieAnual } from '../utils/anual';
import {
  cobertura, notaCobertura, proyectar, valorMetodo, variacion, brechaMeta,
} from '../utils/projections';
import type { Metodo } from '../utils/projections';
import {
  PALETA, FORMATO, autoAncho, crearHoja, descargarLibro, escribirEncabezados,
  escribirFila, escribirTotales, hojaMetadatos, nuevoLibro,
} from '../utils/excelExportStyled';
import { Btn, Card, CardHeader, Encabezado, Vacio } from '../components/ui';

type ValorCelda = string | number | { formula: string; result?: number };

export function Exportar() {
  const { state, activeCorte, sociosActivos, cuentaActual } = useApp();
  const [generando, setGenerando] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const sufijo = `Cuenta_${state.cuenta}_${(activeCorte?.campana ?? 'C15-2026').replace('-', '_')}`;
  const metadatos = useMemo(() => [
    { Campo: 'Cuenta activa', Valor: `Cuenta ${state.cuenta} · ${cuentaActual?.titular ?? 'N/D'}` },
    { Campo: 'Campaña', Valor: activeCorte?.campana ?? 'N/D' },
    { Campo: 'Fecha de corte', Valor: activeCorte?.fechaCorte ?? 'N/D' },
    { Campo: 'Día de campaña', Valor: String(activeCorte?.diaCampana ?? 'N/D') },
    { Campo: 'Archivo origen', Valor: activeCorte?.fileName ?? 'N/D' },
    { Campo: 'Rol activo', Valor: state.rol === 'admin' ? 'Administrador del Producto' : 'Líder Titular' },
    { Campo: 'Nota de entorno', Valor: 'ENTORNO DE PROTOTIPO · DATOS FICTICIOS DE DEMOSTRACIÓN (RF-50)' },
    { Campo: 'Generado', Valor: new Date().toLocaleString('es-MX') },
  ], [state.cuenta, state.rol, cuentaActual, activeCorte]);

  const ejecutar = async (clave: string, nombre: string, fn: () => Promise<void>) => {
    setGenerando(clave);
    setAviso('');
    try {
      await fn();
      setAviso(`${nombre} generado correctamente.`);
    } catch (e) {
      setAviso(`Error al generar ${nombre}: ${e instanceof Error ? e.message : 'desconocido'}`);
    } finally {
      setGenerando(null);
    }
  };

  const seguimiento = async () => {
    const wb = nuevoLibro();
    const columnas = 12;
    const ws = crearHoja(
      wb, 'Seguimiento Priorizado',
      `Lista Priorizada de Seguimiento · Cuenta ${state.cuenta} · ${activeCorte?.campana ?? ''}`,
      `${sociosActivos.length} socios · ${fmt(puntosPotenciales(sociosActivos))} pts potenciales · orden según pantalla 09`,
      columnas,
    );
    const encabezados = [
      'Prioridad #', 'Segmento', 'ID Socio', 'Nombre Completo', 'Teléfono', 'Email',
      'Líder Subred', 'Campañas Inactivo', 'Monedero MXN', 'Prom. Histórico Pts',
      'Estado Gestión', 'Próximo Seguimiento',
    ];
    escribirEncabezados(ws, 4, encabezados);

    const filas: Array<{ socio: typeof sociosActivos[number]; clave: string; prioridad: number }> = [];
    state.priorities.forEach((clave, idx) => {
      const def = SEGMENTOS.find((s) => s.key === clave);
      if (!def) return;
      sociosActivos.filter(def.test).forEach((socio) => filas.push({ socio, clave, prioridad: idx + 1 }));
    });

    filas.forEach((f, i) => {
      const s = f.socio;
      const gest = state.contactos.find((c) => c.socioId === String(s.ID_Socio));
      const rellenoSegmento = ['bienvenida', 'monedero'].includes(f.clave)
        ? { relleno: PALETA.verdeMentana, colorTexto: PALETA.verdeTexto }
        : f.clave.startsWith('inactivo')
          ? { relleno: PALETA.amber, colorTexto: PALETA.amberTexto }
          : f.clave === 'durmiente'
            ? { relleno: PALETA.rosa, colorTexto: PALETA.rosaTexto }
            : { relleno: PALETA.zebra, colorTexto: PALETA.texto };
      const saldo = numero(s, 'Saldo_Monedero_MXN');
      escribirFila(ws, 5 + i, [
        f.prioridad,
        SEGMENTOS.find((d) => d.key === f.clave)?.nombre ?? f.clave,
        texto(s, 'ID_Socio'), texto(s, 'Nombre_Completo'), texto(s, 'Telefono'), texto(s, 'Email'),
        texto(s, 'ID_Lider_Subred'), numero(s, 'Campanas_Sin_Pedido'), saldo,
        Math.round(valorMetodo(s, 'promedio') * 100) / 100,
        gest?.estado ?? 'Pendiente', gest?.fechaSeguimiento ?? 'N/D',
      ], {
        zebra: true,
        formatos: { 8: FORMATO.entero, 9: FORMATO.moneda, 10: FORMATO.entero },
        alineaciones: { 1: 'center', 8: 'right', 9: 'right', 10: 'right' },
        celdas: [
          { columna: 2, ...rellenoSegmento, negrita: true },
          ...(saldo > 0 ? [{ columna: 9, relleno: PALETA.esmeralda, colorTexto: PALETA.verdeTexto, negrita: true, formato: FORMATO.moneda }] : []),
        ],
      });
    });
    const ultima = 4 + filas.length;
    escribirTotales(ws, ultima + 1, [
      'TOTALES', `${filas.length} socios`, '', '', '', '', '', '',
      { formula: `SUM(I5:I${ultima})`, result: filas.reduce((a, f) => a + numero(f.socio, 'Saldo_Monedero_MXN'), 0) },
      { formula: `SUM(J5:J${ultima})`, result: filas.reduce((a, f) => a + valorMetodo(f.socio, 'promedio'), 0) },
      '', '',
    ], { 9: FORMATO.moneda, 10: FORMATO.entero });
    autoAncho(ws);
    hojaMetadatos(wb, metadatos);
    await descargarLibro(wb, `Lista_Priorizada_Seguimiento_${sufijo}.xlsx`);
  };

  const comparativa = async () => {
    const wb = nuevoLibro();
    const columnas = 12;
    const ws = crearHoja(
      wb, 'Proyecciones por Líder',
      `Comparativa de Proyecciones por Líder · Cuenta ${state.cuenta}`,
      `Método activo: ${state.metodo} · factor ${state.factor.toFixed(2)}x · RN-09: supuesto configurable, no probabilidad validada`,
      columnas,
    );
    const encabezados = [
      'ID Líder', 'Nombre Líder', 'Total Socios', 'Activos', 'Puntos Reales',
      'Proy. Promedio', 'Proy. Mediana', 'Proy. Máximo Ant.', 'Proy. Ajustada (Activa)',
      'Meta Subred', 'Brecha', '% Incentivo',
    ];
    escribirEncabezados(ws, 4, encabezados);
    const columnaMetodo: Record<Metodo, number> = {
      promedio: 6, mediana: 7, maximo: 8, manual: 9,
    };
    const totalSocios = sociosActivos.length || 1;
    const lideres = Array.from(new Set(sociosActivos.map((s) => String(s.ID_Lider_Subred)))).sort();
    const meta = activeCorte?.kpis.meta ?? 0;

    lideres.forEach((lid, i) => {
      const grupo = sociosActivos.filter((s) => String(s.ID_Lider_Subred) === lid);
      const puntos = grupo.reduce((a, s) => a + numero(s, 'Puntos_Personales'), 0);
      const activos = grupo.filter((s) => numero(s, 'Campanas_Sin_Pedido') === 0).length;
      const proyectado = (m: Metodo) => grupo.reduce((a, s) => a + valorMetodo(s, m, state.manuales[String(s.ID_Socio)]), 0);
      const ajustada = proyectar(grupo, state.metodo, state.factor, state.manuales).ajustada;
      const metaSubred = Math.round(meta * (grupo.length / totalSocios));
      const porcentaje = incentivo(puntos);
      const colorIncentivo = porcentaje >= 25 ? PALETA.esmeralda : porcentaje >= 15 ? 'FFE0E7FF' : PALETA.amber;
      escribirFila(ws, 5 + i, [
        lid, texto(grupo[0], 'Nombre_Lider_Subred'), grupo.length, activos, puntos,
        Math.round(proyectado('promedio')), Math.round(proyectado('mediana')), Math.round(proyectado('maximo')),
        ajustada, metaSubred, Math.max(0, metaSubred - puntos), porcentaje / 100,
      ], {
        zebra: true,
        formatos: { 3: FORMATO.entero, 4: FORMATO.entero, 5: FORMATO.entero, 6: FORMATO.entero, 7: FORMATO.entero, 8: FORMATO.entero, 9: FORMATO.entero, 10: FORMATO.entero, 11: FORMATO.entero, 12: FORMATO.porcentaje },
        alineaciones: { 3: 'right', 4: 'right', 5: 'right', 6: 'right', 7: 'right', 8: 'right', 9: 'right', 10: 'right', 11: 'right', 12: 'center' },
        celdas: [
          { columna: columnaMetodo[state.metodo], relleno: PALETA.totales, negrita: true },
          { columna: 12, relleno: colorIncentivo, negrita: true, formato: FORMATO.porcentaje },
        ],
      });
    });
    const ultima = 4 + lideres.length;
    const totalPuntos = sociosActivos.reduce((a, s) => a + numero(s, 'Puntos_Personales'), 0);
    escribirTotales(ws, ultima + 1, [
      'TOTALES', `${lideres.length} líderes`,
      { formula: `SUM(C5:C${ultima})`, result: sociosActivos.length },
      { formula: `SUM(D5:D${ultima})`, result: sociosActivos.filter((s) => numero(s, 'Campanas_Sin_Pedido') === 0).length },
      { formula: `SUM(E5:E${ultima})`, result: totalPuntos },
      { formula: `SUM(F5:F${ultima})`, result: Math.round(sociosActivos.reduce((a, s) => a + valorMetodo(s, 'promedio'), 0)) },
      { formula: `SUM(G5:G${ultima})`, result: sociosActivos.reduce((a, s) => a + valorMetodo(s, 'mediana'), 0) },
      { formula: `SUM(H5:H${ultima})`, result: sociosActivos.reduce((a, s) => a + valorMetodo(s, 'maximo'), 0) },
      { formula: `SUM(I5:I${ultima})`, result: proyectar(sociosActivos, state.metodo, state.factor, state.manuales).ajustada },
      { formula: `SUM(J5:J${ultima})`, result: meta },
      { formula: `SUM(K5:K${ultima})`, result: Math.max(0, meta - totalPuntos) },
      { formula: `IF(E${ultima + 1}>=7500,0.25,IF(E${ultima + 1}>=5500,0.18,IF(E${ultima + 1}>=3500,0.15,IF(E${ultima + 1}>=2000,0.12,IF(E${ultima + 1}>=1000,0.09,IF(E${ultima + 1}>=500,0.06,IF(E${ultima + 1}>=250,0.03,0))))))))`, result: incentivo(totalPuntos) / 100 },
    ], { 3: FORMATO.entero, 4: FORMATO.entero, 5: FORMATO.entero, 6: FORMATO.entero, 7: FORMATO.entero, 8: FORMATO.entero, 9: FORMATO.entero, 10: FORMATO.entero, 11: FORMATO.entero, 12: FORMATO.porcentaje });
    autoAncho(ws);

    const detalle = crearHoja(
      wb, 'Detalle por Socio', 'Detalle individual de proyecciones',
      'RF-42 / CA-11 · las filas ámbar tienen historial parcial (menos de 17 períodos)', 11,
    );
    escribirEncabezados(detalle, 4, [
      'ID Socio', 'Nombre', 'Líder', 'Cobertura Historial', 'Puntos Reales', 'Promedio',
      'Mediana', 'Máximo Ant.', 'Manual', 'Proyección Activa', 'Nota de Cobertura',
    ]);
    sociosActivos.forEach((s, i) => {
      const idSocio = String(s.ID_Socio);
      const manual = state.manuales[idSocio];
      const c = cobertura(s);
      escribirFila(detalle, 5 + i, [
        idSocio, texto(s, 'Nombre_Completo'), texto(s, 'ID_Lider_Subred'),
        `${c.validos}/17`, numero(s, 'Puntos_Personales'),
        Math.round(valorMetodo(s, 'promedio') * 100) / 100,
        Math.round(valorMetodo(s, 'mediana') * 100) / 100,
        valorMetodo(s, 'maximo'), manual?.puntos ?? '',
        Math.round(valorMetodo(s, state.metodo, manual) * 100) / 100,
        notaCobertura(s),
      ], {
        zebra: true,
        formatos: { 5: FORMATO.entero, 6: FORMATO.entero, 7: FORMATO.entero, 8: FORMATO.entero, 9: FORMATO.entero, 10: FORMATO.entero },
        alineaciones: { 4: 'center', 5: 'right', 6: 'right', 7: 'right', 8: 'right', 9: 'right', 10: 'right' },
        celdas: c.incompleta ? [{ columna: 4, relleno: PALETA.amber, colorTexto: PALETA.amberTexto, negrita: true }] : [],
      });
    });
    autoAncho(detalle, 12, 60);
    hojaMetadatos(wb, metadatos);
    await descargarLibro(wb, `Comparativa_Proyecciones_Lider_${sufijo}.xlsx`);
  };

  const resumen = async () => {
    const wb = nuevoLibro();
    const k = activeCorte?.kpis;
    const ws = crearHoja(
      wb, 'Resumen Ejecutivo',
      `Resumen Ejecutivo de Campaña · Cuenta ${state.cuenta}`,
      `${activeCorte?.campana ?? ''} · corte ${activeCorte?.fechaCorte ?? ''} · ${activeCorte?.fileName ?? ''}`, 4,
    );

    const tituloBloque = (fila: number, textoBloque: string) => {
      ws.mergeCells(fila, 1, fila, 4);
      const celda = ws.getCell(fila, 1);
      celda.value = textoBloque;
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETA.totales } };
      celda.font = { name: 'Calibri', size: 11, bold: true, color: { argb: PALETA.texto } };
      celda.alignment = { vertical: 'middle', indent: 1 };
      ws.getRow(fila).height = 22;
    };

    tituloBloque(4, 'BLOQUE A · KPIs de campaña');
    escribirEncabezados(ws, 5, ['Indicador', 'Valor']);
    const brecha = brechaMeta(k?.meta ?? 0, k?.puntos ?? 0);
    const kpis: Array<[string, ValorCelda]> = [
      ['Total Red', k?.total ?? 0],
      ['Socios Activos', k?.activos ?? 0],
      ['Socios Sin Pedido', k?.sinPedido ?? 0],
      ['Puntos Reales Reportados', k?.puntos ?? 0],
      ['Meta del Período', k?.meta ?? 0],
      ['Brecha / Excedente (RN-10)', brecha.superada ? `Excedente +${fmt(brecha.excedente)} pts` : `Faltan ${fmt(brecha.faltante)} pts`],
      ['Nivel de Incentivo Alcanzado', `${k?.incentivo ?? 0}%`],
    ];
    kpis.forEach(([nombre, valor], i) => escribirFila(ws, 6 + i, [nombre, valor], {
      zebra: true,
      formatos: typeof valor === 'number' ? { 2: FORMATO.entero } : {},
      alineaciones: { 2: 'right' },
    }));

    const filaB = 6 + kpis.length + 1;
    tituloBloque(filaB, 'BLOQUE B · Real vs. Esperado (RF-38)');
    escribirEncabezados(ws, filaB + 1, ['Concepto', 'Valor']);
    const base = state.lineaBase?.puntos ?? 0;
    const revisada = proyectar(sociosActivos, state.metodo, state.factor, state.manuales).ajustada;
    const real = k?.puntos ?? 0;
    const vBase = variacion(real, base);
    const vRev = variacion(real, revisada);
    const esperado: Array<[string, ValorCelda]> = [
      ['Proyección Línea Base', base],
      ['Proyección Revisada', revisada],
      ['Puntos Reales Actuales', real],
      ['Variación Absoluta vs. Revisada', vRev.absoluta],
      ['Variación % vs. Revisada (RN-11)', vRev.porcentual === null ? 'N/A' : vRev.porcentual / 100],
      ['Variación Absoluta vs. Línea Base', vBase.absoluta],
    ];
    esperado.forEach(([nombre, valor], i) => escribirFila(ws, filaB + 2 + i, [nombre, valor], {
      zebra: true,
      formatos: typeof valor === 'number' ? { 2: nombre.includes('%') ? FORMATO.porcentaje : FORMATO.entero } : {},
      alineaciones: { 2: 'right' },
    }));

    const filaC = filaB + 2 + esperado.length + 1;
    tituloBloque(filaC, 'BLOQUE C · Distribución de la red (CA-13)');
    escribirEncabezados(ws, filaC + 1, ['Segmento', 'Socios', '% del total', 'Puntos acumulados / potenciales']);
    const segmentos = [
      { nombre: 'Activos', n: k?.activos ?? 0, puntos: k?.puntos ?? 0 },
      { nombre: 'Inactivos 1', n: k?.inactivos1 ?? 0, puntos: 0 },
      { nombre: 'Inactivos 2', n: k?.inactivos2 ?? 0, puntos: 0 },
      { nombre: 'Inactivos 3', n: k?.inactivos3 ?? 0, puntos: 0 },
      { nombre: 'Durmientes 4–17', n: k?.durmientes ?? 0, puntos: 0 },
      { nombre: 'Históricos 18–51', n: k?.historicos ?? 0, puntos: 0 },
      { nombre: 'Programa de Bienvenida', n: k?.bienvenida ?? 0, puntos: 0 },
    ];
    segmentos.forEach((s, i) => escribirFila(ws, filaC + 2 + i, [
      s.nombre, s.n, (k?.total ?? 0) ? s.n / (k?.total ?? 1) : 0, s.puntos,
    ], {
      zebra: true,
      formatos: { 2: FORMATO.entero, 3: FORMATO.porcentaje, 4: FORMATO.entero },
      alineaciones: { 2: 'right', 3: 'right', 4: 'right' },
    }));
    const inicioC = filaC + 2;
    const finC = filaC + 1 + segmentos.length;
    escribirTotales(ws, finC + 1, [
      'TOTALES',
      { formula: `SUM(B${inicioC}:B${finC})`, result: segmentos.reduce((a, s) => a + s.n, 0) },
      { formula: `SUM(C${inicioC}:C${finC})`, result: segmentos.reduce((a, s) => a + ((k?.total ?? 0) ? s.n / (k?.total ?? 1) : 0), 0) },
      { formula: `SUM(D${inicioC}:D${finC})`, result: segmentos.reduce((a, s) => a + s.puntos, 0) },
    ], { 2: FORMATO.entero, 3: FORMATO.porcentaje, 4: FORMATO.entero });
    autoAncho(ws, 18, 52);

    const evol = crearHoja(wb, 'Evolución Anual 17 Camp', 'Evolución anual · 17 campañas', 'C01 a C17 calculadas desde el corte activo', 5);
    escribirEncabezados(evol, 4, ['Campaña', 'Puntos totales', 'Socios activos', '% cobertura', 'Estado del período']);
    serieAnual(sociosActivos).forEach((p, i) => escribirFila(evol, 5 + i, [
      p.campana, p.puntos, p.activos, p.futuro ? 0 : p.cobertura / 100,
      p.futuro ? 'Sin datos aún' : p.cobertura < 100 ? 'Cobertura parcial' : 'Completa',
    ], {
      zebra: true,
      formatos: { 2: FORMATO.entero, 3: FORMATO.entero, 4: FORMATO.porcentaje },
      alineaciones: { 2: 'right', 3: 'right', 4: 'right' },
      celdas: p.cobertura < 100 ? [{ columna: 5, relleno: PALETA.amber, colorTexto: PALETA.amberTexto }] : [],
    }));
    autoAncho(evol, 16, 34);
    hojaMetadatos(wb, metadatos);
    await descargarLibro(wb, `Resumen_Ejecutivo_Campana_${sufijo}.xlsx`);
  };

  if (!activeCorte) return <Card><Vacio mensaje="Carga un corte para exportar" /></Card>;

  const reportes = [
    { clave: 'seguimiento', titulo: 'Lista priorizada de seguimiento', desc: `${fmt(sociosActivos.length)} socios en el orden configurado en Prioridades (09)`, action: seguimiento, nombre: 'Lista_Priorizada_Seguimiento' },
    { clave: 'comparativa', titulo: 'Comparativa de proyecciones por líder', desc: 'Promedio, mediana, máximo y ajustada con incentivo; detalle individual por socio', action: comparativa, nombre: 'Comparativa_Proyecciones_Lider' },
    { clave: 'resumen', titulo: 'Resumen ejecutivo de campaña', desc: 'KPIs, real vs. esperado, distribución y evolución anual', action: resumen, nombre: 'Resumen_Ejecutivo_Campana' },
  ];

  return (
    <>
      <Encabezado titulo="Exportación de resultados" descripcion="Archivos .xlsx con formato ejecutivo generados en el navegador (RF-50)" />
      <div className="grid gap-4 lg:grid-cols-3">
        {reportes.map((r) => (
          <Card key={r.clave} className="flex flex-col p-5">
            <FileSpreadsheet className="text-indigo-600" size={22} />
            <p className="mt-3 text-base font-semibold text-slate-900">{r.titulo}</p>
            <p className="mt-1 flex-1 text-sm text-slate-500">{r.desc}</p>
            <Btn className="mt-4" disabled={generando !== null} onClick={() => void ejecutar(r.clave, r.nombre, r.action)}>
              {generando === r.clave ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {generando === r.clave ? 'Generando…' : 'Descargar .xlsx'}
            </Btn>
          </Card>
        ))}
      </div>
      {aviso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{aviso}</p>}
      <Card className="mt-5">
        <CardHeader titulo="Metadatos incluidos en cada archivo" subtitulo="Hoja «Metadatos» automática con identidad RedPulse" />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {metadatos.map((m) => (
            <div key={m.Campo}><p className="text-[11px] uppercase tracking-wide text-slate-400">{m.Campo}</p><p className="text-sm font-medium text-slate-800">{m.Valor}</p></div>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-xs text-slate-400">SheetJS sigue siendo el motor de importación; la exportación usa ExcelJS para estilos, fórmulas y filtros reales.</p>
    </>
  );
}
