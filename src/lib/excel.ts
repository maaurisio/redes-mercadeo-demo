import * as XLSX from 'xlsx';
import type { CuentaId, FilaDuplicada, FilaObservada, Kpis, ParsedFile, Socio } from '../types';
import { incentivo, numero } from './format';

export const COLUMNAS: string[] = [
  'ID_Socio', 'Nombre_Completo', 'Telefono', 'Email', 'Fecha_Inscripcion', 'Fecha_Nacimiento',
  'Tipo_Membresia', 'Segmento_Estado', 'ID_Lider_Directo', 'Nombre_Lider_Directo',
  'ID_Lider_Subred', 'Nombre_Lider_Subred', 'Nivel_Jerarquico', 'Porcentaje_Incentivo',
  'Campana_Actual', 'Fecha_Corte', 'Dia_Campana', 'Hizo_Pedido', 'Puntos_Personales',
  'Puntos_Grupo', 'Valor_Pedido_MXN', 'Saldo_Monedero_MXN', 'Campanas_Sin_Pedido',
  'Nivel_Programa_Bienvenida', 'Recibe_Catalogo_Impreso', 'Elegible_Premio_Lealtad',
  ...Array.from({ length: 17 }, (_, i) => `Pts_Camp_Ant_${String(i + 1).padStart(2, '0')}`),
  'Estado_Republica', 'Ciudad', 'Canal_Ultimo_Pedido', 'Fecha_Ultimo_Pedido',
  'Saldo_Credito_MXN', 'Limite_Credito_MXN', 'Reclutados_Directos', 'Reclutados_Activos',
  'Premio_Ganado_Campana', 'Codigo_Zona',
];

const META_POR_ARCHIVO: Record<string, number> = {
  '01_Red_Mediana_383_Corte1.xlsx': 7500,
  '02_Red_Mediana_383_Corte2.xlsx': 7500,
  '03_Red_Pequena_25_Socios.xlsx': 1000,
  '04_Red_Grande_1500_Socios.xlsx': 40000,
  '05_Cuenta_B_Aislada_120_Socios.xlsx': 4500,
};

function limpio(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

export function parseExcel(buffer: ArrayBuffer, fileName: string): ParsedFile {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const nombreHoja = wb.SheetNames[0];
  const ws = wb.Sheets[nombreHoja];
  if (!ws) throw new Error('El archivo no contiene hojas');

  const primeraFila = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })[0] ?? [];
  const headers = primeraFila.map((h) => limpio(h)).filter(Boolean);
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: true })
    .map((fila) => {
      const normalizada: Record<string, unknown> = {};
      Object.entries(fila).forEach(([clave, valor]) => {
        normalizada[clave] = typeof valor === 'string' && valor.trim() === '' ? null : valor;
      });
      return normalizada;
    });

  const validas: Socio[] = [];
  const duplicadas: FilaDuplicada[] = [];
  const observadas: FilaObservada[] = [];
  const vistos = new Set<string>();

  raw.forEach((fila, idx) => {
    const s = fila as Socio;
    const id = limpio(s.ID_Socio);
    const puntos = numero(s, 'Puntos_Personales');
    const puntosValidos = typeof s.Puntos_Personales === 'number' && Number.isFinite(s.Puntos_Personales);
    const numeroFila = idx + 2;

    if (!id) {
      observadas.push({
        fila: numeroFila,
        motivo: 'Sin ID_Socio',
        detalle: 'El registro no tiene identificador de socio; no es importable.',
        raw: s,
      });
      return;
    }
    if (vistos.has(id)) {
      duplicadas.push({
        fila: numeroFila,
        id,
        nombre: limpio(s.Nombre_Completo) || 'N/D',
        raw: s,
        omitir: true,
      });
      return;
    }
    if (!puntosValidos || puntos < 0) {
      observadas.push({
        fila: numeroFila,
        id,
        motivo: 'Puntos_Personales inválido',
        detalle: `Valor detectado: ${limpio(s.Puntos_Personales) || puntos} pts (negativo o no numérico).`,
        raw: s,
      });
      return;
    }
    const telefono = limpio(s.Telefono);
    const email = limpio(s.Email);
    if (!telefono && !email && puntos > 0) {
      observadas.push({
        fila: numeroFila,
        id,
        motivo: 'Sin teléfono ni email',
        detalle: 'Pedido confirmado sin datos de contacto; requiere corrección.',
        raw: s,
      });
      return;
    }
    vistos.add(id);
    validas.push(s);
  });

  const primera = validas[0];
  const cuenta: CuentaId = fileName.includes('05_') || limpio(primera?.ID_Socio).startsWith('500') ? 'B' : 'A';
  const fechaCorteRaw = primera?.Fecha_Corte;
  const fechaCorte = fechaCorteRaw instanceof Date
    ? fechaCorteRaw.toISOString().slice(0, 10)
    : limpio(fechaCorteRaw);

  return {
    fileName,
    headers,
    totalFilas: raw.length,
    validas,
    duplicadas,
    observadas,
    campana: limpio(primera?.Campana_Actual) || 'C15-2026',
    diaCampana: numero(primera, 'Dia_Campana') || 8,
    fechaCorte,
    cuenta,
    meta: META_POR_ARCHIVO[fileName] ?? (cuenta === 'B' ? 4500 : 7500),
  };
}

export function computeKpis(validas: Socio[], meta: number): Kpis {
  const activos = validas.filter((s) => numero(s, 'Campanas_Sin_Pedido') === 0).length;
  const sinPedido = validas.filter((s) => limpio(s.Hizo_Pedido) !== 'Sí').length;
  const estado = (clave: string) => validas.filter((s) => limpio(s.Segmento_Estado) === clave).length;
  const monedero = validas.filter((s) => numero(s, 'Saldo_Monedero_MXN') > 0).length;
  const monederoSinPedido = validas.filter(
    (s) => numero(s, 'Saldo_Monedero_MXN') > 0 && limpio(s.Hizo_Pedido) !== 'Sí',
  ).length;
  const comproAntes = validas.filter(
    (s) => limpio(s.Hizo_Pedido) !== 'Sí' && numero(s, 'Pts_Camp_Ant_01') > 0,
  ).length;
  const puntos = validas.reduce((acc, s) => acc + numero(s, 'Puntos_Personales'), 0);
  const cumpleaneros = validas.filter((s) => {
    const v = s.Fecha_Nacimiento;
    if (!v) return false;
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return false;
    const clave = (d.getMonth() + 1) * 100 + d.getDate();
    return clave >= 1022 && clave <= 1111;
  }).length;

  return {
    total: validas.length,
    activos,
    sinPedido,
    inactivos1: estado('Inactivo_1'),
    inactivos2: estado('Inactivo_2'),
    inactivos3: estado('Inactivo_3'),
    durmientes: estado('Durmiente'),
    historicos: estado('Historico'),
    bienvenida: validas.filter((s) => limpio(s.Nivel_Programa_Bienvenida) !== 'N/A' && limpio(s.Nivel_Programa_Bienvenida) !== '').length,
    monedero,
    monederoSinPedido,
    comproAntes,
    puntos,
    meta,
    brecha: meta - puntos,
    incentivo: incentivo(puntos),
    cumpleaneros,
  };
}

export function aplicarMapeo(validas: Socio[], mapping: Record<string, string>): Socio[] {
  const activo = Object.entries(mapping).filter(([origen, destino]) => origen !== destino && destino);
  if (!activo.length) return validas;
  return validas.map((fila) => {
    const copia: Socio = { ...fila };
    for (const [origen, destino] of activo) {
      if (origen in copia) {
        copia[destino] = copia[origen];
      }
    }
    return copia;
  });
}
