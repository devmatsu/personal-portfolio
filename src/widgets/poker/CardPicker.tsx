import { useRef, useState, type KeyboardEvent } from 'react';
import { type Card, cardName, RANK_LABELS, SUIT_NAMES, SUIT_SYMBOLS } from './engine/cards';
import { SUIT_CLASSES } from './PlayingCard';
import styles from './poker.module.css';

interface Props {
  /** Card in the slot being edited, if any (shown as selected; picking it again removes it). */
  activeCard: Card | null;
  /** Where each used card is, e.g. "in your hand", for cards that can't be picked. */
  usedBy: Map<Card, string>;
  onPick: (card: Card) => void;
}

// Rows by suit, ranks from ace down, like a sorted hand.
const ROWS = [0, 1, 2, 3].map((suit) => Array.from({ length: 13 }, (_, index) => (12 - index) * 4 + suit));
const ORDER = ROWS.flat();

/**
 * The 52-card deck as one keyboard stop: arrow keys move between cards (left/right within a suit, up/down between
 * suits), Home/End jump to the row ends, Enter or Space picks.
 */
export default function CardPicker({ activeCard, usedBy, onPick }: Props) {
  const [focused, setFocused] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = Math.max(0, Math.min(ORDER.length - 1, index));
    setFocused(next);
    buttons.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const column = index % 13;
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, ArrowDown: index + 13, ArrowUp: index - 13, Home: index - column, End: index - column + 12 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    move(moves[event.key]);
  };

  return (
    <div className={styles.picker} role="group" aria-label="Deck: pick a card for the selected spot">
      {ROWS.map((row, rowIndex) => (
        <div className={styles.pickerRow} key={rowIndex} aria-label={SUIT_NAMES[rowIndex]} role="group">
          {row.map((card) => {
            const index = ORDER.indexOf(card);
            const owner = card === activeCard ? null : usedBy.get(card) ?? null;
            return (
              <button
                key={card}
                ref={(element) => { buttons.current[index] = element; }}
                type="button"
                tabIndex={index === focused ? 0 : -1}
                className={`${styles.pick} ${SUIT_CLASSES[card & 3]} ${card === activeCard ? styles.pickSelected : ''}`}
                aria-disabled={owner !== null}
                aria-pressed={card === activeCard}
                aria-label={owner ? `${cardName(card)}, ${owner}` : cardName(card)}
                onFocus={() => setFocused(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => { if (owner === null) onPick(card); }}
              >
                {RANK_LABELS[card >> 2]}<span aria-hidden="true">{SUIT_SYMBOLS[card & 3]}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
