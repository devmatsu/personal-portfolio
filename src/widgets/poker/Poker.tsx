// The poker widget, laid out like a TV broadcast: the board on top, one strip per player with their equity on every
// street and the cards that would put them ahead (their outs). The deck opens on the card slot being picked for.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import CardPicker from './CardPicker';
import { type Card, cardName } from './engine/cards';
import { type EquityResult, MAX_OPPONENTS, type Stats } from './engine/equity';
import { bestFive, describeHand, evaluate } from './engine/evaluate';
import { findOuts, type PlayerOuts } from './engine/outs';
import { percent, wholePercent } from './format';
import PlayingCard from './PlayingCard';
import styles from './poker.module.css';
import {
  addOpponent, BOARD_LABELS, boardSlot, emptyTable, hasKnownHand, heroSlot, loadTable, nextEmptySlot, opponentSlot, ownerLabel,
  pickTitle, readTable, removeOpponent, saveTable, slotExists, slotLabel, slotOrder, startingHandName, type Table, withCard,
} from './table';
import { useEquity } from './useEquity';

/** At this width and below the deck is a bottom sheet; above it, a popover anchored to the selected slot. */
const SHEET_QUERY = '(max-width: 560px)';
/** Space between the slot and the popover (room for its arrow). */
const POPOVER_GAP = 10;
/** The popover keeps this far from the widget's edges, and its arrow this far from the popover's corners. */
const EDGE = 8;
const ARROW_INSET = 14;

const STREETS = [
  { name: 'Preflop', short: 'Pre', boardSize: 0 },
  { name: 'Flop', short: 'Flop', boardSize: 3 },
  { name: 'Turn', short: 'Turn', boardSize: 4 },
  { name: 'River', short: 'River', boardSize: 5 },
] as const;

/**
 * Direction of the equity change since the previous street, judged on the whole percentages shown: no arrow when both
 * read the same ("50%" → "50%"), always one when they differ ("49%" → "50%", "0%" → "<1%").
 */
function trend(current: number | undefined, previous: number | undefined) {
  if (current === undefined || previous === undefined || wholePercent(current) === wholePercent(previous)) return null;
  const points = Math.abs(current - previous) * 100;
  return current > previous
    ? { arrow: '▲', spoken: `up ${points.toFixed(1)} points`, tone: styles.up }
    : { arrow: '▼', spoken: `down ${points.toFixed(1)} points`, tone: styles.down };
}

/** Who is ahead on the viewed board: outs on the flop and turn, the winners on the river. */
type Standing = { kind: 'outs'; players: PlayerOuts[] } | { kind: 'showdown'; winners: boolean[] } | null;

const statsFor = (result: EquityResult | null, seat: number): Stats | undefined => (seat === 0 ? result?.hero : result?.opponents[seat - 1]);

export default function Poker() {
  const [table, setTable] = useState<Table>(loadTable);
  const [active, setActive] = useState(heroSlot(0));
  const [open, setOpen] = useState(false);
  /** Board size being viewed after rewinding to an earlier street; `null` follows the street dealt. */
  const [view, setView] = useState<number | null>(null);
  const slotButtons = useRef(new Map<string, HTMLButtonElement>());
  const root = useRef<HTMLElement>(null);
  const deck = useRef<HTMLElement>(null);
  /** Focus to move once the next render is on screen (the deck may have opened or closed). */
  const afterRender = useRef<(() => void) | null>(null);
  const deckId = useId();
  const addButton = useRef<HTMLButtonElement>(null);

  // Place the deck before it paints: a popover under (or, without room, above) the selected slot, or a bottom sheet on
  // narrow screens. Re-placed when the window or the widget changes size; the page only scrolls (to bring the selected
  // slot clear of the sheet) when the deck opens or moves to another slot, never because something resized.
  useLayoutEffect(() => {
    const panel = deck.current;
    const widget = root.current;
    if (!open || !panel || !widget) return;
    const sheet = window.matchMedia(SHEET_QUERY);
    const place = (scroll: boolean) => {
      const slot = slotButtons.current.get(active);
      if (!slot) return;
      const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
      const target = slot.getBoundingClientRect();
      const height = panel.offsetHeight;
      if (sheet.matches) {
        // Room below the widget so even the last strip can scroll above the sheet.
        widget.style.setProperty('--sheet-height', `${height}px`);
        document.documentElement.style.scrollPaddingBottom = `${height}px`;
        const bottom = window.innerHeight - height - EDGE;
        const top = Math.max(header, 0) + EDGE;
        if (!scroll) return;
        if (target.bottom > bottom) window.scrollBy(0, target.bottom - bottom);
        else if (target.top < top) window.scrollBy(0, target.top - top);
        return;
      }
      widget.style.removeProperty('--sheet-height');
      document.documentElement.style.scrollPaddingBottom = '';
      const bounds = widget.getBoundingClientRect();
      const width = panel.offsetWidth;
      const left = Math.max(EDGE, Math.min(target.left - bounds.left, bounds.width - width - EDGE));
      const fitsBelow = target.bottom + POPOVER_GAP + height <= window.innerHeight;
      const above = !fitsBelow && target.top - POPOVER_GAP - height >= header;
      const top = above ? target.top - bounds.top - POPOVER_GAP - height : target.bottom - bounds.top + POPOVER_GAP;
      const arrow = Math.max(ARROW_INSET, Math.min(target.left + target.width / 2 - bounds.left - left, width - ARROW_INSET));
      panel.style.setProperty('--pop-x', `${left}px`);
      panel.style.setProperty('--pop-y', `${top}px`);
      panel.style.setProperty('--arrow-x', `${arrow}px`);
      panel.dataset.side = above ? 'above' : 'below';
    };
    place(true);
    const replace = () => place(false);
    const observer = new ResizeObserver(replace);
    observer.observe(widget);
    window.addEventListener('resize', replace);
    sheet.addEventListener('change', replace);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', replace);
      sheet.removeEventListener('change', replace);
      widget.style.removeProperty('--sheet-height');
      document.documentElement.style.scrollPaddingBottom = '';
    };
  }, [open, active]);

  // A click anywhere else closes the deck, except on a card slot (which re-anchors or toggles it) and on the sheet's
  // scrim (which closes it itself, so the tap doesn't fall through to whatever is underneath).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (deck.current?.contains(target) || target.closest('[data-slot], [data-scrim]')) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => { saveTable(table); }, [table]);
  useEffect(() => {
    afterRender.current?.();
    afterRender.current = null;
  });

  const { scenario, problems, street } = useMemo(() => readTable(table), [table]);
  const blocked = problems.length > 0;
  const equity = useEquity(blocked ? null : scenario);
  const calculating = equity.status === 'calculating';
  const dealt = scenario.board.length;
  const viewSize = blocked || view === null ? dealt : view;
  const rewound = !blocked && viewSize < dealt;
  const allKnown = scenario.opponents.every((hand) => hand !== null);

  const viewBoard = useMemo(() => scenario.board.slice(0, viewSize), [scenario, viewSize]);
  const standing = useMemo((): Standing => {
    if (blocked || !allKnown) return null;
    const hands = [scenario.hero, ...(scenario.opponents as Card[][])];
    if (viewBoard.length === 3 || viewBoard.length === 4) return { kind: 'outs', players: findOuts(hands, viewBoard) };
    if (viewBoard.length !== 5) return null;
    const scores = hands.map((hand) => evaluate([...hand, ...viewBoard]));
    const best = Math.max(...scores);
    return { kind: 'showdown', winners: scores.map((score) => score === best) };
  }, [blocked, allKnown, scenario, viewBoard]);

  const usedBy = useMemo(() => new Map([...table.cards].map(([slot, card]) => [card, ownerLabel(table, slot)])), [table]);
  const activeCard = table.cards.get(active) ?? null;

  /** Equity with the board cut to `boardSize` cards: the latest result for the street dealt, earlier streets after it. */
  const resultAt = (boardSize: number): EquityResult | null => {
    if (blocked || boardSize > dealt) return null;
    return boardSize === dealt ? equity.result : equity.streets.get(boardSize) ?? null;
  };
  // Fixed seats, like a broadcast: you first, then opponents in table order.
  const players = [
    { key: 'hero', name: 'You', hand: scenario.hero as Card[] | null, opponent: null as Table['opponents'][number] | null, seat: 0 },
    ...table.opponents.map((opponent, index) => ({ key: `opp-${opponent.id}`, name: `Opponent ${index + 1}`, hand: scenario.opponents[index], opponent, seat: index + 1 })),
  ];

  // Any edit shows the table as dealt again, and closes the deck if the slot being picked for is gone (a removed opponent).
  const update = (next: Table) => {
    setTable(next);
    setView(null);
    if (!slotExists(next, active)) setOpen(false);
  };
  const focusDeck = () => { afterRender.current = () => deck.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus(); };
  const closeDeck = () => {
    setOpen(false);
    slotButtons.current.get(active)?.focus();
  };
  const select = (slot: string) => {
    if (open && slot === active) { setOpen(false); return; }
    setActive(slot);
    setOpen(true);
    focusDeck();
  };
  const pick = (card: Card) => {
    if (activeCard === card) { update(withCard(table, active, null)); return; }
    const next = withCard(table, active, card);
    update(next);
    const after = nextEmptySlot(next, active);
    const target = after !== active ? after : slotOrder(next).find((slot) => !next.cards.has(slot));
    if (target !== undefined) { setActive(target); return; }
    // Every slot is filled: the deck closes and focus returns to the card just picked.
    const filled = active;
    setOpen(false);
    afterRender.current = () => slotButtons.current.get(filled)?.focus();
  };
  const clear = (slot: string) => { update(withCard(table, slot, null)); setActive(slot); };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    closeDeck();
  };

  const slot = (key: string, placeholder: string, extraClass: string, faceDown = false) => {
    const card = table.cards.get(key);
    const label = slotLabel(table, key);
    const selected = open && key === active;
    let state = 'empty';
    if (card !== undefined) state = cardName(card);
    else if (faceDown) state = 'random, pick a card';
    let look = styles.filled;
    if (faceDown) look = styles.faceDown;
    else if (card === undefined) look = styles.slotEmpty;
    return (
      <span key={key} className={`${styles.slotWrap} ${extraClass}`} data-slot="">
        <button
          ref={(element) => {
            if (element) slotButtons.current.set(key, element);
            else slotButtons.current.delete(key);
          }}
          type="button"
          className={`${styles.slot} ${selected ? styles.slotActive : ''} ${look}`}
          aria-expanded={selected}
          aria-controls={selected ? deckId : undefined}
          aria-label={`${label}: ${state}`}
          aria-keyshortcuts={card === undefined ? undefined : 'Delete'}
          onClick={() => select(key)}
          onKeyDown={(event) => {
            if ((event.key === 'Backspace' || event.key === 'Delete') && card !== undefined) { event.preventDefault(); clear(key); }
          }}
        >
          {card !== undefined && <PlayingCard card={card} size={key.startsWith('board:') ? 'xl' : 'md'} />}
          {card === undefined && !faceDown && <span className={styles.slotPlaceholder}>{placeholder}</span>}
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

  const outsArea = (seat: number): { content: ReactNode; lead: boolean } => {
    if (standing?.kind === 'showdown') {
      const lead = standing.winners[seat];
      const split = standing.winners.filter(Boolean).length > 1;
      return { lead, content: lead ? <span className={styles.badge}>{split ? 'Split pot' : 'Winner'}</span> : null };
    }
    // Nothing to show until the table can be calculated; on preflop, a dash (outs start on the flop).
    if (blocked) return { lead: false, content: null };
    if (standing?.kind !== 'outs') return { lead: false, content: <span className={styles.none}>–</span> };
    const { leading, outs, label } = standing.players[seat];
    if (leading) return { lead: true, content: <span className={styles.badge}>Ahead</span> };
    if (outs.length === 0) return { lead: false, content: <span className={styles.none}>{viewSize === 4 ? 'Drawing dead' : 'No outs on the next card'}</span> };
    const count = `${outs.length} ${outs.length === 1 ? 'out' : 'outs'}`;
    return {
      lead: false,
      content: (
        <>
          <span className={styles.outsCount} aria-hidden="true"><b>{outs.length}</b> {outs.length === 1 ? 'out' : 'outs'} · {label}</span>
          <span className={styles.outCards} role="img" aria-label={`${count}, ${label}: ${outs.map(cardName).join(', ')}`}>
            {outs.map((card) => <PlayingCard key={card} card={card} size="sm" />)}
          </span>
        </>
      ),
    };
  };

  let status = '';
  if (blocked) status = problems[0].message;
  else if (equity.status === 'error') status = equity.error ?? 'Something went wrong.';
  else if (calculating) status = 'Calculating…';
  const viewName = STREETS.find((entry) => entry.boardSize === viewSize)?.name ?? street;

  return (
    <section ref={root} className={styles.widget} aria-label="Texas Hold'em table" onKeyDown={onKeyDown}>
      <div className={styles.felt}>
        <span className={styles.streetLabel}>{blocked ? street : rewound ? `${viewName} replay` : viewName}</span>
        <div className={styles.board}>
          {BOARD_LABELS.map((label, index) => slot(
            boardSlot(index),
            label,
            `${styles.boardSlot} ${index >= 3 ? styles.gapBefore : ''} ${rewound && index >= viewSize ? styles.later : ''}`,
          ))}
        </div>
      </div>

      {open && (
        <>
          {/* Behind the bottom sheet on narrow screens (hidden otherwise): tapping it closes the deck. */}
          <div className={styles.scrim} data-scrim="" aria-hidden="true" onClick={closeDeck} />
          <section id={deckId} ref={deck} className={styles.deck} role="dialog" aria-modal="false" aria-labelledby={`${deckId}-title`}>
            <div className={styles.deckHead}>
              <h2 id={`${deckId}-title`} className={styles.deckTitle}>{pickTitle(table, active)}</h2>
              {/* On touch screens slots have no × of their own; this empties the slot and keeps the deck on it. */}
              {activeCard !== null && (
                <button type="button" className={styles.deckRemove} onClick={() => { update(withCard(table, active, null)); focusDeck(); }}>
                  Remove card
                </button>
              )}
              <button type="button" className={styles.deckClose} aria-label="Close the deck" onClick={closeDeck}>×</button>
            </div>
            {/* The sheet can cover the status line, so it repeats what's missing (narrow screens only). */}
            {blocked && <p className={styles.deckStatus}>{status}</p>}
            <CardPicker activeCard={activeCard} usedBy={usedBy} onPick={pick} />
          </section>
        </>
      )}

      <p className={styles.status} role="status">{status || '\u00a0'}</p>

      <div className={styles.players}>
        <div className={`${styles.row} ${styles.columns}`}>
          <div className={styles.cells} role="group" aria-label="Show the table at a street">
            {STREETS.map((entry) => (
              <button
                key={entry.name}
                type="button"
                className={styles.streetButton}
                aria-label={entry.name}
                aria-pressed={!blocked && entry.boardSize === viewSize}
                disabled={blocked || entry.boardSize > dealt}
                onClick={() => setView(entry.boardSize === dealt ? null : entry.boardSize)}
              >
                {entry.short}
              </button>
            ))}
          </div>
          <span className={styles.outsHead} aria-hidden="true">Outs</span>
        </div>

        <ul className={styles.strips} aria-label="Players">
          {players.map((player) => {
            const { seat, hand, opponent } = player;
            const outs = outsArea(seat);
            let made = 'Pick two cards';
            if (hand === null) made = 'Random hand';
            else if (hand.length === 2) made = viewBoard.length >= 3 ? describeHand(bestFive([...hand, ...viewBoard]).score) : startingHandName(hand[0], hand[1]);
            return (
              <li key={player.key} className={`${styles.row} ${styles.strip} ${seat === 0 ? styles.hero : ''} ${outs.lead ? styles.lead : ''}`}>
                <div className={styles.who}>
                  <span className={styles.name}>{player.name}</span>
                  <span className={styles.made}>{made}</span>
                </div>
                <div className={styles.hole}>
                  {/* An opponent without cards holds a random hand, shown face down; clicking a card picks it. */}
                  {[0, 1].map((index) => slot(
                    opponent ? opponentSlot(opponent.id, index) : heroSlot(index),
                    '?',
                    styles.holeSlot,
                    opponent !== null && !hasKnownHand(table, opponent.id),
                  ))}
                </div>
                <div className={`${styles.cells} ${calculating && !blocked ? styles.stale : ''}`}>
                  {STREETS.map((entry, index) => {
                    const future = blocked || entry.boardSize > dealt;
                    const result = resultAt(entry.boardSize);
                    const value = statsFor(result, seat)?.equity;
                    const direction = future || index === 0 ? null : trend(value, statsFor(resultAt(STREETS[index - 1].boardSize), seat)?.equity);
                    // Earlier streets are calculated after the current one; show they're on the way rather than unknown.
                    const pending = !future && result === null && equity.status !== 'error';
                    return (
                      <div
                        key={entry.name}
                        className={`${styles.cell} ${!future && entry.boardSize === viewSize ? styles.now : ''} ${future ? styles.future : ''}`}
                        title={future || pending || value === undefined ? undefined : percent(value, result)}
                      >
                        <span className="sr-only">{entry.name}: </span>
                        <span className={styles.value}>
                          {future
                            ? <><span aria-hidden="true">–</span><span className="sr-only">{blocked ? 'unknown' : 'not dealt'}</span></>
                            : pending ? '…' : value === undefined ? '—' : wholePercent(value)}
                        </span>
                        {/* The arrow's slot is always there, so values line up down each column with or without one. */}
                        <span className={`${styles.arrow} ${direction?.tone ?? ''}`}>
                          {direction && <><span aria-hidden="true">{direction.arrow}</span><span className="sr-only">, {direction.spoken}</span></>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.outs}>{outs.content}</div>
                {opponent && (
                  <div className={styles.controls}>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remove ${player.name.toLowerCase()}`}
                      disabled={table.opponents.length <= 1}
                      onClick={() => {
                        update(removeOpponent(table, opponent.id));
                        // The button itself is gone with the strip; keep focus somewhere sensible.
                        afterRender.current = () => addButton.current?.focus();
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!blocked && !allKnown && <p className={styles.note}>Outs need every hand face up. Click a face-down card to set it.</p>}

        <div className={styles.actions}>
          <button ref={addButton} type="button" className={styles.textButton} onClick={() => update(addOpponent(table))} disabled={table.opponents.length >= MAX_OPPONENTS}>
            + Add opponent
          </button>
          <button
            type="button"
            className={`${styles.textButton} ${styles.reset}`}
            onClick={() => {
              // An empty table; the deck opens on your first card, the next thing to pick.
              update(emptyTable());
              setActive(heroSlot(0));
              setOpen(true);
              focusDeck();
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
