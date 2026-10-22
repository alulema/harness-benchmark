export const ACCENT = 'var(--color-accent, #8b70ff)';
export const GRID = 'var(--color-border, rgba(255,255,255,.09))';
export const MUTED = 'var(--color-text-muted, #8b8993)';

export function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function percentagePoints(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)} pp`;
}
