import { expect, test, type Page } from '@playwright/test';

// The Pomodoro readout is the only mm:ss text on the page.
const pomodoroReadout = (page: Page) => page.getByText(/^\d{2}:\d{2}$/);

test.describe('Pomodoro keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widgets/pomodoro');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('Space on a focused Reset button resets instead of toggling the timer', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Reset' }).focus();
    await page.keyboard.press('Space');
    await expect(pomodoroReadout(page)).toHaveText('25:00');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('Space on the header Search button opens search and leaves the timer idle', async ({ page }) => {
    await page.getByRole('button', { name: 'Search', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('dialog[data-palette]')).toHaveAttribute('open', '');
    await page.waitForTimeout(400);
    await expect(page).toHaveTitle('Pomodoro · Matsu');
  });

  test('Space with nothing focused still starts and pauses the timer', async ({ page }) => {
    await page.locator('main h1').click();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('R and S still work after clicking a button', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(pomodoroReadout(page)).not.toHaveText('25:00');
    await page.keyboard.press('r');
    await expect(pomodoroReadout(page)).toHaveText('25:00');
    await page.keyboard.press('s');
    await expect(page.getByText('SHORT BREAK', { exact: true })).toBeVisible();
    await expect(pomodoroReadout(page)).toHaveText('05:00');
  });
});

test('a running Pomodoro survives a reload and switching widgets', async ({ page }) => {
  await page.goto('/widgets/pomodoro');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(1200);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(pomodoroReadout(page)).not.toHaveText('25:00');

  const switcher = page.getByRole('navigation', { name: 'Switch widget' });
  await switcher.getByRole('link', { name: 'Roulette' }).click();
  await expect(page).toHaveURL(/\/widgets\/roulette/);
  await switcher.getByRole('link', { name: 'Pomodoro' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(pomodoroReadout(page)).not.toHaveText('25:00');
});

test.describe('Rubik timer keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widgets/rubik');
    await expect(page.getByText('Hold Space or tap to start')).toBeVisible();
  });

  test('Space on the header Search button opens search without starting a solve', async ({ page }) => {
    await page.getByRole('button', { name: 'Search', exact: true }).focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.locator('dialog[data-palette]')).toHaveAttribute('open', '');
    await expect(page.getByText('Hold Space or tap to start')).toBeVisible();
  });

  test('holding Space starts a solve and any key stops it', async ({ page }) => {
    await page.locator('main h1').click();
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.getByText('Tap or press any key to stop')).toBeVisible();
    await page.keyboard.press('a');
    await expect(page.getByText('1 solves')).toBeVisible();
  });

  test('the clock button itself responds to Space for keyboard users', async ({ page }) => {
    await page.getByRole('button', { name: /^Timer:/ }).focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.getByText('Tap or press any key to stop')).toBeVisible();
  });

  test('holding Space after clicking a penalty starts the next solve without toggling it', async ({ page }) => {
    await page.locator('main h1').click();
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.keyboard.press('a');
    const firstSolve = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Toggle +2 for solve 1', exact: true }) });
    await page.getByRole('button', { name: 'Toggle +2 for solve 1', exact: true }).click();
    await expect(firstSolve.locator('strong')).toHaveText(/^0:02\./);

    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.getByText('Tap or press any key to stop')).toBeVisible();
    await page.keyboard.press('a');
    await expect(page.getByText('2 solves')).toBeVisible();
    await expect(firstSolve.locator('strong')).toHaveText(/^0:02\./);
  });

  test('a keyboard user can still toggle a penalty with Space', async ({ page }) => {
    await page.locator('main h1').click();
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.keyboard.press('a');
    const plusTwo = page.getByRole('button', { name: 'Toggle +2 for solve 1', exact: true });
    await plusTwo.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('listitem').filter({ has: plusTwo }).locator('strong')).toHaveText(/^0:02\./);
    await expect(page.getByText('Hold Space or tap to start')).toBeVisible();
    await expect(plusTwo).toBeFocused();
  });
});

test('widget pages link back to the index and mark the current widget', async ({ page }) => {
  for (const [slug, label] of [['rubik', 'Rubik'], ['roulette', 'Roulette'], ['pomodoro', 'Pomodoro'], ['poker', 'Poker']] as const) {
    await page.goto(`/widgets/${slug}`);
    const switcher = page.getByRole('navigation', { name: 'Switch widget' });
    await expect(switcher.locator('a[aria-current="page"]')).toHaveText(label);
    await expect(switcher.locator('a[aria-current]')).toHaveCount(1);
    await expect(page.locator('main').getByRole('link', { name: 'All widgets' })).toHaveAttribute('href', '/widgets');
  }
});
