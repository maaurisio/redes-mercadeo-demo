import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState, CuentaConfig, CuentaId, EntradaAuditoria, Rol, Contacto, Corte,
  ParsedFile, Plantilla, PreviewState, Socio,
} from '../types';
import type { FactorAjuste, Metodo } from '../utils/projections';
import { aplicarMapeo, computeKpis, parseExcel } from '../lib/excel';
import { clearState, loadState, saveState } from '../lib/storage';
import { SEGMENTOS } from '../lib/segmentos';

const ARCHIVO_INICIAL = '01_Red_Mediana_383_Corte1.xlsx';
const ARCHIVO_CUENTA_B = '05_Cuenta_B_Aislada_120_Socios.xlsx';

const CUENTAS_INICIALES: CuentaConfig[] = [
  { id: 'A', titular: 'Sofía Mendoza', plan: 'lider', socios: 383, estado: 'Activa', duracionCampana: 21, metaDefault: 7500 },
  { id: 'B', titular: 'Carlos Ramírez', plan: 'lider', socios: 120, estado: 'Activa', duracionCampana: 21, metaDefault: 4500 },
  { id: 'C', titular: 'Lucía Torres', plan: 'inicial', socios: 45, estado: 'Suspendida', motivo: 'Perfil de demostración suspendido', duracionCampana: 21, metaDefault: 5000 },
];

const auditoriaInicial: EntradaAuditoria[] = [{
  id: 'AUD-INICIAL',
  fecha: '26/11/26, 9:00 a.m.',
  actor: 'Sistema',
  cuenta: 'Sistema',
  accion: 'Estado inicial del prototipo',
  motivo: 'Datos ficticios de demostración — sin efectos reales',
}];

const estadoInicial = (): AppState => ({
  cortes: [],
  activeCorteId: null,
  cuenta: 'A',
  rol: 'lider',
  leaderFilter: null,
  segmentoActivo: null,
  hideBuyers: false,
  priorities: SEGMENTOS.map((s) => s.key),
  contactos: [],
  plantillas: [],
  contactados: [],
  tareas: {},
  mappingTemplate: {},
  metodo: 'promedio',
  factor: 1,
  manuales: {},
  lineaBase: {
    puntos: 7200,
    fijadaEn: '26/11/26, 8:00 a.m.',
    dia: 1,
    campana: 'C15-2026',
    origen: 'precargada',
  },
  cuentas: CUENTAS_INICIALES,
  auditoria: auditoriaInicial,
});

function normalizar(cargado: AppState | null): AppState {
  const base = estadoInicial();
  if (!cargado) return base;
  return {
    ...base,
    ...cargado,
    cuentas: Array.isArray(cargado.cuentas) && cargado.cuentas.length ? cargado.cuentas : base.cuentas,
    auditoria: Array.isArray(cargado.auditoria) ? cargado.auditoria : base.auditoria,
    manuales: cargado.manuales ?? {},
    lineaBase: cargado.lineaBase === undefined ? base.lineaBase : cargado.lineaBase,
  };
}

interface AppContextValue {
  state: AppState;
  activeCorte: Corte | null;
  sociosActivos: Socio[];
  cuentaActual: CuentaConfig | null;
  accesoBloqueado: boolean;
  preview: PreviewState | null;
  cargando: boolean;
  error: string | null;
  quickLoad: (fileName: string, confirmar?: boolean) => Promise<void>;
  cargarArchivo: (file: File) => Promise<void>;
  confirmarImport: () => void;
  cancelarPreview: () => void;
  seleccionarCuenta: (cuenta: CuentaId) => void;
  reiniciarDemo: () => Promise<void>;
  setLeaderFilter: (lider: string | null) => void;
  setSegmentoActivo: (segmento: string | null) => void;
  setHideBuyers: (valor: boolean) => void;
  setPriorities: (claves: string[]) => void;
  addContacto: (contacto: Omit<Contacto, 'id' | 'creadoEn' | 'cuenta' | 'corteId'>) => void;
  setTarea: (dia: number, socioId: string, estado: string) => void;
  marcarContactado: (socioId: string) => void;
  savePlantilla: (plantilla: Omit<Plantilla, 'id'>) => void;
  setPreviewCampana: (campana: string) => void;
  setPreviewMapping: (origen: string, destino: string) => void;
  saveMappingTemplate: () => void;
  setRol: (rol: Rol) => void;
  setMetodo: (metodo: Metodo) => void;
  setFactor: (factor: FactorAjuste) => void;
  setManual: (socioId: string, puntos: number, motivo: string) => void;
  fijarLineaBase: (puntos: number, origen?: 'precargada' | 'usuario') => void;
  crearCuenta: (titular: string, plan: CuentaConfig['plan'], socios: number) => CuentaId;
  alternarCuenta: (cuenta: CuentaId, motivo: string) => void;
  actualizarConfigCuenta: (cuenta: CuentaId, duracion: number, meta: number) => void;
  registrarAuditoria: (accion: string, motivo: string, cuenta?: CuentaId) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => normalizar(loadState()));
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const arranque = useRef(false);

  useEffect(() => { saveState(state); }, [state]);

  const registrarAuditoria = useCallback((accion: string, motivo: string, cuenta?: CuentaId) => {
    const entrada: EntradaAuditoria = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      actor: state.rol === 'admin' ? 'Administrador del Producto' : 'Líder Titular',
      cuenta: cuenta ?? state.cuenta,
      accion,
      motivo,
    };
    setState((p) => ({ ...p, auditoria: [entrada, ...p.auditoria] }));
  }, [state.rol, state.cuenta]);

  const commitParsed = useCallback((parsed: ParsedFile) => {
    const corte: Corte = {
      ...parsed,
      id: `${Date.now()}-${parsed.fileName}`,
      importadoEn: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      kpis: computeKpis(parsed.validas, parsed.meta),
    };
    setState((prev) => ({
      ...prev,
      cortes: [...prev.cortes, corte],
      activeCorteId: corte.id,
      cuenta: parsed.cuenta,
    }));
  }, []);

  const abrirPreview = useCallback((parsed: ParsedFile) => {
    const mapping: Record<string, string> = {};
    parsed.headers.forEach((h) => { mapping[h] = h; });
    setPreview({ parsed, campanaDestino: parsed.campana, mapping });
  }, []);

  const quickLoad = useCallback(async (fileName: string, confirmar = false) => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}mock/${encodeURIComponent(fileName)}`);
      if (!response.ok) throw new Error(`No se pudo leer ${fileName} (${response.status})`);
      const parsed = parseExcel(await response.arrayBuffer(), fileName);
      if (confirmar) commitParsed(parsed);
      else abrirPreview(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al leer el archivo');
    } finally {
      setCargando(false);
    }
  }, [abrirPreview, commitParsed]);

  useEffect(() => {
    if (arranque.current) return;
    arranque.current = true;
    if (state.cortes.length === 0) void quickLoad(ARCHIVO_INICIAL, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarArchivo = useCallback(async (file: File) => {
    setCargando(true);
    setError(null);
    try {
      abrirPreview(parseExcel(await file.arrayBuffer(), file.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al leer el archivo');
    } finally {
      setCargando(false);
    }
  }, [abrirPreview]);

  const confirmarImport = useCallback(() => {
    if (!preview?.parsed) return;
    const datos = aplicarMapeo(preview.parsed.validas, preview.mapping);
    commitParsed({ ...preview.parsed, validas: datos, campana: preview.campanaDestino });
    setPreview(null);
  }, [commitParsed, preview]);

  const seleccionarCuenta = useCallback((cuenta: CuentaId) => {
    setState((prev) => {
      const propios = prev.cortes.filter((c) => c.cuenta === cuenta);
      return {
        ...prev,
        cuenta,
        leaderFilter: null,
        segmentoActivo: null,
        activeCorteId: propios.length ? propios[propios.length - 1].id : null,
      };
    });
    if (cuenta === 'B' && !state.cortes.some((c) => c.cuenta === 'B')) {
      void quickLoad(ARCHIVO_CUENTA_B, true);
    }
  }, [quickLoad, state.cortes]);

  const reiniciarDemo = useCallback(async () => {
    clearState();
    setState(estadoInicial());
    setPreview(null);
    await quickLoad(ARCHIVO_INICIAL, true);
  }, [quickLoad]);

  const crearCuenta = useCallback((titular: string, plan: CuentaConfig['plan'], socios: number): CuentaId => {
    const id = String.fromCharCode(68 + Math.floor(Math.random() * 20)) as CuentaId;
    const nueva: CuentaConfig = {
      id, titular, plan, socios, estado: 'Activa',
      duracionCampana: 21,
      metaDefault: plan === 'inicial' ? 5000 : plan === 'lider' ? 7500 : 12000,
    };
    setState((p) => ({ ...p, cuentas: [...p.cuentas, nueva] }));
    registrarAuditoria('Crear cuenta de prueba', `Alta de ${titular} con plan ${plan} y ${socios} socios`, id);
    return id;
  }, [registrarAuditoria]);

  const alternarCuenta = useCallback((cuenta: CuentaId, motivo: string) => {
    setState((p) => ({
      ...p,
      cuentas: p.cuentas.map((c) => c.id === cuenta
        ? { ...c, estado: c.estado === 'Activa' ? 'Suspendida' : 'Activa', motivo: c.estado === 'Activa' ? motivo : undefined }
        : c),
    }));
    registrarAuditoria(cuenta === 'C' || state.cuentas.find((c) => c.id === cuenta)?.estado === 'Activa' ? 'Pausar acceso' : 'Activar acceso', motivo, cuenta);
  }, [registrarAuditoria, state.cuentas]);

  const actualizarConfigCuenta = useCallback((cuenta: CuentaId, duracion: number, meta: number) => {
    setState((p) => ({
      ...p,
      cuentas: p.cuentas.map((c) => c.id === cuenta ? { ...c, duracionCampana: duracion, metaDefault: meta } : c),
    }));
    registrarAuditoria('Actualizar configuración', `Duración ${duracion} días y meta ${meta.toLocaleString('es-MX')} pts`, cuenta);
  }, [registrarAuditoria]);

  const activeCorte = useMemo(
    () => state.cortes.find((c) => c.id === state.activeCorteId && c.cuenta === state.cuenta) ?? null,
    [state.cortes, state.activeCorteId, state.cuenta],
  );
  const cuentaActual = useMemo(
    () => state.cuentas.find((c) => c.id === state.cuenta) ?? null,
    [state.cuentas, state.cuenta],
  );
  const accesoBloqueado = state.rol === 'admin' || cuentaActual?.estado === 'Suspendida';

  const sociosActivos = useMemo(() => {
    if (!activeCorte || accesoBloqueado) return [];
    return state.leaderFilter
      ? activeCorte.validas.filter((s) => String(s.ID_Lider_Subred) === state.leaderFilter)
      : activeCorte.validas;
  }, [activeCorte, state.leaderFilter, accesoBloqueado]);

  const value: AppContextValue = {
    state, activeCorte, sociosActivos, cuentaActual, accesoBloqueado,
    preview, cargando, error,
    quickLoad, cargarArchivo, confirmarImport, cancelarPreview: () => setPreview(null),
    seleccionarCuenta, reiniciarDemo,
    setLeaderFilter: (lider) => setState((p) => ({ ...p, leaderFilter: lider })),
    setSegmentoActivo: (segmento) => setState((p) => ({ ...p, segmentoActivo: segmento })),
    setHideBuyers: (valor) => setState((p) => ({ ...p, hideBuyers: valor })),
    setPriorities: (claves) => setState((p) => ({ ...p, priorities: claves })),
    addContacto: (contacto) => setState((p) => ({
      ...p,
      contactos: [{
        ...contacto, id: `C-${Date.now()}`, cuenta: p.cuenta, corteId: p.activeCorteId ?? '',
        creadoEn: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      }, ...p.contactos],
    })),
    setTarea: (dia, socioId, estadoTarea) => setState((p) => ({
      ...p, tareas: { ...p.tareas, [`${p.activeCorteId ?? ''}:${dia}:${socioId}`]: estadoTarea },
    })),
    marcarContactado: (socioId) => setState((p) => ({
      ...p, contactados: p.contactados.includes(socioId) ? p.contactados : [...p.contactados, socioId],
    })),
    savePlantilla: (plantilla) => setState((p) => {
      const existe = p.plantillas.find((x) => x.segmento === plantilla.segmento);
      return {
        ...p,
        plantillas: existe
          ? p.plantillas.map((x) => x.segmento === plantilla.segmento ? { ...plantilla, id: x.id } : x)
          : [...p.plantillas, { ...plantilla, id: `T-${Date.now()}` }],
      };
    }),
    setPreviewCampana: (campana) => setPreview((p) => p ? { ...p, campanaDestino: campana } : p),
    setPreviewMapping: (origen, destino) => setPreview((p) => p ? { ...p, mapping: { ...p.mapping, [origen]: destino } } : p),
    saveMappingTemplate: () => setState((p) => ({ ...p, mappingTemplate: preview?.mapping ?? p.mappingTemplate })),
    setRol: (rol) => setState((p) => ({ ...p, rol, leaderFilter: rol === 'admin' ? null : p.leaderFilter })),
    setMetodo: (metodo) => setState((p) => ({ ...p, metodo })),
    setFactor: (factor) => setState((p) => ({ ...p, factor })),
    setManual: (socioId, puntos, motivo) => setState((p) => ({
      ...p, manuales: { ...p.manuales, [socioId]: { puntos, motivo } },
    })),
    fijarLineaBase: (puntos, origen = 'usuario') => {
      setState((p) => ({
        ...p,
        lineaBase: {
          puntos,
          fijadaEn: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
          dia: activeCorte?.diaCampana ?? 1,
          campana: activeCorte?.campana ?? 'C15-2026',
          origen,
        },
      }));
      registrarAuditoria('Fijar línea base', `Línea base de ${Math.round(puntos).toLocaleString('es-MX')} pts`);
    },
    crearCuenta, alternarCuenta, actualizarConfigCuenta, registrarAuditoria,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
