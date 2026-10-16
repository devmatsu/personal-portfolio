import { type Card, RANK_NAMES, RANK_PLURALS } from './cards';

export const HAND_CATEGORIES = [
  'High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush',
] as const;
export type HandCategory = (typeof HAND_CATEGORIES)[number];

const HIGH_CARD = 0, PAIR = 1, TWO_PAIR = 2, TRIPS = 3, STRAIGHT = 4, FLUSH = 5, FULL_HOUSE = 6, QUADS = 7, STRAIGHT_FLUSH = 8;

// A score is one integer: the category in the top bits, then up to five tie-break ranks (4 bits each, most significant first).
// Comparing two scores numerically compares the hands, kickers included; equal scores split the pot.
export const CATEGORY_SHIFT = 20;

function score(category: number, r0 = 0, r1 = 0, r2 = 0, r3 = 0, r4 = 0): number {
  return (category << CATEGORY_SHIFT) | (r0 << 16) | (r1 << 12) | (r2 << 8) | (r3 << 4) | r4;
}

const WHEEL = (1 << 12) | 0b1111; // A-2-3-4-5

/** Highest rank of a straight contained in a rank bitmask, or -1. The wheel counts as five-high (rank 3). */
function straightHigh(mask: number): number {
  for (let high = 12; high >= 4; high--) {
    const run = 0b11111 << (high - 4);
    if ((mask & run) === run) return high;
  }
  return (mask & WHEEL) === WHEEL ? 3 : -1;
}

/** The highest `count` ranks set in `mask`, highest first. */
function topRanks(mask: number, count: number): number[] {
  const ranks: number[] = [];
  for (let rank = 12; rank >= 0 && ranks.length < count; rank--) if (mask & (1 << rank)) ranks.push(rank);
  return ranks;
}

// Scratch buffers reused across calls: evaluate() runs millions of times per equity calculation.
const rankCounts = new Uint8Array(13);
const suitMasks = new Uint16Array(4);
const suitCounts = new Uint8Array(4);

/**
 * Scores the best five-card poker hand from 5–7 cards (fewer cards score as an incomplete hand, used for display).
 * Higher scores win; equal scores tie.
 */
export function evaluate(cards: ArrayLike<Card>, length = cards.length): number {
  rankCounts.fill(0);
  suitMasks.fill(0);
  suitCounts.fill(0);
  let rankMask = 0;
  for (let i = 0; i < length; i++) {
    const rank = cards[i] >> 2;
    const suit = cards[i] & 3;
    rankCounts[rank]++;
    suitMasks[suit] |= 1 << rank;
    suitCounts[suit]++;
    rankMask |= 1 << rank;
  }

  // With at most seven cards a flush can't coexist with quads or a full house, so it can be resolved first.
  for (let suit = 0; suit < 4; suit++) {
    if (suitCounts[suit] < 5) continue;
    const high = straightHigh(suitMasks[suit]);
    if (high >= 0) return score(STRAIGHT_FLUSH, high);
    const [r0, r1, r2, r3, r4] = topRanks(suitMasks[suit], 5);
    return score(FLUSH, r0, r1, r2, r3, r4);
  }

  let quads = -1;
  let trips = -1;
  let secondTrips = -1;
  let pair = -1;
  let secondPair = -1;
  for (let rank = 12; rank >= 0; rank--) {
    const count = rankCounts[rank];
    if (count === 4) quads = rank;
    else if (count === 3) {
      if (trips < 0) trips = rank;
      else if (secondTrips < 0) secondTrips = rank;
    } else if (count === 2) {
      if (pair < 0) pair = rank;
      else if (secondPair < 0) secondPair = rank;
    }
  }

  if (quads >= 0) return score(QUADS, quads, topRanks(rankMask & ~(1 << quads), 1)[0] ?? 0);
  if (trips >= 0 && (secondTrips >= 0 || pair >= 0)) return score(FULL_HOUSE, trips, Math.max(secondTrips, pair));
  const straight = straightHigh(rankMask);
  if (straight >= 0) return score(STRAIGHT, straight);
  if (trips >= 0) {
    const [k0, k1] = topRanks(rankMask & ~(1 << trips), 2);
    return score(TRIPS, trips, k0, k1);
  }
  if (pair >= 0 && secondPair >= 0) {
    // With three pairs, the third pair's rank can be the kicker.
    return score(TWO_PAIR, pair, secondPair, topRanks(rankMask & ~(1 << pair) & ~(1 << secondPair), 1)[0] ?? 0);
  }
  if (pair >= 0) {
    const [k0, k1, k2] = topRanks(rankMask & ~(1 << pair), 3);
    return score(PAIR, pair, k0, k1, k2);
  }
  const [r0, r1, r2, r3, r4] = topRanks(rankMask, 5);
  return score(HIGH_CARD, r0, r1, r2, r3, r4);
}

export function categoryOf(handScore: number): HandCategory {
  return HAND_CATEGORIES[handScore >> CATEGORY_SHIFT];
}

/** Human-readable description of a scored hand, e.g. "Full house, Kings full of Fours". */
export function describeHand(handScore: number): string {
  const category = handScore >> CATEGORY_SHIFT;
  const rank = (slot: number) => (handScore >> (16 - slot * 4)) & 0xf;
  switch (category) {
    case STRAIGHT_FLUSH: return rank(0) === 12 ? 'Royal flush' : `Straight flush, ${RANK_NAMES[rank(0)]} high`;
    case QUADS: return `Four of a kind, ${RANK_PLURALS[rank(0)]}`;
    case FULL_HOUSE: return `Full house, ${RANK_PLURALS[rank(0)]} full of ${RANK_PLURALS[rank(1)]}`;
    case FLUSH: return `Flush, ${RANK_NAMES[rank(0)]} high`;
    case STRAIGHT: return `Straight, ${RANK_NAMES[rank(0)]} high`;
    case TRIPS: return `Three of a kind, ${RANK_PLURALS[rank(0)]}`;
    case TWO_PAIR: return `Two pair, ${RANK_PLURALS[rank(0)]} and ${RANK_PLURALS[rank(1)]}`;
    case PAIR: return `Pair of ${RANK_PLURALS[rank(0)]}`;
    default: return `${RANK_NAMES[rank(0)]} high`;
  }
}

/** The best five cards out of 5–7, ordered for display (grouped ranks first, a wheel's ace last), with their score. */
export function bestFive(cards: readonly Card[]): { score: number; cards: Card[] } {
  if (cards.length < 5) throw new Error('bestFive needs at least five cards');
  let best = { score: -1, cards: [] as Card[] };
  const pick = new Array<Card>(5);
  const choose = (start: number, depth: number) => {
    if (depth === 5) {
      const handScore = evaluate(pick);
      if (handScore > best.score) best = { score: handScore, cards: pick.slice() };
      return;
    }
    for (let i = start; i <= cards.length - (5 - depth); i++) {
      pick[depth] = cards[i];
      choose(i + 1, depth + 1);
    }
  };
  choose(0, 0);

  const category = best.score >> CATEGORY_SHIFT;
  const isWheel = (category === STRAIGHT || category === STRAIGHT_FLUSH) && ((best.score >> 16) & 0xf) === 3;
  const counts = new Map<number, number>();
  for (const card of best.cards) counts.set(card >> 2, (counts.get(card >> 2) ?? 0) + 1);
  const displayRank = (card: Card) => (isWheel && card >> 2 === 12 ? -1 : card >> 2);
  best.cards.sort((a, b) => (counts.get(b >> 2)! - counts.get(a >> 2)!) || displayRank(b) - displayRank(a) || (a & 3) - (b & 3));
  return best;
}
