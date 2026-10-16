// A card is an integer 0–51: rank * 4 + suit. Ranks run 0 (two) to 12 (ace); suits are spades, hearts, diamonds, clubs.
export type Card = number;

export const RANK_CHARS = '23456789TJQKA';
export const SUIT_CHARS = 'shdc';
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;
export const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export const RANK_NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'] as const;
export const RANK_PLURALS = ['Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings', 'Aces'] as const;
/** Ranks as shown on a card face. */
export const RANK_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export const DECK: readonly Card[] = Array.from({ length: 52 }, (_, card) => card);

export function rankOf(card: Card): number {
  return card >> 2;
}

export function suitOf(card: Card): number {
  return card & 3;
}

/** Parses a two-character code such as "As" or "Td". */
export function parseCard(code: string): Card {
  const rank = RANK_CHARS.indexOf(code[0]?.toUpperCase() ?? '');
  const suit = SUIT_CHARS.indexOf(code[1]?.toLowerCase() ?? '');
  if (code.length !== 2 || rank < 0 || suit < 0) throw new Error(`Invalid card code: ${code}`);
  return rank * 4 + suit;
}

export function parseCards(codes: string): Card[] {
  return codes.trim().split(/\s+/).filter(Boolean).map(parseCard);
}

export function cardCode(card: Card): string {
  return RANK_CHARS[card >> 2] + SUIT_CHARS[card & 3];
}

/** "Ace of spades" — for accessible labels. */
export function cardName(card: Card): string {
  return `${RANK_NAMES[card >> 2]} of ${SUIT_NAMES[card & 3]}`;
}
