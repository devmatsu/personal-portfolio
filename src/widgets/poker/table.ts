import { type Card, DECK, RANK_NAMES, RANK_PLURALS } from './engine/cards';
import { MAX_OPPONENTS, type Problem, type Scenario, validateScenario } from './engine/equity';

/**
 * The table being set up. Cards live in slots keyed "hero:0", "board:3", "opp:<id>:1"; an empty slot has no entry.
 * Opponents keep a stable id so their slots survive removing someone else.
 */
export interface Table {
  cards: Map<string, Card>;
  opponents: { id: number; known: boolean }[];
  nextId: number;
}

export const BOARD_LABELS = ['Flop', 'Flop', 'Flop', 'Turn', 'River'] as const;

export const heroSlot = (index: number) => `hero:${index}`;
export const boardSlot = (index: number) => `board:${index}`;
export const opponentSlot = (id: number, index: number) => `opp:${id}:${index}`;

export function emptyTable(): Table {
  return { cards: new Map(), opponents: [{ id: 1, known: false }], nextId: 2 };
}

/** Every slot in fill order: your cards, the board, then each known opponent's cards. */
export function slotOrder(table: Table): string[] {
  return [
    heroSlot(0), heroSlot(1),
    ...BOARD_LABELS.map((_, index) => boardSlot(index)),
    ...table.opponents.filter((opponent) => opponent.known).flatMap((opponent) => [opponentSlot(opponent.id, 0), opponentSlot(opponent.id, 1)]),
  ];
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
  return { ...table, opponents: [...table.opponents, { id: table.nextId, known: false }], nextId: table.nextId + 1 };
}

export function removeOpponent(table: Table, id: number): Table {
  if (table.opponents.length <= 1) return table;
  const cards = new Map([...table.cards].filter(([slot]) => !slot.startsWith(`opp:${id}:`)));
  return { ...table, cards, opponents: table.opponents.filter((opponent) => opponent.id !== id) };
}

/** Switches an opponent between a known hand and a random one (which frees their cards). */
export function setOpponentKnown(table: Table, id: number, known: boolean): Table {
  const cards = known ? table.cards : new Map([...table.cards].filter(([slot]) => !slot.startsWith(`opp:${id}:`)));
  return { ...table, cards, opponents: table.opponents.map((opponent) => (opponent.id === id ? { ...opponent, known } : opponent)) };
}

/** Deals fresh random cards into every slot that currently holds one, plus your two hole cards. */
export function randomize(table: Table, random: () => number = Math.random): Table {
  const slots = [heroSlot(0), heroSlot(1), ...[...table.cards.keys()].filter((slot) => !slot.startsWith('hero:'))];
  const deck = [...DECK];
  const cards = new Map<string, Card>();
  slots.forEach((slot, index) => {
    const pick = index + Math.floor(random() * (deck.length - index));
    [deck[index], deck[pick]] = [deck[pick], deck[index]];
    cards.set(slot, deck[index]);
  });
  return { ...table, cards };
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
    opponents: table.opponents.map((opponent) => (opponent.known ? pick([opponentSlot(opponent.id, 0), opponentSlot(opponent.id, 1)]) : null)),
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

/** The saved table, or an empty one when nothing valid is stored. */
export function loadTable(): Table {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return emptyTable();
    const { cards, opponents, nextId } = saved as { cards?: unknown; opponents?: unknown; nextId?: unknown };
    if (!Array.isArray(cards) || !Array.isArray(opponents) || typeof nextId !== 'number') return emptyTable();
    const validOpponents = opponents.filter((opponent): opponent is Table['opponents'][number] =>
      typeof opponent?.id === 'number' && typeof opponent?.known === 'boolean').slice(0, MAX_OPPONENTS);
    if (validOpponents.length === 0) return emptyTable();
    const table: Table = { cards: new Map(), opponents: validOpponents, nextId };
    const slots = new Set(slotOrder(table));
    const seen = new Set<Card>();
    for (const entry of cards) {
      if (!Array.isArray(entry)) continue;
      const [slot, card] = entry;
      if (typeof slot !== 'string' || !slots.has(slot) || !Number.isInteger(card) || card < 0 || card > 51 || seen.has(card)) continue;
      seen.add(card);
      table.cards.set(slot, card);
    }
    return table;
  } catch {
    return emptyTable();
  }
}
