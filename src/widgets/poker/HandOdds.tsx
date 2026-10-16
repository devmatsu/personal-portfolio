import type { EquityResult } from './engine/equity';
import { HAND_CATEGORIES } from './engine/evaluate';
import { percent } from './format';
import styles from './poker.module.css';

interface Props {
  result: EquityResult | null;
  /** The scenario can't be calculated: show every hand as unknown. */
  blocked: boolean;
  calculating: boolean;
}

// Best hand first. A royal flush is the top straight flush.
const ORDER = HAND_CATEGORIES.map((name, index) => ({ name, index })).reverse();

/** Your chance of finishing with each hand by the river: what you can still make, and how likely it is. */
export default function HandOdds({ result, blocked, calculating }: Props) {
  const hands = blocked ? null : result?.heroHands ?? null;
  return (
    <section className={styles.group} aria-labelledby="poker-hand-odds">
      <div className={styles.groupHead}>
        <h2 id="poker-hand-odds" className={styles.groupTitle}>Hand odds</h2>
        <span className={styles.hint}>Your chance to finish with each hand by the river</span>
      </div>
      <ul className={`${styles.handOdds} ${calculating && !blocked ? styles.stale : ''}`}>
        {ORDER.map(({ name, index }) => {
          const value = hands?.[index];
          return (
            <li key={name} className={value === 0 ? styles.handOddsZero : ''}>
              <span className={styles.handOddsName}>{name}</span>
              <span className={styles.barTrack} aria-hidden="true"><span className={styles.barFill} style={{ width: `${(value ?? 0) * 100}%` }} /></span>
              <span className={styles.handOddsValue}>{percent(value, hands ? result : null)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
