import { type Card, DECK } from './cards';
import { CATEGORY_SHIFT, evaluate, HAND_CATEGORIES } from './evaluate';
import type { Random } from './random';

/** A Hold'em spot. Opponents are either a known two-card hand or `null` for a random (unknown) hand. */
export interface Scenario {
  hero: Card[];
  board: Card[];
  opponents: (Card[] | null)[];
}

/** Probabilities as fractions of 1. win + tie + lose = 1; equity counts a tied pot as a share (half of a two-way split). */
export interface Stats {
  win: number;
  tie: number;
  lose: number;
  equity: number;
}

export interface EquityResult {
  /** Exact: every possible deal was counted. Simulation: an estimate from random deals. */
  method: 'exact' | 'simulation';
  /** Deals counted (exact) or simulated (simulation). */
  samples: number;
  hero: Stats;
  opponents: Stats[];
  /** Chance you finish with each hand category by the river (indexed like HAND_CATEGORIES), as fractions of 1. */
  heroHands: number[];
  /** Simulation only: standard error of hero's equity (fraction of 1). */
  heroStandardError?: number;
}

/** Half-width of the 95% confidence interval for hero's equity (fraction of 1); 0 for exact results. */
export function marginOfError(result: EquityResult): number {
  return 1.96 * (result.heroStandardError ?? 0);
}

export type ProblemCode = 'hero-incomplete' | 'board-incomplete' | 'opponent-incomplete' | 'no-opponents' | 'too-many-opponents' | 'duplicate-card';
export interface Problem {
  code: ProblemCode;
  message: string;
}

export const MAX_OPPONENTS = 9;

/** Everything that stops a scenario from being calculated. Empty means it's ready. */
export function validateScenario(scenario: Scenario): Problem[] {
  const problems: Problem[] = [];
  if (scenario.hero.length !== 2) problems.push({ code: 'hero-incomplete', message: 'Choose your two hole cards.' });
  if (![0, 3, 4, 5].includes(scenario.board.length)) {
    problems.push({ code: 'board-incomplete', message: 'The board needs 3 cards for the flop (or none for preflop).' });
  }
  if (scenario.opponents.length === 0) problems.push({ code: 'no-opponents', message: 'Add at least one opponent.' });
  if (scenario.opponents.length > MAX_OPPONENTS) problems.push({ code: 'too-many-opponents', message: `At most ${MAX_OPPONENTS} opponents.` });
  scenario.opponents.forEach((hand, index) => {
    if (hand !== null && hand.length !== 2) {
      problems.push({ code: 'opponent-incomplete', message: `Opponent ${index + 1} needs two cards, or switch them to a random hand.` });
    }
  });
  const known = [...scenario.hero, ...scenario.board, ...scenario.opponents.flatMap((hand) => hand ?? [])];
  if (new Set(known).size !== known.length) problems.push({ code: 'duplicate-card', message: 'The same card is used twice.' });
  return problems;
}

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

/** Number of distinct deals an exact calculation has to visit: board completions × hands for each random opponent. */
export function countDeals(scenario: Scenario): number {
  const knownCount = scenario.hero.length + scenario.board.length + scenario.opponents.reduce((sum, hand) => sum + (hand?.length ?? 0), 0);
  let remaining = 52 - knownCount;
  const boardNeeded = 5 - scenario.board.length;
  let deals = combinations(remaining, boardNeeded);
  remaining -= boardNeeded;
  for (const hand of scenario.opponents) {
    if (hand !== null) continue;
    deals *= combinations(remaining, 2);
    remaining -= 2;
  }
  return deals;
}

/** Exact enumeration up to this many deals (well under a second in a worker); a simulation beyond it. */
export const EXACT_DEAL_LIMIT = 2_500_000;

/** Running win/tie/share counts for hero (index 0) and each opponent. */
class Tally {
  readonly wins: Float64Array;
  readonly ties: Float64Array;
  readonly shares: Float64Array;
  samples = 0;
  heroShareSquares = 0;
  readonly heroHands = new Float64Array(HAND_CATEGORIES.length);

  constructor(players: number) {
    this.wins = new Float64Array(players);
    this.ties = new Float64Array(players);
    this.shares = new Float64Array(players);
  }

  /** Records one showdown. */
  add(scores: Int32Array) {
    let best = -1;
    let winners = 0;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > best) { best = scores[i]; winners = 1; }
      else if (scores[i] === best) winners++;
    }
    const share = 1 / winners;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] !== best) continue;
      if (winners === 1) this.wins[i]++;
      else this.ties[i]++;
      this.shares[i] += share;
    }
    if (scores[0] === best) this.heroShareSquares += share * share;
    this.heroHands[scores[0] >> CATEGORY_SHIFT]++;
    this.samples++;
  }

  stats(player: number): Stats {
    const n = this.samples || 1;
    const win = this.wins[player] / n;
    const tie = this.ties[player] / n;
    return { win, tie, lose: Math.max(0, 1 - win - tie), equity: this.shares[player] / n };
  }

  result(method: EquityResult['method']): EquityResult {
    const opponents = Array.from({ length: this.wins.length - 1 }, (_, index) => this.stats(index + 1));
    const hero = this.stats(0);
    const result: EquityResult = { method, samples: this.samples, hero, opponents, heroHands: Array.from(this.heroHands, (count) => count / (this.samples || 1)) };
    if (method === 'simulation' && this.samples > 1) {
      const variance = Math.max(0, this.heroShareSquares / this.samples - hero.equity * hero.equity);
      result.heroStandardError = Math.sqrt(variance / this.samples);
    }
    return result;
  }
}

function remainingDeck(scenario: Scenario): Card[] {
  const used = new Set([...scenario.hero, ...scenario.board, ...scenario.opponents.flatMap((hand) => hand ?? [])]);
  return DECK.filter((card) => !used.has(card));
}

function assertReady(scenario: Scenario) {
  const problems = validateScenario(scenario);
  if (problems.length) throw new Error(problems.map((problem) => problem.message).join(' '));
}

/** Scores two hole cards with a shared five-card board buffer that the caller fills in as it deals the board. */
function boardScorer(scenario: Scenario) {
  const board = new Int32Array(5);
  board.set(scenario.board);
  const seven = new Int32Array(7);
  const score = (first: Card, second: Card) => {
    seven[0] = first;
    seven[1] = second;
    seven.set(board, 2);
    return evaluate(seven);
  };
  return { board, score };
}

/**
 * Exact equity: visits every board completion and every hand for each random opponent (dealt without replacement).
 */
export function exactEquity(scenario: Scenario): EquityResult {
  assertReady(scenario);
  const deck = remainingDeck(scenario);
  const players = 1 + scenario.opponents.length;
  const tally = new Tally(players);
  const scores = new Int32Array(players);
  const boardNeeded = 5 - scenario.board.length;
  const randomSeats = scenario.opponents.flatMap((hand, index) => (hand === null ? [index + 1] : []));
  const { board, score } = boardScorer(scenario);
  const used = new Uint8Array(52);

  const dealRandomSeats = (seat: number) => {
    if (seat === randomSeats.length) { tally.add(scores); return; }
    for (let i = 0; i < deck.length; i++) {
      if (used[deck[i]]) continue;
      // Within one seat, deal the pair in increasing order so each hand is visited once.
      for (let j = i + 1; j < deck.length; j++) {
        if (used[deck[j]]) continue;
        used[deck[i]] = used[deck[j]] = 1;
        scores[randomSeats[seat]] = score(deck[i], deck[j]);
        dealRandomSeats(seat + 1);
        used[deck[i]] = used[deck[j]] = 0;
      }
    }
  };

  const onFullBoard = () => {
    scores[0] = score(scenario.hero[0], scenario.hero[1]);
    scenario.opponents.forEach((hand, index) => { if (hand) scores[index + 1] = score(hand[0], hand[1]); });
    dealRandomSeats(0);
  };

  const completeBoard = (slot: number, start: number) => {
    if (slot === 5) { onFullBoard(); return; }
    for (let i = start; i < deck.length; i++) {
      board[slot] = deck[i];
      used[deck[i]] = 1;
      completeBoard(slot + 1, i + 1);
      used[deck[i]] = 0;
    }
  };

  completeBoard(5 - boardNeeded, 0);
  return tally.result('exact');
}

/**
 * Equity estimated from up to `trials` random deals. Pass a seeded `random` for reproducible results.
 * `onBatch` sees the running result every `batchSize` trials and can return `false` to stop early.
 */
export function simulateEquity(scenario: Scenario, trials: number, random: Random, onBatch?: (partial: EquityResult) => boolean | void, batchSize = 10_000): EquityResult {
  assertReady(scenario);
  const deck = remainingDeck(scenario);
  const players = 1 + scenario.opponents.length;
  const tally = new Tally(players);
  const scores = new Int32Array(players);
  const boardNeeded = 5 - scenario.board.length;
  const randomSeats = scenario.opponents.flatMap((hand, index) => (hand === null ? [index + 1] : []));
  const needed = boardNeeded + randomSeats.length * 2;
  const { board, score } = boardScorer(scenario);

  for (let trial = 1; trial <= trials; trial++) {
    // Partial Fisher–Yates: the first `needed` positions become a uniform random draw without replacement.
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(random() * (deck.length - i));
      const swap = deck[i];
      deck[i] = deck[j];
      deck[j] = swap;
    }
    for (let i = 0; i < boardNeeded; i++) board[5 - boardNeeded + i] = deck[i];
    scores[0] = score(scenario.hero[0], scenario.hero[1]);
    scenario.opponents.forEach((hand, index) => { if (hand) scores[index + 1] = score(hand[0], hand[1]); });
    randomSeats.forEach((seat, index) => {
      scores[seat] = score(deck[boardNeeded + index * 2], deck[boardNeeded + index * 2 + 1]);
    });
    tally.add(scores);
    if (onBatch && trial % batchSize === 0 && trial < trials && onBatch(tally.result('simulation')) === false) break;
  }
  return tally.result('simulation');
}
