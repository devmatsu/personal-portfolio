// The poker widget in a real browser: picking cards, duplicates, incomplete scenarios, keyboard use, exact vs simulated
// results and persistence. The engine's maths is covered separately in poker-engine.spec.ts.
import { expect, test, type Page } from '@playwright/test';

const deck = (page: Page) => page.getByRole('group', { name: /^Deck/ });
const pick = async (page: Page, ...cards: string[]) => {
  for (const card of cards) await deck(page).getByRole('button', { name: card, exact: true }).click();
};
const equity = (page: Page) => page.getByTestId('hero-equity');
const results = (page: Page) => page.getByRole('complementary', { name: 'Your equity' });

test.beforeEach(async ({ page }) => {
  await page.goto('/widgets/poker');
  await expect(deck(page)).toBeVisible();
});

test('an exact river showdown between known hands', async ({ page }) => {
  await pick(page, 'Ace of spades', 'Ace of hearts', 'Two of clubs', 'Seven of diamonds', 'Nine of hearts', 'Jack of spades', 'Queen of clubs');
  await page.getByRole('group', { name: 'Opponent 1 hand' }).getByRole('button', { name: 'Set hand' }).click();
  await pick(page, 'King of spades', 'King of hearts');

  await expect(equity(page)).toHaveText('100.00%');
  await expect(results(page).getByText('Exact', { exact: true })).toBeVisible();
  await expect(results(page).getByText('1 board counted')).toBeVisible();
  await expect(results(page).getByText('Pair of Aces', { exact: true })).toBeVisible();
  await expect(results(page).getByRole('listitem').filter({ hasText: 'Opponent 1' })).toContainText('0.00%');
});

test('a spot too large to enumerate is simulated and labelled as an estimate', async ({ page }) => {
  await pick(page, 'Ace of spades', 'King of spades');
  await expect(results(page).getByText('Simulated', { exact: true })).toBeVisible();
  await expect(equity(page)).toHaveText(/^≈\d+\.\d%$/);
  await expect(results(page).getByRole('status')).toContainText(/±\d+\.\d+ pts · [\d,]+ random deals/);
  await expect(results(page).getByText('Ace-King suited')).toBeVisible();
});

test('the same card cannot be used twice', async ({ page }) => {
  await pick(page, 'Ace of spades');
  const taken = deck(page).getByRole('button', { name: 'Ace of spades, in your hand' });
  await expect(taken).toHaveAttribute('aria-disabled', 'true');
  // aria-disabled (not disabled) keeps the card in keyboard order; a click still lands on it, and must do nothing.
  await taken.click({ force: true });
  await expect(page.getByRole('button', { name: 'Your second card: empty' })).toBeVisible();
});

test('incomplete scenarios say what is missing instead of showing numbers', async ({ page }) => {
  await expect(results(page).getByRole('status')).toHaveText('Choose your two hole cards.');
  await expect(equity(page)).toHaveText('—');

  await pick(page, 'Ace of spades', 'King of spades', 'Two of clubs', 'Seven of diamonds');
  await expect(results(page).getByRole('status')).toHaveText(/The board needs 3 cards/);
  await expect(equity(page)).toHaveText('—');

  await pick(page, 'Nine of hearts');
  await page.getByRole('group', { name: 'Opponent 1 hand' }).getByRole('button', { name: 'Set hand' }).click();
  await pick(page, 'Queen of hearts');
  await expect(results(page).getByRole('status')).toHaveText(/Opponent 1 needs two cards/);

  await page.getByRole('group', { name: 'Opponent 1 hand' }).getByRole('button', { name: 'Random' }).click();
  await expect(equity(page)).toHaveText(/^\d+\.\d\d%$/);
});

test('the deck works from the keyboard: arrows move, Enter picks, Delete clears a spot', async ({ page }) => {
  await deck(page).getByRole('button', { name: 'Ace of spades', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(deck(page).getByRole('button', { name: 'King of spades', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(deck(page).getByRole('button', { name: 'King of hearts', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Your first card: King of hearts' })).toBeVisible();

  await page.getByRole('button', { name: 'Your first card: King of hearts' }).focus();
  await page.keyboard.press('Delete');
  await expect(page.getByRole('button', { name: 'Your first card: empty' })).toBeVisible();
});

test('up to nine opponents, each with their own result', async ({ page }) => {
  const add = page.getByRole('button', { name: '+ Add opponent' });
  for (let opponent = 2; opponent <= 9; opponent++) await add.click();
  await expect(add).toBeDisabled();
  await pick(page, 'Ace of spades', 'Ace of hearts');
  await expect(equity(page)).toHaveText(/^≈\d+\.\d%$/);
  const rows = results(page).getByRole('list', { name: 'Opponents' }).getByRole('listitem');
  await expect(rows).toHaveCount(9);
  await expect(rows.nth(8)).toContainText(/≈\d+\.\d%/);

  await page.getByRole('button', { name: 'Remove opponent 9' }).click();
  await expect(rows).toHaveCount(8);
  await expect(add).toBeEnabled();
});

test('the scenario is kept when the page reloads', async ({ page }) => {
  await pick(page, 'Ten of diamonds', 'Ten of clubs');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Your first card: Ten of diamonds' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Your second card: Ten of clubs' })).toBeVisible();
});

test('the × on a card removes it and makes that spot the one being picked', async ({ page }) => {
  await pick(page, 'Ace of spades', 'King of spades', 'Queen of spades');
  await page.getByRole('button', { name: 'Flop card 1: Queen of spades' }).hover();
  await page.getByRole('button', { name: 'Remove Queen of spades (Flop card 1)' }).click();
  await expect(page.getByRole('button', { name: 'Flop card 1: empty' })).toBeVisible();
  await expect(deck(page).getByRole('button', { name: 'Queen of spades', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
  await pick(page, 'Jack of hearts');
  await expect(page.getByRole('button', { name: 'Flop card 1: Jack of hearts' })).toBeVisible();
});

test('the timeline shows equity on every street dealt so far', async ({ page }) => {
  const streets = page.getByRole('list', { name: 'Equity by street' });
  const street = (name: string) => streets.getByRole('listitem').filter({ hasText: new RegExp(`^${name}`) });
  await pick(page, 'Ace of spades', 'Ace of hearts', 'Two of clubs', 'Seven of diamonds', 'Nine of hearts');
  await page.getByRole('group', { name: 'Opponent 1 hand' }).getByRole('button', { name: 'Set hand' }).click();
  await pick(page, 'King of spades', 'King of hearts');

  // On the flop: preflop and flop are known, the turn and river haven't happened.
  await expect(street('Flop')).toHaveAttribute('aria-current', 'step');
  await expect(street('Preflop')).toContainText(/\d+\.\d\d%/);
  await expect(street('Turn')).toContainText('—');

  await page.getByRole('button', { name: /^Turn: empty/ }).click();
  await pick(page, 'Jack of spades', 'Queen of clubs');
  await expect(street('River')).toHaveAttribute('aria-current', 'step');
  await expect(street('River')).toContainText('100.00%');
  for (const name of ['Preflop', 'Flop', 'Turn']) await expect(street(name)).toContainText(/\d+\.\d\d%/);
  // Each street after preflop shows how much the new card moved your equity.
  await expect(street('River')).toContainText(/\+\d+\.\d pts/);
});

test('hand odds give your exact chance of making each hand by the river', async ({ page }) => {
  // As Ks on Qs 7d 2s: 377 of 1,081 run-outs make a flush and one (Js Ts) a royal flush.
  await pick(page, 'Ace of spades', 'King of spades', 'Queen of spades', 'Seven of diamonds', 'Two of spades');
  const hands = page.getByRole('region', { name: 'Hand odds' }).getByRole('listitem');
  await expect(hands.filter({ hasText: /^Flush/ })).toContainText('34.88%');
  await expect(hands.filter({ hasText: /^Straight flush/ })).toContainText('0.09%');
  await expect(hands.filter({ hasText: /^Full house/ })).toContainText('0.00%');
});

test('pot odds compare the equity a call needs with the equity you have', async ({ page }) => {
  const potOdds = page.getByRole('region', { name: 'Pot odds' });
  await expect(potOdds.getByRole('status')).toHaveText('Enter the pot and the bet you face.');
  await potOdds.getByLabel('Pot, including the bet').fill('100');
  await potOdds.getByLabel('To call').fill('50');
  await expect(potOdds).toContainText('33.3%');

  // A won river: calling 50 into 150 is worth +100.
  await pick(page, 'Ace of spades', 'Ace of hearts', 'Two of clubs', 'Seven of diamonds', 'Nine of hearts', 'Jack of spades', 'Queen of clubs');
  await page.getByRole('group', { name: 'Opponent 1 hand' }).getByRole('button', { name: 'Set hand' }).click();
  await pick(page, 'King of spades', 'King of hearts');
  await expect(potOdds.getByRole('status')).toHaveText('Calling is profitable: +100 on average.');

  // A lost river: the call is simply lost.
  await potOdds.getByLabel('To call').fill('25');
  await page.getByRole('button', { name: /^Your first card/ }).click();
  await pick(page, 'Three of hearts');
  await page.getByRole('button', { name: /^Your second card/ }).click();
  await pick(page, 'Four of diamonds');
  await expect(potOdds.getByRole('status')).toHaveText('Folding is better: calling loses 25 on average.');
});
