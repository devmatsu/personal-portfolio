import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import CardPicker from './CardPicker';
import { type Card, cardName } from './engine/cards';
import { MAX_OPPONENTS } from './engine/equity';
import { bestFive, describeHand } from './engine/evaluate';
import HandOdds from './HandOdds';
import PlayingCard from './PlayingCard';
import styles from './poker.module.css';
import PotOdds from './PotOdds';
import Results from './Results';
import {
  addOpponent, BOARD_LABELS, boardSlot, emptyTable, heroSlot, loadTable, nextEmptySlot, opponentSlot, randomize, readTable,
  removeOpponent, saveTable, setOpponentKnown, slotLabel, slotOrder, startingHandName, type Table, withCard,
} from './table';
import { useEquity } from './useEquity';

/** Where a card sits, for the picker's "unavailable" labels. */
function ownerLabel(slot: string, table: Table): string {
  if (slot.startsWith('hero:')) return 'in your hand';
  if (slot.startsWith('board:')) return 'on the board';
  const seat = table.opponents.findIndex((opponent) => slot.startsWith(`opp:${opponent.id}:`)) + 1;
  return `with opponent ${seat}`;
}

export default function Poker() {
  const [table, setTable] = useState<Table>(emptyTable);
  const [active, setActive] = useState(heroSlot(0));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadTable();
    setTable(saved);
    setActive([heroSlot(0), heroSlot(1)].find((slot) => !saved.cards.has(slot)) ?? heroSlot(0));
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) saveTable(table); }, [table, loaded]);
  // Removing an opponent (or making them random) removes their slots; move the selection to the first open spot.
  useEffect(() => {
    const order = slotOrder(table);
    if (!order.includes(active)) setActive(order.find((slot) => !table.cards.has(slot)) ?? heroSlot(0));
  }, [table, active]);

  const { scenario, problems, street } = useMemo(() => readTable(table), [table]);
  const equity = useEquity(loaded && problems.length === 0 ? scenario : null);

  const usedBy = useMemo(() => new Map([...table.cards].map(([slot, card]) => [card, ownerLabel(slot, table)])), [table]);
  const activeCard = table.cards.get(active) ?? null;

  const pick = (card: Card) => {
    if (activeCard === card) { setTable(withCard(table, active, null)); return; }
    const next = withCard(table, active, card);
    setTable(next);
    setActive(nextEmptySlot(next, active));
  };
  const clear = (slot: string) => { setTable(withCard(table, slot, null)); setActive(slot); };

  const hand = useMemo(() => {
    if (scenario.hero.length < 2) return null;
    const cards = [...scenario.hero, ...scenario.board];
    if (cards.length >= 5) {
      const best = bestFive(cards);
      return { name: describeHand(best.score), cards: best.cards };
    }
    return { name: startingHandName(scenario.hero[0], scenario.hero[1]), cards: [] };
  }, [scenario]);

  const opponentResults = table.opponents.map((opponent, index) => ({
    label: `Opponent ${index + 1}`,
    cards: opponent.known && scenario.opponents[index]?.length === 2 ? scenario.opponents[index] : null,
  }));
  const problemCodes = new Set(problems.map((problem) => problem.code));

  const slot = (key: string, placeholder: string, extraClass = '') => {
    const card = table.cards.get(key);
    const label = slotLabel(table, key);
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && card !== undefined) { event.preventDefault(); clear(key); }
    };
    return (
      <span key={key} className={`${styles.slotWrap} ${extraClass}`}>
        <button
          type="button"
          className={`${styles.slot} ${key === active ? styles.slotActive : ''} ${card === undefined ? styles.slotEmpty : ''}`}
          aria-pressed={key === active}
          aria-label={`${label}: ${card === undefined ? 'empty' : cardName(card)}`}
          aria-keyshortcuts={card === undefined ? undefined : 'Delete'}
          onClick={() => setActive(key)}
          onKeyDown={onKeyDown}
        >
          {card === undefined ? <span className={styles.slotPlaceholder}>{placeholder}</span> : <PlayingCard card={card} />}
        </button>
        {card !== undefined && (
          // A pointer shortcut. Keyboard users press Delete on the slot itself, so this stays out of the tab order.
          <button type="button" className={styles.slotRemove} tabIndex={-1} aria-label={`Remove ${cardName(card)} (${label})`} onClick={() => clear(key)}>
            ×
          </button>
        )}
      </span>
    );
  };

  return (
    <section className={styles.widget} aria-label="Texas Hold'em odds calculator">
      {/* Its own grid so the sticky results stop at the bottom of the setup instead of sliding over the panels below. */}
      <div className={styles.main}>
        <div className={styles.setup}>
          <div className={styles.seats}>
            <div className={`${styles.group} ${styles.heroGroup}`}>
              <div className={styles.groupHead}><h2 className={styles.groupTitle}>You</h2></div>
              <div className={styles.slots}>{[0, 1].map((index) => slot(heroSlot(index), '?', styles.heroSlot))}</div>
            </div>
            <div className={`${styles.group} ${problemCodes.has('board-incomplete') ? styles.groupProblem : ''}`}>
              <div className={styles.groupHead}><h2 className={styles.groupTitle}>Board</h2><span className={styles.street}>{street}</span></div>
              <div className={styles.slots}>{BOARD_LABELS.map((label, index) => slot(boardSlot(index), label, index === 3 ? styles.turnSlot : ''))}</div>
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <h2 className={styles.groupTitle}>Opponents <span className={styles.count}>{table.opponents.length}</span></h2>
              <button type="button" className={styles.textButton} onClick={() => setTable(addOpponent(table))} disabled={table.opponents.length >= MAX_OPPONENTS}>
                + Add opponent
              </button>
            </div>
            <ul className={styles.opponents}>
              {table.opponents.map((opponent, index) => {
                const incomplete = opponent.known && [0, 1].some((cardIndex) => !table.cards.has(opponentSlot(opponent.id, cardIndex)));
                return (
                  <li key={opponent.id} className={`${styles.opponent} ${incomplete && problemCodes.has('opponent-incomplete') ? styles.groupProblem : ''}`}>
                    <span className={styles.opponentLabel}>Opponent {index + 1}</span>
                    <div className={styles.toggle} role="group" aria-label={`Opponent ${index + 1} hand`}>
                      <button type="button" aria-pressed={!opponent.known} onClick={() => setTable(setOpponentKnown(table, opponent.id, false))}>Random</button>
                      <button
                        type="button"
                        aria-pressed={opponent.known}
                        onClick={() => {
                          if (opponent.known) return;
                          setTable(setOpponentKnown(table, opponent.id, true));
                          setActive(opponentSlot(opponent.id, 0));
                        }}
                      >
                        Set hand
                      </button>
                    </div>
                    <div className={styles.slots}>
                      {opponent.known
                        ? [0, 1].map((cardIndex) => slot(opponentSlot(opponent.id, cardIndex), '?', styles.smallSlot))
                        : <span className={styles.randomHand} aria-hidden="true"><span /><span /></span>}
                    </div>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remove opponent ${index + 1}`}
                      disabled={table.opponents.length <= 1}
                      onClick={() => setTable(removeOpponent(table, opponent.id))}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <h2 className={styles.groupTitle}>Deck</h2>
              <span className={styles.hint}>Picking for: <strong>{slotLabel(table, active)}</strong></span>
            </div>
            <CardPicker activeCard={activeCard} usedBy={usedBy} onPick={pick} />
            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={() => setTable(randomize(table))}>Randomize</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setTable(emptyTable()); setActive(heroSlot(0)); }}>Reset</button>
            </div>
          </div>
        </div>

        <Results
          equity={equity}
          problems={problems}
          boardSize={scenario.board.length}
          hand={hand}
          opponents={opponentResults}
          hasRandomOpponent={scenario.opponents.some((hand) => hand === null)}
        />
      </div>

      <div className={styles.analysis}>
        <HandOdds result={problems.length ? null : equity.result} blocked={problems.length > 0} calculating={equity.status === 'calculating'} />
        <PotOdds result={problems.length ? null : equity.result} />
      </div>
    </section>
  );
}
