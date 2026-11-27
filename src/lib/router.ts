import { useEffect, useState } from 'react';

export type Ruta =
  | 'dashboard' | 'importar' | 'previsualizar' | 'historial'
  | 'socios' | 'socio' | 'lideres' | 'segmentos' | 'prioridades'
  | 'agenda' | 'contacto' | 'plantillas'
  | 'proyeccion' | 'comparacion' | 'proyeccion-socio' | 'real-vs-esperado'
  | 'desempeno' | 'distribucion' | 'evolucion' | 'exportar' | 'exportacion'
  | 'cuentas' | 'planes';

const VALIDAS: Ruta[] = [
  'dashboard', 'importar', 'previsualizar', 'historial',
  'socios', 'socio', 'lideres', 'segmentos', 'prioridades',
  'agenda', 'contacto', 'plantillas',
  'proyeccion', 'comparacion', 'proyeccion-socio', 'real-vs-esperado',
  'desempeno', 'distribucion', 'evolucion', 'exportar', 'exportacion',
  'cuentas', 'planes',
];

function leer(): Ruta {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return VALIDAS.includes(hash as Ruta) ? (hash as Ruta) : 'dashboard';
}

export function useRuta(): [Ruta, (r: Ruta) => void] {
  const [ruta, setRuta] = useState<Ruta>(leer);
  useEffect(() => {
    const onChange = () => setRuta(leer());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navegar = (r: Ruta) => {
    window.location.hash = `#/${r}`;
    setRuta(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [ruta, navegar];
}
