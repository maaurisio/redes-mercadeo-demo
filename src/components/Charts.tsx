export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
  partial?: boolean;
}

export function BarChartSVG({
  datos, altura = 256, color = '#4f46e5', showLine = false,
}: { datos: BarDatum[]; altura?: number; color?: string; showLine?: boolean }) {
  const maximo = Math.max(1, ...datos.map((d) => d.value));
  const ancho = 1000;
  const alto = 260;
  const paddingBottom = 26;
  const area = alto - paddingBottom;
  const paso = ancho / Math.max(1, datos.length);
  const barra = Math.max(4, paso * 0.62);
  const puntos = datos.map((d, i) => {
    const h = (d.value / maximo) * (area - 12);
    return { x: i * paso + (paso - barra) / 2, y: area - h, h, d };
  });
  const linea = puntos.map((p) => `${p.x + barra / 2},${p.y}`).join(' ');

  return (
    <div className="h-64 w-full" style={{ height: altura }}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className="h-full w-full">
        <line x1="0" y1={area} x2={ancho} y2={area} stroke="#E2E8F0" strokeWidth="1" />
        {puntos.map((p, i) => (
          <g key={`${p.d.label}-${i}`}>
            <rect x={p.x} y={p.y} width={barra} height={Math.max(1, p.h)} rx="2" fill={p.d.color ?? color} opacity={p.d.partial ? 0.55 : 1}>
              <title>{p.d.tooltip ?? `${p.d.label}: ${p.d.value.toLocaleString('es-MX')}`}</title>
            </rect>
            {datos.length <= 21 && (
              <text x={p.x + barra / 2} y={alto - 8} textAnchor="middle" fontSize="9" fill="#64748B">{p.d.label}</text>
            )}
          </g>
        ))}
        {showLine && <polyline points={linea} fill="none" stroke="#10B981" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}

export function DonutSVG({
  partes, total, centro,
}: { partes: Array<{ label: string; value: number; color: string }>; total: number; centro: string }) {
  const radio = 15.9155;
  let acumulado = 0;
  return (
    <div className="h-64 w-full" style={{ height: 256 }}>
      <svg viewBox="0 0 42 42" className="h-full w-full">
        <circle cx="21" cy="21" r={radio} fill="none" stroke="#F1F5F9" strokeWidth="6" />
        {partes.map((p) => {
          const porcentaje = total > 0 ? (p.value / total) * 100 : 0;
          const offset = -acumulado;
          acumulado += porcentaje;
          return (
            <circle
              key={p.label}
              cx="21" cy="21" r={radio}
              fill="none" stroke={p.color} strokeWidth="6"
              strokeDasharray={`${porcentaje} ${100 - porcentaje}`}
              strokeDashoffset={offset}
            >
              <title>{`${p.label}: ${p.value.toLocaleString('es-MX')} (${porcentaje.toFixed(1)}%)`}</title>
            </circle>
          );
        })}
        <text x="21" y="20.5" textAnchor="middle" fontSize="3.2" fontWeight="700" fill="#0F172A">{centro}</text>
        <text x="21" y="24" textAnchor="middle" fontSize="2" fill="#64748B">socios</text>
      </svg>
    </div>
  );
}
