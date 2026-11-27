import ExcelJS from 'exceljs';

export const PALETA = {
  banner: 'FF1E1B4B',
  subtitle: 'FFC7D2FE',
  header: 'FF312E81',
  zebra: 'FFF8FAFC',
  blanco: 'FFFFFFFF',
  borde: 'FFE2E8F0',
  totales: 'FFEEF2FF',
  texto: 'FF1E1B4B',
  verdeMentana: 'FFDCFCE7',
  verdeTexto: 'FF166534',
  amber: 'FFFEF3C7',
  amberTexto: 'FF92400E',
  rosa: 'FFFFE4E6',
  rosaTexto: 'FF9F1239',
  esmeralda: 'FFD1FAE5',
};

export const FORMATO = {
  entero: '#,##0',
  moneda: '$#,##0.00',
  porcentaje: '0.0%',
};

type Alineacion = 'left' | 'center' | 'right';
type CeldaEspecifica = { columna: number; relleno?: string; colorTexto?: string; negrita?: boolean; formato?: string };

const bordeFino = {
  top: { style: 'thin' as const, color: { argb: PALETA.borde } },
  left: { style: 'thin' as const, color: { argb: PALETA.borde } },
  bottom: { style: 'thin' as const, color: { argb: PALETA.borde } },
  right: { style: 'thin' as const, color: { argb: PALETA.borde } },
};

export function nuevoLibro(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

export function crearHoja(
  workbook: ExcelJS.Workbook,
  nombre: string,
  titulo: string,
  subtitulo: string,
  columnas = 8,
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 4 }] });
  ws.mergeCells(1, 1, 1, columnas);
  const tituloCelda = ws.getCell(1, 1);
  tituloCelda.value = titulo;
  tituloCelda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETA.banner } };
  tituloCelda.font = { name: 'Calibri', size: 14, bold: true, color: { argb: PALETA.blanco } };
  tituloCelda.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 34;

  ws.mergeCells(2, 1, 2, columnas);
  const subCelda = ws.getCell(2, 1);
  subCelda.value = subtitulo;
  subCelda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETA.banner } };
  subCelda.font = { name: 'Calibri', size: 10, color: { argb: PALETA.subtitle } };
  subCelda.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 8;
  return ws;
}

export function escribirEncabezados(ws: ExcelJS.Worksheet, fila: number, encabezados: string[]): void {
  const row = ws.getRow(fila);
  row.values = encabezados;
  row.height = 26;
  encabezados.forEach((_, i) => {
    const celda = ws.getCell(fila, i + 1);
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETA.header } };
    celda.font = { name: 'Calibri', size: 10, bold: true, color: { argb: PALETA.blanco } };
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    celda.border = bordeFino;
  });
  ws.autoFilter = {
    from: { row: fila, column: 1 },
    to: { row: fila, column: encabezados.length },
  };
}

export function escribirFila(
  ws: ExcelJS.Worksheet,
  numeroFila: number,
  valores: Array<string | number | { formula: string; result?: number }>,
  opciones: {
    zebra?: boolean;
    formatos?: Record<number, string>;
    alineaciones?: Record<number, Alineacion>;
    celdas?: CeldaEspecifica[];
  } = {},
): void {
  const row = ws.getRow(numeroFila);
  row.values = valores;
  row.height = 18;
  const relleno = opciones.zebra && numeroFila % 2 === 1 ? PALETA.zebra : PALETA.blanco;
  valores.forEach((_, i) => {
    const celda = ws.getCell(numeroFila, i + 1);
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: relleno } };
    celda.font = { name: 'Calibri', size: 10, color: { argb: PALETA.texto } };
    celda.border = bordeFino;
    celda.alignment = { vertical: 'middle', horizontal: opciones.alineaciones?.[i + 1] ?? 'left' };
    if (opciones.formatos?.[i + 1]) celda.numFmt = opciones.formatos[i + 1];
  });
  opciones.celdas?.forEach((esp) => {
    const celda = ws.getCell(numeroFila, esp.columna);
    if (esp.relleno) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: esp.relleno } };
    if (esp.colorTexto || esp.negrita) {
      celda.font = {
        name: 'Calibri', size: 10,
        bold: esp.negrita ?? false,
        color: { argb: esp.colorTexto ?? PALETA.texto },
      };
    }
    if (esp.formato) celda.numFmt = esp.formato;
  });
}

export function escribirTotales(
  ws: ExcelJS.Worksheet,
  numeroFila: number,
  valores: Array<string | number | { formula: string; result?: number }>,
  formatos: Record<number, string> = {},
): void {
  escribirFila(ws, numeroFila, valores, { formatos, celdas: valores.map((_, i) => ({
    columna: i + 1, relleno: PALETA.totales, negrita: true, colorTexto: PALETA.texto,
  })) });
  ws.getRow(numeroFila).eachCell((celda) => {
    celda.border = {
      top: { style: 'thin', color: { argb: PALETA.texto } },
      left: { style: 'thin', color: { argb: PALETA.borde } },
      right: { style: 'thin', color: { argb: PALETA.borde } },
      bottom: { style: 'double', color: { argb: PALETA.texto } },
    };
  });
}

export function autoAncho(ws: ExcelJS.Worksheet, minimo = 12, maximo = 46): void {
  for (let i = 1; i <= ws.columnCount; i += 1) {
    const columna = ws.getColumn(i);
    let mayor = minimo;
    columna.eachCell({ includeEmpty: false }, (celda) => {
      const valor = celda.value;
      const texto = typeof valor === 'object' && valor !== null && 'formula' in valor
        ? String((valor as { result?: number }).result ?? '')
        : String(valor ?? '');
      mayor = Math.max(mayor, texto.length + 3);
    });
    columna.width = Math.min(maximo, mayor);
  }
}

export function hojaMetadatos(workbook: ExcelJS.Workbook, campos: Array<{ Campo: string; Valor: string }>): void {
  const ws = crearHoja(workbook, 'Metadatos', 'Ficha ejecutiva · RedPulse', 'RF-50 · Entorno de prototipo', 2);
  escribirEncabezados(ws, 4, ['Campo', 'Valor']);
  campos.forEach((c, i) => escribirFila(ws, 5 + i, [c.Campo, c.Valor], { zebra: true }));
  autoAncho(ws, 18, 70);
}

export async function descargarLibro(workbook: ExcelJS.Workbook, nombre: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
