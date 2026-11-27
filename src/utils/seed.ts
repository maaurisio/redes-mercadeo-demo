import type { Contacto, Corte, EntradaAuditoria, RegistroCarga, Socio } from '../types';
import { SEGMENTOS } from '../lib/segmentos';

function id(s: Socio | undefined): string {
  return s ? String(s.ID_Socio) : '';
}

/** Seis gestiones reales sobre socios del corte activo, con una promesa de 100 pts. */
export function seedGestiones(corte: Corte): Contacto[] {
  const preferidos = ['200101', '200102', '200100', '200105', '200110', '200120'];
  const seleccionados: Socio[] = [];
  for (const clave of preferidos) {
    const s = corte.validas.find((x) => id(x) === clave);
    if (s) seleccionados.push(s);
  }
  for (const s of corte.validas) {
    if (seleccionados.length >= 6) break;
    if (!seleccionados.includes(s)) seleccionados.push(s);
  }
  const canales = ['WhatsApp', 'Llamada', 'WhatsApp', 'Visita', 'Llamada', 'WhatsApp'];
  const estados = ['Compromiso', 'Contactado', 'Pendiente', 'Compromiso', 'Contactado', 'Pendiente'];
  const notas: string[] = [
    'Promesa de pedido de 100 pts confirmada en WhatsApp',
    'Se envió catálogo digital y confirmó recepción',
    'Pendiente de respuesta; nueva llamada programada',
    'Compromiso de pedido de programa de bienvenida',
    'Contacto inicial realizado sin compromiso aún',
    'Seguimiento de monedero electrónico pendiente',
  ];

  return seleccionados.slice(0, 6).map((s, i) => ({
    id: `SEED-G-${corte.id}-${i}`,
    cuenta: corte.cuenta,
    corteId: corte.id,
    socioId: id(s),
    canal: canales[i],
    observaciones: notas[i],
    fechaSeguimiento: `2026-10-${String(23 + (i % 9)).padStart(2, '0')}`,
    puntosPrometidos: i === 0 ? 100 : [70, 100, 70, 140, 100][i - 1] ?? 70,
    estado: estados[i],
    creadoEn: '26/11/26, 8:10 a.m.',
  }));
}

export const FASES_AGENDA = [
  { desde: 1, hasta: 3, titulo: 'Bienvenida y Monedero', claves: ['bienvenida', 'monedero'] },
  { desde: 4, hasta: 7, titulo: 'Inactivos recientes', claves: ['inactivo_1', 'compro_antes'] },
  { desde: 8, hasta: 12, titulo: 'Durmientes + catálogo digital', claves: ['durmiente', 'inactivo_2'] },
  { desde: 13, hasta: 17, titulo: 'Inactivos 3 e históricos', claves: ['inactivo_3', 'historico'] },
  { desde: 18, hasta: 21, titulo: 'Cierre de puntos', claves: ['sin_pedido'] },
];

/** Tareas concretas y vinculadas a socios reales del corte, distribuidas en los 21 días. */
export function seedTareas(corte: Corte): Record<string, string> {
  const tareas: Record<string, string> = {};
  const estados = ['Pendiente', 'Contactado', 'Compromiso'];
  FASES_AGENDA.forEach((fase, fi) => {
    for (let dia = fase.desde; dia <= fase.hasta; dia += 1) {
      const vistos = new Set<string>();
      const socios: Socio[] = [];
      for (const clave of fase.claves) {
        const def = SEGMENTOS.find((s) => s.key === clave);
        if (!def) continue;
        for (const s of corte.validas.filter(def.test)) {
          const socioId = id(s);
          if (vistos.has(socioId)) continue;
          vistos.add(socioId);
          socios.push(s);
          if (socios.length >= 3) break;
        }
        if (socios.length >= 3) break;
      }
      socios.forEach((s, i) => {
        const indice = (dia + i + fi) % estados.length;
        tareas[`${corte.id}:${dia}:${id(s)}`] = estados[indice];
      });
    }
  });
  return tareas;
}

export function seedHistorialCargas(): RegistroCarga[] {
  return [{
    id: 'CARGA-INICIAL-LINEA-BASE',
    fecha: '26/11/26, 8:00 a.m.',
    usuario: 'Sistema',
    archivo: 'Línea base precargada (Día 1)',
    campana: 'C15-2026',
    filas: 0,
    puntos: 7200,
    cuenta: 'A',
    nota: 'Registro inicial precargado para comparar contra el cierre',
  }];
}

export function seedAuditoria(): EntradaAuditoria[] {
  return [
    {
      id: 'AUD-INICIAL',
      fecha: '26/11/26, 9:00 a.m.',
      actor: 'Sistema',
      cuenta: 'Sistema',
      accion: 'Estado inicial del prototipo',
      motivo: 'Datos ficticios de demostración — sin efectos reales',
    },
    {
      id: 'AUD-LINEA-BASE',
      fecha: '26/11/26, 8:00 a.m.',
      actor: 'Sistema',
      cuenta: 'A',
      accion: 'Línea base precargada',
      motivo: '7,200 pts fijados en el Día 1 de C15-2026',
    },
    {
      id: 'AUD-ROLES',
      fecha: '26/11/26, 8:05 a.m.',
      actor: 'Sistema',
      cuenta: 'Sistema',
      accion: 'Roles SaaS configurados',
      motivo: 'Líder Titular y Administrador del Producto (RN-14)',
    },
  ];
}
