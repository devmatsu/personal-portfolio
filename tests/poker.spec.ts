// The poker widget in a real browser: the example hand, street rewind, outs and showdowns, picking cards from the deck
// popover (a bottom sheet on phones), opponents' face-down hands, keyboard use and persistence. The engine's maths, outs
// included, is covered separately in poker-engine.spec.ts.
import { expect, test, type Page } from '@playwright/test';

const deck = (page: Page) => page.getByRole('dialog');
const pick = async (page: Page, ...cards: string[]) => {
  for (const card of cards) await deck(page).getByRole('button', { name: card, exact: true }).click();
};
const strips = (page: Page) => page.getByRole('list', { name: 'Players' }).getByRole('listitem');
const strip = (page: Page, name: string) => strips(page).filter({ has: page.getByText(name, { exact: true }) });
const outs = (page: Page, name: string) => strip(page, name).getByRole('img');
const status = (page: Page) => page.getByRole('region', { name: "Texas Hold'em table" }).getByRole('status');
/** Equity cells that show a number: each carries the precise value as its tooltip. */
const equityCells = (page: Page, name: string) => strip(page, name).getByTitle(/%$/);
const street = (page: Page, name: 'Preflop' | 'Flop' | 'Turn' | 'River') => page.getByRole('button', { name, exact: true });
/** Saves a table the way the widget does (cards are rank * 4 + suit: spades, hearts, diamonds, clubs) and reloads. */
const loadSaved = async (page: Page, saved: string) => {
  await page.evaluate((value) => localStorage.setItem('v3.poker.table', value), saved);
  await page.reload();
};
/** A box in page coordinates, so scrolling doesn't count as moving. */
const pageBox = (page: Page, name: string) => strip(page, name).evaluate((element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y: y + scrollY, width, height };
});

const HERO_TURN_OUTS = '7 outs, flush: Queen of spades, Ten of spades, Eight of spades, Six of spades, Five of spades, Four of spades, Three of spades';
const OPPONENT_1_TURN_OUTS = '10 outs, full house or better: Jack of clubs, Nine of spades, Nine of diamonds, Nine of clubs, Seven of hearts, '
  + 'Seven of diamonds, Seven of clubs, Two of spades, Two of hearts, Two of clubs';

test.beforeEach(async ({ page }) => {
  await page.goto('/widgets/poker');
  await expect(strips(page)).toHaveCount(3);
});

test('a first visit shows an example hand on the turn: every equity and the exact outs', async ({ page }) => {
  // Whole percentages like a broadcast; the precise, exactly counted value is each cell's tooltip.
  await expect(strip(page, 'You').getByTitle('16.67%')).toContainText('17%');
  await expect(strip(page, 'Opponent 1').getByTitle('23.81%')).toContainText('24%');
  await expect(strip(page, 'Opponent 2').getByTitle('59.52%')).toContainText('60%');
  // Preflop and flop fill in after the turn; the river hasn't been dealt.
  for (const name of ['You', 'Opponent 1', 'Opponent 2']) await expect(equityCells(page, name)).toHaveCount(3);
  await expect(street(page, 'Turn')).toHaveAttribute('aria-pressed', 'true');
  await expect(street(page, 'River')).toBeDisabled();

  await expect(strip(page, 'Opponent 2')).toContainText('Straight, Jack high');
  await expect(strip(page, 'Opponent 2')).toContainText('Ahead');
  await expect(outs(page, 'Opponent 2')).toHaveCount(0);
  await expect(outs(page, 'You')).toHaveAccessibleName(HERO_TURN_OUTS);
  await expect(outs(page, 'Opponent 1')).toHaveAccessibleName(OPPONENT_1_TURN_OUTS);
});

test('rewinding to the flop shows who led there and the outs for the turn card', async ({ page }) => {
  await street(page, 'Flop').click();
  await expect(street(page, 'Flop')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Flop replay')).toBeVisible();
  await expect(street(page, 'River')).toBeDisabled();

  await expect(strip(page, 'Opponent 1')).toContainText('Ahead');
  await expect(strip(page, 'Opponent 2')).toContainText('Jack high');
  await expect(outs(page, 'You')).toHaveAccessibleName(
    '8 outs, flush: Queen of spades, Ten of spades, Nine of spades, Eight of spades, Six of spades, Five of spades, Four of spades, Three of spades',
  );
  await expect(outs(page, 'Opponent 2')).toHaveAccessibleName('3 outs, straight: Nine of hearts, Nine of diamonds, Nine of clubs');

  // Back on the turn, the table is as dealt again.
  await street(page, 'Turn').click();
  await expect(strip(page, 'Opponent 2')).toContainText('Ahead');
});

test('editing a card while rewound shows the table as dealt again', async ({ page }) => {
  await street(page, 'Flop').click();
  await expect(page.getByText('Flop replay')).toBeVisible();
  await page.getByRole('button', { name: 'River: empty' }).click();
  await pick(page, 'Queen of hearts');
  await expect(street(page, 'River')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Flop replay')).toHaveCount(0);
});

test('on the river the best hand is the Winner', async ({ page }) => {
  await page.getByRole('button', { name: 'River: empty' }).click();
  await pick(page, 'Queen of spades');
  await expect(strip(page, 'You')).toContainText('Flush, Ace high');
  await expect(strip(page, 'You')).toContainText('Winner');
  await expect(strip(page, 'You').getByTitle('100.00%')).toContainText('100%');
  for (const name of ['Opponent 1', 'Opponent 2']) await expect(strip(page, name)).not.toContainText(/Winner|Split pot/);
});

test('a tied river is a Split pot for everyone sharing the best hand', async ({ page }) => {
  // You A♠ K♦ and opponent 1 A♥ K♣ on 2♣ 7♦ 9♥ J♠ 3♠: the same Ace-high hand.
  await loadSaved(page, JSON.stringify({
    cards: [['hero:0', 48], ['hero:1', 46], ['opp:1:0', 49], ['opp:1:1', 47], ['board:0', 3], ['board:1', 22], ['board:2', 29], ['board:3', 36], ['board:4', 4]],
    opponents: [{ id: 1 }],
    nextId: 2,
  }));
  for (const name of ['You', 'Opponent 1']) {
    await expect(strip(page, name)).toContainText('Split pot');
    // Identical hands split every street; the river is the last of them.
    await expect(equityCells(page, name)).toHaveCount(4);
    await expect(equityCells(page, name).last()).toHaveAttribute('title', '50.00%');
  }
});

test('Reset empties the table and opens the deck on your first card', async ({ page }) => {
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(deck(page)).toHaveAccessibleName('Pick your first card');
  await expect(deck(page).getByRole('button', { name: 'Ace of spades', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Your first card: empty' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Flop card 1: empty' })).toBeVisible();
  await expect(strips(page)).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Opponent 1, first card: random, pick a card' })).toBeVisible();
  await expect(status(page)).toHaveText('Choose your two hole cards.');
  await expect(equityCells(page, 'You')).toHaveCount(0);
  for (const name of ['Preflop', 'Flop', 'Turn', 'River'] as const) await expect(street(page, name)).toBeDisabled();

  // Picking fills the slot and moves on to the next one.
  await pick(page, 'Ace of hearts');
  await expect(deck(page)).toHaveAccessibleName('Pick your second card');
  await expect(page.getByRole('button', { name: 'Your first card: Ace of hearts' })).toBeVisible();
});

test('clicking an opponent\'s face-down card gives them a hand; removing both cards makes it random again', async ({ page }) => {
  await page.getByRole('button', { name: 'Reset' }).click();
  await pick(page, 'Ace of spades', 'King of spades', 'Jack of spades', 'Seven of spades', 'Two of diamonds');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Outs need every hand face up. Click a face-down card to set it.')).toBeVisible();
  await expect(outs(page, 'You')).toHaveCount(0);

  await page.getByRole('button', { name: 'Opponent 1, first card: random, pick a card' }).click();
  await expect(deck(page)).toHaveAccessibleName('Pick opponent 1, first card');
  await pick(page, 'Jack of hearts');
  // One card set: the hand is incomplete until the second one, which the deck moves on to.
  await expect(status(page)).toHaveText('Opponent 1 needs a second card, or remove the first for a random hand.');
  await expect(deck(page)).toHaveAccessibleName('Pick opponent 1, second card');
  await pick(page, 'Jack of diamonds');
  await page.keyboard.press('Escape');

  await expect(strip(page, 'Opponent 1')).toContainText('Three of a kind, Jacks');
  await expect(strip(page, 'Opponent 1')).toContainText('Ahead');
  await expect(outs(page, 'You')).toHaveAccessibleName(/^8 outs, flush: /);
  await expect(page.getByText(/Outs need every hand face up/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Opponent 1, first card: Jack of hearts' }).press('Delete');
  await page.getByRole('button', { name: 'Opponent 1, second card: Jack of diamonds' }).press('Delete');
  await expect(page.getByRole('button', { name: 'Opponent 1, first card: random, pick a card' })).toBeVisible();
  await expect(strip(page, 'Opponent 1')).toContainText('Random hand');
  await expect(status(page)).not.toContainText('Opponent 1');
  await expect(page.getByText('Outs need every hand face up. Click a face-down card to set it.')).toBeVisible();

  // Opening a face-down card and closing the deck without picking leaves the hand random.
  await page.getByRole('button', { name: 'Opponent 1, first card: random, pick a card' }).click();
  await page.keyboard.press('Escape');
  await expect(deck(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Opponent 1, first card: random, pick a card' })).toBeFocused();
});

test('removing an opponent never shows their old numbers under another seat', async ({ page }) => {
  await expect(strip(page, 'Opponent 2').getByTitle('59.52%')).toBeVisible();
  await page.getByRole('button', { name: 'Remove opponent 1' }).click();
  // Straight after the change, before any new result: no number from the old three-way table is left anywhere.
  for (const value of ['16.67%', '23.81%', '59.52%']) expect(await page.getByTitle(value).count(), value).toBe(0);
  await expect(strips(page)).toHaveCount(2);
  await expect(strip(page, 'Opponent 1')).toContainText('Straight, Jack high');
  await expect(page.getByRole('button', { name: '+ Add opponent' })).toBeFocused();
  // The new heads-up numbers arrive for every dealt street.
  for (const name of ['You', 'Opponent 1']) await expect(equityCells(page, name)).toHaveCount(3);
});

test('the same card cannot be used twice', async ({ page }) => {
  await page.getByRole('button', { name: 'River: empty' }).click();
  const taken = deck(page).getByRole('button', { name: 'Ace of spades, in your hand' });
  await expect(taken).toHaveAttribute('aria-disabled', 'true');
  await expect(deck(page).getByRole('button', { name: 'Jack of hearts, with opponent 1' })).toHaveAttribute('aria-disabled', 'true');
  // aria-disabled (not disabled) keeps the card in keyboard order; a click still lands on it, and must do nothing.
  await taken.click({ force: true });
  await expect(page.getByRole('button', { name: 'River: empty' })).toBeVisible();
});

test('the deck works from the keyboard: Enter opens it, arrows move, Enter picks, Escape closes', async ({ page }) => {
  await page.getByRole('button', { name: 'Turn: Nine of hearts' }).focus();
  await page.keyboard.press('Tab');
  const river = page.getByRole('button', { name: 'River: empty' });
  await expect(river).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(deck(page)).toHaveAccessibleName('Pick the river');
  // Focus starts on the first card that can be picked (A♠ and K♠ are in your hand).
  await expect(deck(page).getByRole('button', { name: 'Queen of spades', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(deck(page).getByRole('button', { name: 'Ten of spades', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  // The last empty slot is filled, so the deck closes and focus returns to the card just picked.
  await expect(deck(page)).toHaveCount(0);
  const filled = page.getByRole('button', { name: 'River: Ten of spades' });
  await expect(filled).toBeFocused();

  // Reopened on a filled slot, focus starts on the card in it.
  await page.keyboard.press('Enter');
  await expect(deck(page).getByRole('button', { name: 'Ten of spades', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(deck(page)).toHaveCount(0);
  await expect(filled).toBeFocused();

  await page.keyboard.press('Delete');
  await expect(page.getByRole('button', { name: 'River: empty' })).toBeVisible();
});

test('the deck\'s keyboard stop follows the selected slot: its card, or the first one free', async ({ page }) => {
  await page.getByRole('button', { name: 'River: empty' }).click();
  await expect(deck(page).getByRole('button', { name: 'Queen of spades', exact: true })).toBeFocused();

  // Moving the open deck to a filled slot starts on that slot's card.
  await page.getByRole('button', { name: 'Turn: Nine of hearts' }).click();
  await expect(deck(page)).toHaveAccessibleName('Pick the turn');
  await expect(deck(page).getByRole('button', { name: 'Nine of hearts', exact: true })).toBeFocused();

  // After a pick the deck moves on to the next empty slot and starts on a card that can still be picked.
  await page.getByRole('button', { name: 'Reset' }).click();
  await pick(page, 'Ace of spades');
  await expect(deck(page)).toHaveAccessibleName('Pick your second card');
  const focused = deck(page).locator(':focus');
  await expect(focused).toHaveAccessibleName('King of spades');
  await expect(focused).not.toHaveAttribute('aria-disabled', 'true');
});

test('the deck closes with its × and with a second click on the selected slot', async ({ page }) => {
  const river = page.getByRole('button', { name: 'River: empty' });
  await river.click();
  await expect(river).toHaveAttribute('aria-expanded', 'true');
  await deck(page).getByRole('button', { name: 'Close the deck' }).click();
  await expect(deck(page)).toHaveCount(0);
  await expect(river).toBeFocused();

  await river.click();
  await expect(deck(page)).toBeVisible();
  await river.click();
  await expect(deck(page)).toHaveCount(0);
  await expect(river).toHaveAttribute('aria-expanded', 'false');
});

test('the table is kept when the page reloads', async ({ page }) => {
  await page.getByRole('button', { name: 'River: empty' }).click();
  await pick(page, 'Queen of hearts');
  await page.reload();
  await expect(page.getByRole('button', { name: 'River: Queen of hearts' })).toBeVisible();
});

test('a table saved by the earlier version still loads; an opponent marked known without cards is random', async ({ page }) => {
  // The earlier widget stored a `known` flag per opponent.
  await loadSaved(page, JSON.stringify({
    cards: [['hero:0', 48], ['hero:1', 44], ['opp:1:0', 41], ['opp:1:1', 42]],
    opponents: [{ id: 1, known: true }, { id: 2, known: true }],
    nextId: 3,
  }));
  await expect(page.getByRole('button', { name: 'Your first card: Ace of spades' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opponent 1, second card: Queen of diamonds' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opponent 2, first card: random, pick a card' })).toBeVisible();
  await expect(equityCells(page, 'You')).toHaveCount(1);
});

test('a saved opponent holding one card loads as an incomplete hand', async ({ page }) => {
  await loadSaved(page, JSON.stringify({ cards: [['hero:0', 48], ['hero:1', 44], ['opp:1:0', 41]], opponents: [{ id: 1 }], nextId: 2 }));
  await expect(page.getByRole('button', { name: 'Opponent 1, first card: Queen of hearts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opponent 1, second card: empty' })).toBeVisible();
  await expect(status(page)).toHaveText('Opponent 1 needs a second card, or remove the first for a random hand.');
});

test('unreadable saved data falls back to the example hand', async ({ page }) => {
  await loadSaved(page, '{not json');
  await expect(strips(page)).toHaveCount(3);
  await expect(outs(page, 'You')).toHaveAccessibleName(HERO_TURN_OUTS);
});

test('up to nine opponents, each with their own equity', async ({ page }) => {
  const add = page.getByRole('button', { name: '+ Add opponent' });
  for (let opponent = 3; opponent <= 9; opponent++) await add.click();
  await expect(add).toBeDisabled();
  await expect(strips(page)).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Opponent 9, first card: random, pick a card' })).toBeVisible();
  // Random hands make the count too large to enumerate: simulated, with the estimate marked in the tooltip.
  await expect(strip(page, 'Opponent 9').getByTitle(/^≈/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Remove opponent 9' }).click();
  await expect(strips(page)).toHaveCount(9);
  await expect(add).toBeEnabled();
});

test('the deck opens as a popover by the slot without moving anything, and flips above it near the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const before = await pageBox(page, 'Opponent 1');
  await page.getByRole('button', { name: 'River: empty' }).click();
  await expect(deck(page)).toBeVisible();
  expect(await pageBox(page, 'Opponent 1')).toEqual(before);

  // Below the slot, starting at its left edge.
  const slot = (await page.getByRole('button', { name: 'River: empty' }).boundingBox())!;
  const popover = (await deck(page).boundingBox())!;
  expect(popover.y).toBeGreaterThan(slot.y + slot.height);
  expect(Math.abs(popover.x - slot.x)).toBeLessThanOrEqual(1);
  expect(popover.width).toBeLessThanOrEqual(360);

  // Without room below the slot, it opens above it instead.
  await page.setViewportSize({ width: 1280, height: 700 });
  const low = page.getByRole('button', { name: 'Opponent 2, first card: Ten of clubs' });
  // Instant: the page scrolls smoothly by default, and the flip is decided where the slot is when the deck opens.
  await low.evaluate((element) => element.scrollIntoView({ block: 'end', behavior: 'instant' }));
  await low.click();
  await expect(deck(page)).toHaveAccessibleName('Pick opponent 2, first card');
  const lowBox = (await low.boundingBox())!;
  const above = (await deck(page).boundingBox())!;
  expect(above.y + above.height).toBeLessThan(lowBox.y);

  // A click elsewhere closes it; a click on another slot moves it there.
  await page.getByRole('button', { name: 'River: empty' }).click();
  await expect(deck(page)).toHaveAccessibleName('Pick the river');
  await page.locator('main h1').click();
  await expect(deck(page)).toHaveCount(0);
});

test.describe('on a phone', () => {
  // An iPhone-sized touch screen.
  test.use({ viewport: { width: 402, height: 874 }, hasTouch: true, isMobile: true });

  test('the deck is a bottom sheet with the selected slot visible above it; tapping outside closes it', async ({ page }) => {
    const slot = page.getByRole('button', { name: 'Opponent 2, second card: Eight of clubs' });
    await slot.tap();
    await expect(deck(page)).toHaveAccessibleName('Pick opponent 2, second card');
    // Attached to the bottom of the screen, full width (once its slide-in has finished).
    await expect.poll(async () => { const box = (await deck(page).boundingBox())!; return Math.round(box.y + box.height); }).toBe(874);
    const sheet = (await deck(page).boundingBox())!;
    expect(sheet.x).toBe(0);
    expect(sheet.width).toBe(402);
    await expect.poll(async () => { const box = (await slot.boundingBox())!; return box.y + box.height <= sheet.y; }).toBe(true);
    // Every card still fits, with nothing clipped and no sideways scrolling.
    expect(await deck(page).getByRole('group').getByRole('button').evaluateAll((buttons) => buttons.filter((button) => button.scrollWidth > button.clientWidth).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(402);

    await page.locator('[data-scrim]').tap({ position: { x: 20, y: 200 } });
    await expect(deck(page)).toHaveCount(0);
  });

  test('card slots are big enough to tap', async ({ page }) => {
    const slots = page.getByRole('button', { name: /^(Your (first|second) card|Flop card \d|Turn|River|Opponent \d, (first|second) card): / });
    await expect(slots).toHaveCount(11);
    for (const slot of await slots.all()) {
      const box = (await slot.boundingBox())!;
      expect(box.width, await slot.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
      expect(box.height, await slot.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
    }
  });

  test('cards have no × of their own; the sheet\'s "Remove card" empties the selected slot', async ({ page }) => {
    // The hover × exists for mouse users but is not shown (nor exposed) on a touch screen.
    await expect(page.getByRole('button', { name: /^Remove .+ \(.+\)$/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Turn: Nine of hearts' }).tap();
    await expect(deck(page)).toHaveAccessibleName('Pick the turn');
    const remove = deck(page).getByRole('button', { name: 'Remove card' });
    expect((await remove.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await remove.tap();
    await expect(page.getByRole('button', { name: 'Turn: empty' })).toBeVisible();
    // The deck stays open on the emptied slot; with nothing in it, there's nothing to remove.
    await expect(deck(page)).toHaveAccessibleName('Pick the turn');
    await expect(remove).toHaveCount(0);
  });

  test('compact strips: ten outs on one line and each percentage centred under its street label', async ({ page }) => {
    // Geometry checks: these measure the rendered layout, so they reach into its structure.
    const outCards = outs(page, 'Opponent 1').locator('> span');
    await expect(outCards).toHaveCount(10);
    const tops = await outCards.evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);

    // Wait for every dealt street (preflop arrives last), then compare each value's centre with its label's.
    for (const name of ['You', 'Opponent 1', 'Opponent 2']) await expect(equityCells(page, name)).toHaveCount(3);
    const labels = await page.getByRole('group', { name: 'Show the table at a street' }).getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => { const box = button.getBoundingClientRect(); return box.left + box.width / 2; }));
    const values = await page.getByRole('list', { name: 'Players' }).getByTitle(/%$/).evaluateAll((cells) => cells.map((cell) => {
      // The visible number, not the cell (which also holds the arrow) or its screen-reader text.
      const number = [...cell.querySelectorAll('span')].find((span) => !span.classList.contains('sr-only') && /%$/.test(span.textContent ?? ''))!;
      const box = number.getBoundingClientRect();
      return { column: [...cell.parentElement!.children].indexOf(cell), centre: box.left + box.width / 2 };
    }));
    expect(values).toHaveLength(9);
    for (const { column, centre } of values) expect(Math.abs(centre - labels[column])).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(402);
  });
});
