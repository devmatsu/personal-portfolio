import { useEffect, useId, useState } from 'react';
import { type EquityResult, marginOfError } from './engine/equity';
import { percent } from './format';
import styles from './poker.module.css';

interface Props {
  /** Your equity, when the scenario has been calculated. */
  result: EquityResult | null;
}

const STORAGE_KEY = 'v3.poker.potOdds';

function load(): { pot: string; call: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { pot?: unknown; call?: unknown } | null;
    return { pot: typeof saved?.pot === 'string' ? saved.pot : '', call: typeof saved?.call === 'string' ? saved.call : '' };
  } catch {
    return { pot: '', call: '' };
  }
}

/** A non-negative amount from a text field, or null when it's empty or not a number. */
function amount(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

const formatAmount = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

/**
 * Pot odds: the equity a call needs (call ÷ (pot + call)) next to the equity you have, and what the call is worth on
 * average. Only this decision: future bets (implied odds) aren't included.
 */
export default function PotOdds({ result }: Props) {
  const [values, setValues] = useState(load);
  const id = useId();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* Storage is optional. */ }
  }, [values]);

  const pot = amount(values.pot);
  const call = amount(values.call);
  const ready = pot !== null && call !== null && call > 0;
  const needed = ready ? call / (pot + call) : null;

  let verdict: { text: string; tone: string } | null = null;
  if (needed !== null && result && pot !== null && call !== null) {
    const equity = result.hero.equity;
    const expected = equity * (pot + call) - call;
    if (result.method === 'simulation' && Math.abs(equity - needed) <= marginOfError(result)) {
      verdict = { text: `Too close to call from a simulated estimate (±${(marginOfError(result) * 100).toFixed(2)} pts).`, tone: '' };
    } else if (Math.abs(expected) < 0.005) {
      verdict = { text: 'Break-even: calling neither wins nor loses on average.', tone: '' };
    } else if (expected > 0) {
      verdict = { text: `Calling is profitable: +${formatAmount(expected)} on average.`, tone: styles.up };
    } else {
      verdict = { text: `Folding is better: calling loses ${formatAmount(-expected)} on average.`, tone: styles.down };
    }
  }

  return (
    <section className={styles.group} aria-labelledby={`${id}-title`}>
      <div className={styles.groupHead}><h2 id={`${id}-title`} className={styles.groupTitle}>Pot odds</h2></div>
      <div className={styles.potFields}>
        <label className={styles.field}>
          <span>Pot, including the bet</span>
          <input type="number" inputMode="decimal" min={0} step="any" placeholder="0" value={values.pot} onChange={(event) => setValues({ ...values, pot: event.target.value })} />
        </label>
        <label className={styles.field}>
          <span>To call</span>
          <input type="number" inputMode="decimal" min={0} step="any" placeholder="0" value={values.call} onChange={(event) => setValues({ ...values, call: event.target.value })} />
        </label>
      </div>
      <dl className={styles.potSummary}>
        <div><dt>Equity needed</dt><dd>{needed === null ? '—' : `${(needed * 100).toFixed(1)}%`}</dd></div>
        <div><dt>Your equity</dt><dd>{percent(result?.hero.equity, result)}</dd></div>
      </dl>
      <p className={`${styles.potVerdict} ${verdict?.tone ?? ''}`} role="status">
        {verdict?.text ?? (ready ? 'Complete the hands above to compare.' : 'Enter the pot and the bet you face.')}
      </p>
    </section>
  );
}
