import { useMemo, useState } from 'react';
import { Check, Clipboard, ExternalLink, MessageSquareText } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { getSocioSeleccionado } from '../lib/seleccion';
import { useApp } from '../state/AppContext';
import { fmt, mxn, numero, texto } from '../lib/format';
import { Btn, Card, CardHeader, Campo, Encabezado, Pill, Vacio, inputClass } from '../components/ui';

const SEGMENTOS_PLANTILLA = [
  { key: 'bienvenida', nombre: 'Bienvenida' },
  { key: 'monedero', nombre: 'Monedero Electrónico' },
  { key: 'durmiente', nombre: 'Durmiente + Catálogo Digital' },
  { key: 'cierre', nombre: 'Recordatorio de Cierre' },
];

const CUERPOS: Record<string, string> = {
  bienvenida: 'Hola {Nombre}! Te damos la bienvenida a la nueva campaña. Tu kit de inicio incluye 70 pts de bienvenida. ¿Quieres que te comparta el catálogo?',
  monedero: 'Hola {Nombre}! Tienes {Saldo_Monedero} en tu monedero electrónico disponible para esta campaña. Podemos usarlos en tu próximo pedido. ¿Te ayudo?',
  durmiente: 'Hola {Nombre}! Ya no recibes catálogo impreso, pero aquí tienes el catálogo digital vigente: {Enlace_Catalogo}. Te faltan {Puntos_Faltantes} pts para tu meta. ¿Te gustaría revisarlo?',
  cierre: 'Hola {Nombre}! Estamos en la recta final de la campaña y te faltan {Puntos_Faltantes} pts para alcanzar la meta. ¿Confirmamos tu pedido hoy?',
};

export function Plantillas({ navegar: _navegar }: { navegar: (r: Ruta) => void }) {
  const { state, sociosActivos, activeCorte, savePlantilla, marcarContactado } = useApp();
  const [segmento, setSegmento] = useState('durmiente');
  const [idSocio, setIdSocio] = useState(() => getSocioSeleccionado() ?? '200101');
  const [copiado, setCopiado] = useState(false);

  const guardada = state.plantillas.find((p) => p.segmento === segmento);
  const [cuerpo, setCuerpo] = useState(() => guardada?.cuerpo ?? CUERPOS.durmiente);
  const [enlace, setEnlace] = useState(() => guardada?.enlaceCatalogo ?? 'https://catalogo-demo.ejemplo.mx/c15');

  const socio = sociosActivos.find((s) => String(s.ID_Socio) === idSocio) ?? sociosActivos[0];
  const puntosFaltantes = activeCorte ? Math.max(activeCorte.kpis.meta - numero(socio, 'Puntos_Personales'), 0) : 0;

  const mensaje = useMemo(() => {
    const relleno = (texto: string) => texto
      .replaceAll('{Nombre}', texto0(socio, 'Nombre_Completo'))
      .replaceAll('{Puntos_Faltantes}', fmt(puntosFaltantes))
      .replaceAll('{Saldo_Monedero}', mxn(numero(socio, 'Saldo_Monedero_MXN')))
      .replaceAll('{Enlace_Catalogo}', enlace);
    return relleno(cuerpo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuerpo, enlace, socio, puntosFaltantes]);

  const telefonos = texto(socio, 'Telefono').replace(/\D/g, '');
  const urlWhatsApp = telefonos.length === 10
    ? `https://wa.me/52${telefonos}?text=${encodeURIComponent(mensaje)}`
    : null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch { setCopiado(false); }
  };

  if (!socio) return <Card><Vacio mensaje="No hay socios en la cuenta activa" /></Card>;

  return (
    <>
      <Encabezado titulo="Plantillas de mensajes" descripcion="Apoyo manual para WhatsApp · sin envíos masivos ni doble check simulado" />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader titulo="Editor por segmento" subtitulo="Variables: {Nombre}, {Puntos_Faltantes}, {Saldo_Monedero}, {Enlace_Catalogo}" />
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              {SEGMENTOS_PLANTILLA.map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSegmento(s.key);
                    const p = state.plantillas.find((x) => x.segmento === s.key);
                    setCuerpo(p?.cuerpo ?? CUERPOS[s.key]);
                    setEnlace(p?.enlaceCatalogo ?? 'https://catalogo-demo.ejemplo.mx/c15');
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${segmento === s.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
            <Campo etiqueta="Cuerpo del mensaje">
              <textarea rows={9} className={inputClass} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
            </Campo>
            <Campo etiqueta="Enlace al catálogo digital vigente">
              <input className={inputClass} value={enlace} onChange={(e) => setEnlace(e.target.value)} />
            </Campo>
            <Btn variant="outline" onClick={() => savePlantilla({ segmento, cuerpo, enlaceCatalogo: enlace })}>Guardar plantilla</Btn>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader titulo="Vista previa personalizada" subtitulo="Se rellena con el socio seleccionado" />
            <div className="space-y-4 p-5">
              <Campo etiqueta="Socio para la vista previa">
                <select className={inputClass} value={String(socio.ID_Socio)} onChange={(e) => setIdSocio(e.target.value)}>
                  {sociosActivos.slice(0, 400).map((s) => <option key={String(s.ID_Socio)} value={String(s.ID_Socio)}>{String(s.ID_Socio)} · {String(s.Nombre_Completo)}</option>)}
                </select>
              </Campo>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-emerald-700"><MessageSquareText size={14} /> Mensaje listo para copiar</div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{mensaje}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => void copiar()}>{copiado ? <Check size={15} /> : <Clipboard size={15} />} {copiado ? 'Copiado' : 'Copiar mensaje'}</Btn>
                {urlWhatsApp ? (
                  <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    <ExternalLink size={15} /> Abrir en WhatsApp Web
                  </a>
                ) : <Pill tono="rose">Sin teléfono válido (N/D)</Pill>}
                <Btn variant="outline" onClick={() => marcarContactado(String(socio.ID_Socio))}>
                  <Check size={15} /> Marcar como contactado
                </Btn>
              </div>
              {state.contactados.includes(String(socio.ID_Socio)) && <Pill tono="emerald">Socio marcado como contactado en esta sesión</Pill>}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">Contexto del socio</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-[11px] text-slate-500">Teléfono</p><p className="font-medium">{texto(socio, 'Telefono')}</p></div>
              <div><p className="text-[11px] text-slate-500">Puntos faltantes</p><p className="font-medium tabular-nums">{fmt(puntosFaltantes)}</p></div>
              <div><p className="text-[11px] text-slate-500">Monedero</p><p className="font-medium tabular-nums">{mxn(numero(socio, 'Saldo_Monedero_MXN'))}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function texto0(s: { [k: string]: unknown } | undefined, col: string): string {
  const v = s?.[col];
  return v === null || v === undefined || v === '' ? 'N/D' : String(v);
}
