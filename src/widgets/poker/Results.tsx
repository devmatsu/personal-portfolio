import type { Card } from './engine/cards';
import { type EquityResult, marginOfError, type Problem, type Stats } from './engine/equity';
import { percent } from './format';
import PlayingCard from './PlayingCard';
import styles from './poker.module.css';
import Timeline from './Timeline';
import type { EquityState } from './useEquity';

interface Props {
  equity: EquityState;
  problems: Problem[];
  /** Cards on the board now, for the street-by-street timeline. */
  boardSize: number;
  /** Your current hand: a name and, from the flop on, the best five cards. */
  hand: { name: string; cards: Card[] } | null;
  opponents: { label: string; cards: Card[] | null }[];
  /** Any opponent's hand is random (exact counts are then deals, not just boards). */
  hasRandomOpponent: boolean;
}

function Bar({ label, value, result, tone }: { label: string; value: number | undefined; result: EquityResult | null; tone: 'win' | 'tie' | 'lose' }) {
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <span className={styles.barTrack} aria-hidden="true"><span className={`${styles.barFill} ${styles[tone]}`} style={{ width: `${(value ?? 0) * 100}%` }} /></span>
      <span className={styles.barValue}>{percent(value, result)}</span>
    </div>
  );
}

function methodLabel(result: EquityResult, hasRandomOpponent: boolean) {
  if (result.method === 'exact') return { name: 'Exact', detail: `${result.samples.toLocaleString('en-US')} ${hasRandomOpponent ? 'deals' : result.samples === 1 ? 'board' : 'boards'} counted` };
  return { name: 'Simulated', detail: `±${(marginOfError(result) * 100).toFixed(2)} pts · ${result.samples.toLocaleString('en-US')} random deals` };
}

export default function Results({ equity, problems, boardSize, hand, opponents, hasRandomOpponent }: Props) {
  const { result, status } = equity;
  const calculating = status === 'calculating';
  const method = result ? methodLabel(result, hasRandomOpponent) : null;
  const hero: Stats | undefined = result?.hero;
  let statusText = '';
  if (problems.length) statusText = problems[0].message;
  else if (status === 'error') statusText = equity.error ?? 'Something went wrong.';
  else if (calculating) statusText = result?.method === 'simulation' ? 'Simulating…' : 'Calculating…';

  return (
    <aside className={styles.results} aria-labelledby="poker-results-title" aria-busy={calculating}>
      <div className={styles.resultsHead}>
        <h2 id="poker-results-title" className={styles.resultsTitle}>Your equity</h2>
        {method && !problems.length && (
          <span className={`${styles.method} ${result?.method === 'exact' ? styles.exact : ''}`} title={method.detail}>{method.name}</span>
        )}
      </div>
      <p className={`${styles.equity} ${problems.length ? styles.equityEmpty : calculating ? styles.stale : ''}`} data-testid="hero-equity">
        {problems.length ? '—' : percent(hero?.equity, result)}
      </p>
      <p className={styles.resultsMeta} role="status">{statusText || (method ? method.detail : '\u00a0')}</p>

      <div className={`${styles.bars} ${calculating || problems.length ? styles.stale : ''}`}>
        <Bar label="Win" value={problems.length ? undefined : hero?.win} result={result} tone="win" />
        <Bar label="Tie" value={problems.length ? undefined : hero?.tie} result={result} tone="tie" />
        <Bar label="Lose" value={problems.length ? undefined : hero?.lose} result={result} tone="lose" />
      </div>

      <Timeline equity={equity} boardSize={boardSize} blocked={problems.length > 0} />

      <div className={styles.handBox}>
        <span className={styles.boxLabel}>Your hand</span>
        {hand ? (
          <>
            <span className={styles.handName}>{hand.name}</span>
            {hand.cards.length > 0 && <span className={styles.handCards}>{hand.cards.map((card) => <PlayingCard key={card} card={card} size="sm" />)}</span>}
          </>
        ) : <span className={styles.handName}>Pick your two cards</span>}
      </div>

      <ul className={`${styles.opponentResults} ${calculating || problems.length ? styles.stale : ''}`} aria-label="Opponents">
        {opponents.map((opponent, index) => {
          const stats = problems.length ? undefined : result?.opponents[index];
          return (
            <li key={opponent.label}>
              <span className={styles.opponentName}>
                {opponent.label}
                {opponent.cards ? <span className={styles.opponentCards}>{opponent.cards.map((card) => <PlayingCard key={card} card={card} size="sm" />)}</span> : <span className={styles.randomTag}>Random</span>}
              </span>
              <span className={styles.opponentEquity}>{percent(stats?.equity, result)}</span>
              <span className={styles.opponentDetail}>win {percent(stats?.win, result)} · tie {percent(stats?.tie, result)}</span>
            </li>
          );
        })}
      </ul>

      <details className={styles.explain}>
        <summary>Equity vs. chance to win</summary>
        <p>
          <strong>Equity</strong> is your average share of the pot if all the cards were dealt out: a win counts as the whole pot,
          a split pot as your share of it (half of a two-way tie). <strong>Win</strong> only counts the hands you win outright.
          With a known board and hands it's <em>exact</em>, counting every possible deal; with too many possibilities it's
          <em> simulated</em> from random deals, shown with its margin of error.
        </p>
      </details>
    </aside>
  );
}
