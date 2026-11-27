import { History, TrendingUp } from 'lucide-react';
import type { Ruta } from '../lib/router';
import { useApp } from '../state/AppContext';
import { fmt } from '../lib/format';
import { Btn, Card, CardHeader, Encabezado, Pill, Vacio } from '../components/ui';

export function Historial({ navegar }: { navegar: (r: Ruta) => void }) {
  const { state } = useApp();
  const cortes = [...state.cortes].reverse();

  return (
    <>
      <Encabezado
        titulo="Historial de cargas"
        descripcion="Cada corte queda registrado; importar uno nuevo nunca borra el historial"
        acciones={<Btn variant="outline" onClick={() => navegar('importar')}><History size={15} /> Nueva carga</Btn>}
      />
      <Card>
        <CardHeader titulo="Cortes importados" subtitulo={`${state.cortes.length} registros en la sesión`} />
        {cortes.length === 0 ? <Vacio mensaje="Aún no hay cortes importados" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha / hora</th><th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Archivo</th><th className="px-5 py-3">Campaña</th>
                  <th className="px-5 py-3 text-right">Filas</th><th className="px-5 py-3 text-right">Puntos</th>
                  <th className="px-5 py-3">Diferencia vs. corte anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cortes.map((corte, idx) => {
                  const anterior = cortes[idx + 1];
                  const deltaPuntos = anterior ? corte.kpis.puntos - anterior.kpis.puntos : 0;
                  const anteriores = new Map(anterior?.validas.map((s) => [String(s.ID_Socio), String(s.Hizo_Pedido)]) ?? []);
                  const conversiones = anterior
                    ? corte.validas.filter((s) => String(s.Hizo_Pedido) === 'Sí' && anteriores.get(String(s.ID_Socio)) !== 'Sí').length
                    : 0;
                  return (
                    <tr key={corte.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{corte.importadoEn}</td>
                      <td className="px-5 py-3 text-slate-600">Líder demo · Cuenta {corte.cuenta}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{corte.fileName}</td>
                      <td className="px-5 py-3">{corte.campana} · día {corte.diaCampana}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{fmt(corte.validas.length)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold">{fmt(corte.kpis.puntos)}</td>
                      <td className="px-5 py-3">
                        {!anterior ? <Pill>Corte inicial</Pill> : (
                          <div className="space-y-1">
                            <Pill tono={deltaPuntos >= 0 ? 'emerald' : 'rose'}>
                              <TrendingUp size={12} /> {deltaPuntos >= 0 ? '+' : ''}{fmt(deltaPuntos)} pts
                            </Pill>
                            {conversiones > 0 && (
                              <p className="text-xs font-medium text-indigo-600">
                                {conversiones} socios pasaron de Sin Pedido a Con Pedido
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
