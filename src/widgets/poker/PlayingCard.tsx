import { type Card, RANK_LABELS, rankOf, SUIT_SYMBOLS, suitOf } from './engine/cards';
import styles from './poker.module.css';

/** Background class per suit (spades, hearts, diamonds, clubs): a four-colour deck, shared with the deck picker. */
export const SUIT_CLASSES = [styles.spades, styles.hearts, styles.diamonds, styles.clubs];

/**
 * A card face: a solid block in its suit's colour with the rank above the suit. `xl` and `md` fill their slot (board and
 * hole cards); `sm` is a fixed small card (outs). Decorative: the surrounding control carries the accessible name.
 */
export default function PlayingCard({ card, size }: { card: Card; size: 'xl' | 'md' | 'sm' }) {
  return (
    <span className={`${styles.face} ${styles[size]} ${SUIT_CLASSES[suitOf(card)]}`} aria-hidden="true">
      <b>{RANK_LABELS[rankOf(card)]}</b>
      <i>{SUIT_SYMBOLS[suitOf(card)]}</i>
    </span>
  );
}
