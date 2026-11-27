import type { AppState } from '../types';

const KEY = 'redpulse.state.v1';

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.cortes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* capacidad agotada: el prototipo sigue funcionando en memoria */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sin localStorage disponible */
  }
}
