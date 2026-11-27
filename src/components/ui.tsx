import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function CardHeader({ titulo, subtitulo, derecha }: { titulo: string; subtitulo?: string; derecha?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {derecha}
    </div>
  );
}

export function Btn({
  children, variant = 'primary', size = 'md', className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'emerald';
  size?: 'sm' | 'md';
}) {
  const estilos: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'} ${estilos[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tono = 'slate' }: { children: ReactNode; tono?: string }) {
  const tonos: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tonos[tono] ?? tonos.slate}`}>{children}</span>;
}

export function KpiCard({
  etiqueta, valor, detalle, tono = 'indigo',
}: { etiqueta: string; valor: string; detalle?: string; tono?: string }) {
  const acentos: Record<string, string> = {
    indigo: 'text-indigo-600', emerald: 'text-emerald-600',
    rose: 'text-rose-600', amber: 'text-amber-600', slate: 'text-slate-900',
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${acentos[tono] ?? acentos.indigo}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </Card>
  );
}

export function Barra({ valor, maximo, tono = 'bg-indigo-600' }: { valor: number; maximo: number; tono?: string }) {
  const pct = maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${tono}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Vacio({ mensaje }: { mensaje: string }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-500">{mensaje}</div>;
}

export function Encabezado({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones}
    </div>
  );
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-slate-400">{ayuda}</span>}
    </label>
  );
}

export const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
