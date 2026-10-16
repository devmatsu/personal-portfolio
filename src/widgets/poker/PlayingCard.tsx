import { type Card, RANK_LABELS, rankOf, SUIT_SYMBOLS, suitOf } from './engine/cards';
import styles from './poker.module.css';

/** Colour class per suit (spades, hearts, diamonds, clubs): a four-colour deck. */
export const SUIT_CLASSES = [styles.spades, styles.hearts, styles.diamonds, styles.clubs];

/** A card face. Decorative: the surrounding control carries the accessible name. */
export default function PlayingCard({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' }) {
  return (
    <span className={`${styles.face} ${styles[size]} ${SUIT_CLASSES[suitOf(card)]}`} aria-hidden="true">
      <span className={styles.faceRank}>{RANK_LABELS[rankOf(card)]}</span>
      <span className={styles.faceSuit}>{SUIT_SYMBOLS[suitOf(card)]}</span>
    </span>
  );
}
