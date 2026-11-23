import { type Card, parseCard, RANK_NAMES, RANK_PLURALS } from './engine/cards';
import { MAX_OPPONENTS, type Problem, type Scenario, validateScenario } from './engine/equity';

/**
 * The table being set up. Cards live in slots keyed "hero:0", "board:3", "opp:<id>:1"; an empty slot has no entry.
 * Opponents keep a stable id so their slots survive removing someone else. An opponent holding no cards has a random
 * hand; one with cards has a known hand (complete or not).
 */
export interface Table {
  cards: Map<string, Card>;
  opponents: { id: number }[];
  nextId: number;
}

export const BOARD_LABELS = ['Flop', 'Flop', 'Flop', 'Turn', 'River'] as const;

export const heroSlot = (index: number) => `hero:${index}`;
export const boardSlot = (index: number) => `board:${index}`;
export const opponentSlot = (id: number, index: number) => `opp:${id}:${index}`;

export function emptyTable(): Table {
  return { cards: new Map(), opponents: [{ id: 1 }], nextId: 2 };
}

/** The hand shown on a first visit (nothing saved yet), so the page is never empty: three players on the turn. */
export function exampleTable(): Table {
  const codes: [string, string][] = [
    [heroSlot(0), 'As'], [heroSlot(1), 'Ks'],
    [boardSlot(0), 'Js'], [boardSlot(1), '7s'], [boardSlot(2), '2d'], [boardSlot(3), '9h'],
    [opponentSlot(1, 0), 'Jh'], [opponentSlot(1, 1), 'Jd'],
    [opponentSlot(2, 0), 'Tc'], [opponentSlot(2, 1), '8c'],
  ];
  return { cards: new Map(codes.map(([slot, code]) => [slot, parseCard(code)])), opponents: [{ id: 1 }, { id: 2 }], nextId: 3 };
}

/** Whether an opponent's hand is known: they hold at least one card. */
export function hasKnownHand(table: Table, id: number): boolean {
  return table.cards.has(opponentSlot(id, 0)) || table.cards.has(opponentSlot(id, 1));
}

/** Every slot in fill order: your cards, the board, then the cards of each opponent whose hand is known. */
export function slotOrder(table: Table): string[] {
  return [
    heroSlot(0), heroSlot(1),
    ...BOARD_LABELS.map((_, index) => boardSlot(index)),
    ...table.opponents.filter((opponent) => hasKnownHand(table, opponent.id)).flatMap((opponent) => [opponentSlot(opponent.id, 0), opponentSlot(opponent.id, 1)]),
  ];
}

/** Whether `slot` belongs to this table: your cards, the board, or a card of an opponent still seated (known or not). */
export function slotExists(table: Table, slot: string): boolean {
  const [kind, a, b] = slot.split(':');
  if (kind === 'hero') return a === '0' || a === '1';
  if (kind === 'board') return /^[0-4]$/.test(a);
  return kind === 'opp' && (b === '0' || b === '1') && table.opponents.some((opponent) => String(opponent.id) === a);
}

/** Accessible name for a slot, e.g. "Your first card", "Turn", "Opponent 2, second card". */
export function slotLabel(table: Table, slot: string): string {
  const [kind, a, b] = slot.split(':');
  const ordinal = (index: string) => (index === '0' ? 'first' : 'second');
  if (kind === 'hero') return `Your ${ordinal(a)} card`;
  if (kind === 'board') return Number(a) < 3 ? `Flop card ${Number(a) + 1}` : BOARD_LABELS[Number(a)];
  const seat = table.opponents.findIndex((opponent) => opponent.id === Number(a)) + 1;
  return `Opponent ${seat}, ${ordinal(b)} card`;
}

/** Deck title for a slot: "Pick the river", "Pick flop card 2", "Pick your first card", "Pick opponent 1, second card". */
export function pickTitle(table: Table, slot: string): string {
  const [kind, index] = slot.split(':');
  if (kind === 'board' && Number(index) >= 3) return `Pick the ${BOARD_LABELS[Number(index)].toLowerCase()}`;
  const label = slotLabel(table, slot);
  return `Pick ${label[0].toLowerCase()}${label.slice(1)}`;
}

/** Where a card sits, for the deck's "unavailable" labels: "in your hand", "on the board", "with opponent 2". */
export function ownerLabel(table: Table, slot: string): string {
  if (slot.startsWith('hero:')) return 'in your hand';
  if (slot.startsWith('board:')) return 'on the board';
  const seat = table.opponents.findIndex((opponent) => slot.startsWith(`opp:${opponent.id}:`)) + 1;
  return `with opponent ${seat}`;
}

/** Puts `card` in `slot` (or empties it with `null`). Returns a new table. */
export function withCard(table: Table, slot: string, card: Card | null): Table {
  const cards = new Map(table.cards);
  if (card === null) cards.delete(slot);
  else cards.set(slot, card);
  return { ...table, cards };
}

/** The next empty slot after `slot` in fill order, or `slot` itself if everything after it is filled. */
export function nextEmptySlot(table: Table, slot: string): string {
  const order = slotOrder(table);
  return order.slice(order.indexOf(slot) + 1).find((candidate) => !table.cards.has(candidate)) ?? slot;
}

export function addOpponent(table: Table): Table {
  if (table.opponents.length >= MAX_OPPONENTS) return table;
  return { ...table, opponents: [...table.opponents, { id: table.nextId }], nextId: table.nextId + 1 };
}

export function removeOpponent(table: Table, id: number): Table {
  if (table.opponents.length <= 1) return table;
  const cards = new Map([...table.cards].filter(([slot]) => !slot.startsWith(`opp:${id}:`)));
  return { ...table, cards, opponents: table.opponents.filter((opponent) => opponent.id !== id) };
}

export interface TableState {
  scenario: Scenario;
  /** Problems that stop the calculation, in the order they should be fixed. */
  problems: Problem[];
  street: 'Preflop' | 'Flop' | 'Turn' | 'River' | 'Incomplete board';
}

/** Turns the table into an engine scenario and lists what's missing or invalid. */
export function readTable(table: Table): TableState {
  const pick = (slots: string[]) => slots.flatMap((slot) => (table.cards.has(slot) ? [table.cards.get(slot)!] : []));
  const boardSlots = BOARD_LABELS.map((_, index) => boardSlot(index));
  const board = pick(boardSlots);
  const scenario: Scenario = {
    hero: pick([heroSlot(0), heroSlot(1)]),
    board,
    opponents: table.opponents.map((opponent) => (hasKnownHand(table, opponent.id) ? pick([opponentSlot(opponent.id, 0), opponentSlot(opponent.id, 1)]) : null)),
  };
  const problems = validateScenario(scenario);
  // The board must be dealt in order: a turn or river card with an empty flop slot before it isn't a real board.
  const firstEmpty = boardSlots.findIndex((slot) => !table.cards.has(slot));
  const hasGap = firstEmpty >= 0 && boardSlots.slice(firstEmpty).some((slot) => table.cards.has(slot));
  if (hasGap && !problems.some((problem) => problem.code === 'board-incomplete')) {
    problems.push({ code: 'board-incomplete', message: 'Fill the board in order: the flop first, then the turn and river.' });
  }
  const streets = { 0: 'Preflop', 3: 'Flop', 4: 'Turn', 5: 'River' } as const;
  const street = hasGap ? 'Incomplete board' : streets[board.length as keyof typeof streets] ?? 'Incomplete board';
  return { scenario, problems, street };
}

/** "Pocket Aces", "Ace-King suited", "Seven-Two offsuit". */
export function startingHandName(first: Card, second: Card): string {
  const [high, low] = (first >> 2) >= (second >> 2) ? [first, second] : [second, first];
  if (high >> 2 === low >> 2) return `Pocket ${RANK_PLURALS[high >> 2]}`;
  return `${RANK_NAMES[high >> 2]}-${RANK_NAMES[low >> 2]} ${(high & 3) === (low & 3) ? 'suited' : 'offsuit'}`;
}

const STORAGE_KEY = 'v3.poker.table';

export function saveTable(table: Table) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards: [...table.cards], opponents: table.opponents, nextId: table.nextId }));
  } catch { /* Storage is optional. */ }
}

/**
 * The saved table, or the example hand when nothing valid is stored. Tables saved by earlier versions still load: their
 * opponents carried a `known` flag, which is ignored now that a hand is known exactly when it holds a card.
 */
export function loadTable(): Table {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return exampleTable();
    const { cards, opponents, nextId } = saved as { cards?: unknown; opponents?: unknown; nextId?: unknown };
    if (!Array.isArray(cards) || !Array.isArray(opponents) || typeof nextId !== 'number') return exampleTable();
    // Each id once (a repeated id would share its slots), and nextId past every id so new opponents get fresh slots.
    const ids = [...new Set(opponents.flatMap((opponent) => (Number.isInteger(opponent?.id) ? [opponent.id as number] : [])))].slice(0, MAX_OPPONENTS);
    if (ids.length === 0) return exampleTable();
    const table: Table = { cards: new Map(), opponents: ids.map((id) => ({ id })), nextId: Math.max(nextId, ...ids.map((id) => id + 1)) };
    const seen = new Set<Card>();
    for (const entry of cards) {
      if (!Array.isArray(entry)) continue;
      const [slot, card] = entry;
      if (typeof slot !== 'string' || !slotExists(table, slot) || !Number.isInteger(card) || card < 0 || card > 51 || seen.has(card)) continue;
      seen.add(card);
      table.cards.set(slot, card);
    }
    return table;
  } catch {
    return exampleTable();
  }
}
