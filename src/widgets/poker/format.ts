import type { EquityResult } from './engine/equity';

/** A probability as a percentage: two decimals when exact, one with an explicit "≈" when simulated, "—" when unknown. */
export function percent(value: number | undefined, result: EquityResult | null): string {
  if (value === undefined || !result) return '—';
  const digits = result.method === 'exact' ? 2 : 1;
  return `${result.method === 'simulation' ? '≈' : ''}${(value * 100).toFixed(digits)}%`;
}
