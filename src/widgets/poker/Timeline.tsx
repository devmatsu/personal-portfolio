import type { EquityResult } from './engine/equity';
import { percent } from './format';
import styles from './poker.module.css';
import type { EquityState } from './useEquity';

const STREETS = [
  { name: 'Preflop', boardSize: 0 },
  { name: 'Flop', boardSize: 3 },
  { name: 'Turn', boardSize: 4 },
  { name: 'River', boardSize: 5 },
] as const;

interface Props {
  equity: EquityState;
  /** Cards on the board now; later streets haven't happened yet. */
  boardSize: number;
  /** The scenario can't be calculated (shows every street as unknown). */
  blocked: boolean;
}

/** Change in equity from the previous street, in percentage points: "+5.6 pts", "−3.2 pts". */
function delta(current: EquityResult | null, previous: EquityResult | null) {
  if (!current || !previous) return null;
  const points = Math.round((current.hero.equity - previous.hero.equity) * 1000) / 10;
  if (points === 0) return { text: '±0.0 pts', tone: '' };
  return points > 0 ? { text: `+${points.toFixed(1)} pts`, tone: styles.up } : { text: `−${Math.abs(points).toFixed(1)} pts`, tone: styles.down };
}

/** Your equity street by street with the same hands: how each card dealt so far moved your chances. */
export default function Timeline({ equity, boardSize, blocked }: Props) {
  const { result, streets, status } = equity;
  const entries = STREETS.map((street) => {
    const phase = blocked || street.boardSize > boardSize ? 'future' : street.boardSize === boardSize ? 'current' : 'past';
    const value = phase === 'current' ? result : phase === 'past' ? streets.get(street.boardSize) ?? null : null;
    return { ...street, phase, value };
  });

  return (
    <div className={styles.timeline}>
      <span className={styles.boxLabel}>By street</span>
      <ol className={`${styles.streets} ${status === 'calculating' && !blocked ? styles.stale : ''}`} aria-label="Equity by street">
        {entries.map((entry, index) => {
          const change = delta(entry.value, entries[index - 1]?.value ?? null);
          // Earlier streets are calculated after the current one; show they're on the way rather than unknown.
          const pending = entry.phase === 'past' && !entry.value && status !== 'error';
          return (
            <li
              key={entry.name}
              className={`${styles.streetItem} ${entry.phase === 'current' ? styles.streetCurrent : ''} ${entry.phase === 'future' ? styles.streetFuture : ''}`}
              aria-current={entry.phase === 'current' ? 'step' : undefined}
            >
              <span className={styles.streetTrack} aria-hidden="true">
                <span className={styles.streetFill} style={{ height: `${(entry.value?.hero.equity ?? 0) * 100}%` }} />
              </span>
              <span className={styles.streetName}>{entry.name}</span>
              <span className={styles.streetValue}>{pending ? '…' : percent(entry.value?.hero.equity, entry.value)}</span>
              <span className={`${styles.streetDelta} ${change?.tone ?? ''}`}>{change?.text ?? '\u00a0'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
