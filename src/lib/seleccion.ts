const KEY = 'redpulse.socioSeleccionado';

export function setSocioSeleccionado(id: string): void {
  try { sessionStorage.setItem(KEY, id); } catch { /* sin almacenamiento */ }
}

export function getSocioSeleccionado(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
