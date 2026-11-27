import { Layout } from './components/Layout';
import { PantallaRestringida, PantallaSuspendida } from './components/Acceso';
import { useRuta } from './lib/router';
import type { Ruta } from './lib/router';
import { AppProvider, useApp } from './state/AppContext';
import { Dashboard } from './screens/Dashboard';
import { Importar } from './screens/Importar';
import { Previsualizar } from './screens/Previsualizar';
import { Historial } from './screens/Historial';
import { Directory } from './screens/Directory';
import { SocioDetalle } from './screens/SocioDetalle';
import { Lideres } from './screens/Lideres';
import { Segmentos } from './screens/Segmentos';
import { Prioridades } from './screens/Prioridades';
import { Agenda } from './screens/Agenda';
import { Contacto } from './screens/Contacto';
import { Plantillas } from './screens/Plantillas';
import { Proyeccion } from './screens/Proyeccion';
import { Comparacion } from './screens/Comparacion';
import { ProyeccionSocio } from './screens/ProyeccionSocio';
import { RealVsEsperado } from './screens/RealVsEsperado';
import { Desempeno } from './screens/Desempeno';
import { Distribucion } from './screens/Distribucion';
import { Evolucion } from './screens/Evolucion';
import { Exportar } from './screens/Exportar';
import { Cuentas } from './screens/Cuentas';
import { Planes } from './screens/Planes';

function vista(ruta: Ruta, navegar: (r: Ruta) => void) {
  switch (ruta) {
    case 'dashboard': return <Dashboard navegar={navegar} />;
    case 'importar': return <Importar navegar={navegar} />;
    case 'previsualizar': return <Previsualizar navegar={navegar} />;
    case 'historial': return <Historial navegar={navegar} />;
    case 'socios': return <Directory navegar={navegar} />;
    case 'socio': return <SocioDetalle navegar={navegar} />;
    case 'lideres': return <Lideres navegar={navegar} />;
    case 'segmentos': return <Segmentos navegar={navegar} />;
    case 'prioridades': return <Prioridades />;
    case 'agenda': return <Agenda navegar={navegar} />;
    case 'contacto': return <Contacto navegar={navegar} />;
    case 'plantillas': return <Plantillas navegar={navegar} />;
    case 'proyeccion': return <Proyeccion />;
    case 'comparacion': return <Comparacion />;
    case 'proyeccion-socio': return <ProyeccionSocio />;
    case 'real-vs-esperado': return <RealVsEsperado />;
    case 'desempeno': return <Desempeno />;
    case 'distribucion': return <Distribucion navegar={navegar} />;
    case 'evolucion': return <Evolucion />;
    case 'exportar': return <Exportar />;
    case 'cuentas': return <Cuentas />;
    case 'planes': return <Planes />;
    default: return <Dashboard navegar={navegar} />;
  }
}

function Contenido() {
  const [ruta, navegar] = useRuta();
  const { state, cuentaActual } = useApp();
  const administracion = ruta === 'cuentas' || ruta === 'planes';
  const suspendida = cuentaActual?.estado === 'Suspendida';

  let contenido;
  if (state.rol === 'admin' && !administracion) {
    contenido = <PantallaRestringida navegar={navegar} />;
  } else if (suspendida && !administracion) {
    contenido = <PantallaSuspendida />;
  } else {
    contenido = vista(ruta, navegar);
  }

  return <Layout ruta={ruta} navegar={navegar}>{contenido}</Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <Contenido />
    </AppProvider>
  );
}
