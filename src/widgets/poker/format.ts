import type { EquityResult } from './engine/equity';

/** A probability as a percentage: two decimals when exact, one with an explicit "≈" when simulated, "—" when unknown. */
export function percent(value: number | undefined, result: EquityResult | null): string {
  if (value === undefined || !result) return '—';
  const digits = result.method === 'exact' ? 2 : 1;
  return `${result.method === 'simulation' ? '≈' : ''}${(value * 100).toFixed(digits)}%`;
}

/** A whole percentage, as on a TV broadcast: "60%", with "<1%" and ">99%" so a live hand never reads as 0% or 100%. */
export function wholePercent(value: number): string {
  const rounded = Math.round(value * 100);
  if (rounded === 0 && value > 0) return '<1%';
  if (rounded === 100 && value < 1) return '>99%';
  return `${rounded}%`;
}
