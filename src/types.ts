export type CuentaId = 'A' | 'B' | 'C' | (string & {});

export type CellValue = string | number | Date | null;

export interface Socio {
  [columna: string]: CellValue;
}

export interface FilaDuplicada {
  fila: number;
  id: string;
  nombre: string;
  raw: Socio;
  omitir: boolean;
}

export interface FilaObservada {
  fila: number;
  motivo: string;
  detalle: string;
  id?: string;
  raw: Socio;
}

export interface ParsedFile {
  fileName: string;
  headers: string[];
  totalFilas: number;
  validas: Socio[];
  duplicadas: FilaDuplicada[];
  observadas: FilaObservada[];
  campana: string;
  diaCampana: number;
  fechaCorte: string;
  cuenta: CuentaId;
  meta: number;
}

export interface Kpis {
  total: number;
  activos: number;
  sinPedido: number;
  inactivos1: number;
  inactivos2: number;
  inactivos3: number;
  durmientes: number;
  historicos: number;
  bienvenida: number;
  monedero: number;
  monederoSinPedido: number;
  comproAntes: number;
  puntos: number;
  meta: number;
  brecha: number;
  incentivo: number;
  cumpleaneros: number;
}

export interface Corte extends ParsedFile {
  id: string;
  importadoEn: string;
  kpis: Kpis;
}

export interface Contacto {
  id: string;
  cuenta: CuentaId;
  corteId: string;
  socioId: string;
  canal: string;
  observaciones: string;
  fechaSeguimiento: string;
  puntosPrometidos: number;
  estado: string;
  creadoEn: string;
}

export interface Plantilla {
  id: string;
  segmento: string;
  cuerpo: string;
  enlaceCatalogo: string;
}

export interface SegmentoDef {
  key: string;
  nombre: string;
  descripcion: string;
  test: (s: Socio) => boolean;
}

export type Rol = 'lider' | 'admin';
export type EstadoCuenta = 'Activa' | 'Suspendida';
export type PlanId = 'inicial' | 'lider' | 'expansion';

export interface CuentaConfig {
  id: CuentaId;
  titular: string;
  plan: PlanId;
  socios: number;
  estado: EstadoCuenta;
  motivo?: string;
  duracionCampana: number;
  metaDefault: number;
}

export interface EntradaAuditoria {
  id: string;
  fecha: string;
  actor: string;
  cuenta: CuentaId | 'Sistema';
  accion: string;
  motivo: string;
}

export interface LineaBase {
  puntos: number;
  fijadaEn: string;
  dia: number;
  campana: string;
  origen: 'precargada' | 'usuario';
}

export interface RegistroCarga {
  id: string;
  fecha: string;
  usuario: string;
  archivo: string;
  campana: string;
  filas: number;
  puntos: number;
  cuenta: CuentaId;
  nota?: string;
}

export interface AppState {
  cortes: Corte[];
  activeCorteId: string | null;
  cuenta: CuentaId;
  rol: Rol;
  leaderFilter: string | null;
  segmentoActivo: string | null;
  hideBuyers: boolean;
  priorities: string[];
  contactos: Contacto[];
  plantillas: Plantilla[];
  contactados: string[];
  tareas: Record<string, string>;
  mappingTemplate: Record<string, string>;
  metodo: import('./utils/projections').Metodo;
  factor: import('./utils/projections').FactorAjuste;
  manuales: Record<string, { puntos: number; motivo: string }>;
  lineaBase: LineaBase | null;
  cuentas: CuentaConfig[];
  auditoria: EntradaAuditoria[];
  historialCargas: RegistroCarga[];
}

export interface PreviewState {
  parsed: ParsedFile | null;
  campanaDestino: string;
  mapping: Record<string, string>;
}
