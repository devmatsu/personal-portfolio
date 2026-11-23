import { type Card, DECK, rankOf, suitOf } from './cards';
import { CATEGORY_SHIFT, evaluate, HAND_CATEGORIES } from './evaluate';

export interface PlayerOuts {
  /** Holds the best hand (alone or tied) on the board as it stands. */
  leading: boolean;
  /** Unseen cards that, dealt as the next board card, make this player best or tied for best. Always empty for leaders. */
  outs: Card[];
  /** The hands the outs make: "flush", "full house or better". Empty without outs. */
  label: string;
}

/**
 * Outs on the flop or turn with every hand face up: for each player behind, the cards that put them in the lead (or tie
 * it) if dealt next. Only the next card counts; runner-runner draws are not outs.
 */
export function findOuts(hands: readonly (readonly Card[])[], board: readonly Card[]): PlayerOuts[] {
  if (board.length !== 3 && board.length !== 4) throw new Error('Outs need a flop or a turn: 3 or 4 board cards.');
  if (hands.length < 2 || hands.some((hand) => hand.length !== 2)) throw new Error('Outs need at least two players with two known cards each.');
  const used = new Set([...board, ...hands.flat()]);
  if (used.size !== board.length + hands.length * 2) throw new Error('The same card is used twice.');

  const scores = hands.map((hand) => evaluate([...hand, ...board]));
  const best = Math.max(...scores);
  // Every player's score with each unseen card added to the board, computed once for all players.
  const next = DECK.filter((card) => !used.has(card)).map((card) => ({ card, scores: hands.map((hand) => evaluate([...hand, ...board, card])) }));

  return hands.map((_, player) => {
    if (scores[player] === best) return { leading: true, outs: [], label: '' };
    const outs: Card[] = [];
    const categories = new Set<number>();
    for (const { card, scores: after } of next) {
      if (after[player] < Math.max(...after)) continue;
      outs.push(card);
      categories.add(after[player] >> CATEGORY_SHIFT);
    }
    outs.sort((a, b) => rankOf(b) - rankOf(a) || suitOf(a) - suitOf(b));
    return { leading: false, outs, label: outsLabel(categories) };
  });
}

/** The weakest hand the outs make, lowercase, with "or better" when some outs make more. */
function outsLabel(categories: Set<number>): string {
  if (categories.size === 0) return '';
  const name = HAND_CATEGORIES[Math.min(...categories)].toLowerCase();
  return categories.size > 1 ? `${name} or better` : name;
}
