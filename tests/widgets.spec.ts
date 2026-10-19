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

test.describe('Pomodoro settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widgets/pomodoro');
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('a duration can be retyped without being clamped mid-edit', async ({ page }) => {
    const focus = page.getByLabel('Focus (min)');
    await focus.click();
    await focus.press('End');
    await focus.press('Backspace');
    await focus.press('Backspace');
    await expect(focus).toHaveValue('');
    await focus.pressSequentially('5');
    await expect(focus).toHaveValue('5');
    await expect(pomodoroReadout(page)).toHaveText('05:00');
    await focus.fill('0');
    await focus.press('Enter');
    await expect(focus).toHaveValue('1');
    await expect(pomodoroReadout(page)).toHaveText('01:00');
  });

  test('shortening the running session keeps the progress ring within one lap', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByLabel('Focus (min)').fill('1');
    await page.getByLabel('Focus (min)').blur();
    const ring = page.getByRole('region', { name: 'Pomodoro timer' }).locator('svg circle').nth(1);
    await expect.poll(async () => Number(await ring.getAttribute('stroke-dashoffset'))).toBeGreaterThanOrEqual(0);
  });
});

test('widgets keep working when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage is blocked', 'QuotaExceededError'); }; });

  await page.goto('/widgets/pomodoro');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page.goto('/widgets/rubik');
  await page.locator('main h1').click();
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.keyboard.press('a');
  await expect(page.getByText('1 solves')).toBeVisible();
});

test('Roulette honours "Remove winner" toggled while the wheel spins', async ({ page }) => {
  await page.goto('/widgets/roulette');
  const options = page.getByRole('list', { name: 'Wheel options' }).getByRole('listitem');
  await expect(options).toHaveCount(4);
  await page.getByRole('button', { name: 'Spin' }).click();
  await page.getByLabel('Remove winner after spin').check();
  await expect(page.getByText(/^The wheel landed on /)).toBeVisible({ timeout: 8000 });
  await expect(options).toHaveCount(3);
});

test('Roulette highlights no remaining option after removing the winner', async ({ page }) => {
  // Both draws (winner, extra turns) come from crypto.getRandomValues: 0 picks the first option, Pizza.
  await page.addInitScript(() => {
    Crypto.prototype.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
      (array as unknown as Uint32Array)[0] = 0;
      return array;
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/widgets/roulette');
  const options = page.getByRole('list', { name: 'Wheel options' }).getByRole('listitem');
  await expect(options).toHaveCount(4);
  const plainColor = await options.nth(1).evaluate((item) => getComputedStyle(item).color);
  await page.getByLabel('Remove winner after spin').check();
  await page.getByRole('button', { name: 'Spin' }).click();
  await expect(page.getByText('The wheel landed on Pizza.')).toBeVisible();
  await expect(options).toHaveText(['Sushi×', 'Tacos×', 'Pasta×']);
  expect(await options.evaluateAll((items) => items.map((item) => getComputedStyle(item).color))).toEqual([plainColor, plainColor, plainColor]);
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

  for (const target of ['box', 'label text'] as const) {
    test(`holding Space after clicking the inspection ${target} starts a solve without toggling it`, async ({ page }) => {
      const inspection = page.getByLabel('15 s inspection');
      await (target === 'box' ? inspection : page.getByText('15 s inspection')).click();
      await expect(inspection).toBeChecked();

      await page.keyboard.down('Space');
      await page.waitForTimeout(400);
      await page.keyboard.up('Space');
      await expect(page.getByText(/^Inspection · /)).toBeVisible();
      await expect(inspection).toBeChecked();
    });
  }

  test('a keyboard user can still toggle inspection with Space', async ({ page }) => {
    const inspection = page.getByLabel('15 s inspection');
    await inspection.focus();
    await page.keyboard.press('Space');
    await expect(inspection).toBeChecked();
    await expect(page.getByText('Hold Space or tap to start')).toBeVisible();
    await expect(inspection).toBeFocused();
  });
});

test.describe('Coin flip', () => {
  // The coin draws from crypto.getRandomValues: an even value lands Heads, an odd one Tails.
  const rigCoin = (page: Page, values: number[]) => page.addInitScript((queue) => {
    Crypto.prototype.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
      (array as unknown as Uint32Array)[0] = queue.shift() ?? 0;
      return array;
    };
  }, values);
  const result = (page: Page) => page.getByRole('region', { name: 'Coin flip' }).locator('[aria-live]');

  test('one click flips: an even draw is Heads 1, an odd one Tails 2, and it cannot be flipped mid-air', async ({ page }) => {
    await rigCoin(page, [4, 7]);
    await page.goto('/widgets/coin');
    const flip = page.getByRole('button', { name: 'Flip', exact: true });
    await flip.click();
    await expect(flip).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Flip the coin' })).toBeDisabled();
    await expect(result(page)).toHaveText('Flipping…');
    await expect(result(page)).toHaveText('Heads 1');
    await expect(flip).toBeEnabled();
    await page.getByRole('button', { name: 'Flip the coin' }).click();
    await expect(result(page)).toHaveText('Tails 2');
  });

  test('Space flips the coin, and reduced motion lands it without the spin', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await rigCoin(page, [1]);
    await page.goto('/widgets/coin');
    await expect(page.getByRole('button', { name: 'Flip', exact: true })).toBeVisible();
    await page.locator('main h1').click();
    await page.keyboard.press('Space');
    // The full spin takes over a second; with reduced motion the result is there well before that.
    await expect(result(page)).toHaveText('Tails 2', { timeout: 800 });
  });
});

test('widget pages link back to the index and mark the current widget', async ({ page }) => {
  for (const [slug, label] of [['rubik', 'Rubik'], ['roulette', 'Roulette'], ['pomodoro', 'Pomodoro'], ['poker', 'Poker'], ['coin', 'Coin']] as const) {
    await page.goto(`/widgets/${slug}`);
    const switcher = page.getByRole('navigation', { name: 'Switch widget' });
    await expect(switcher.locator('a[aria-current="page"]')).toHaveText(label);
    await expect(switcher.locator('a[aria-current]')).toHaveCount(1);
    await expect(page.locator('main').getByRole('link', { name: 'All widgets' })).toHaveAttribute('href', '/widgets');
  }
});

test('the widget switcher fits on narrow phones without scrolling the page sideways', async ({ page }) => {
  for (const width of [320, 390, 460]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/widgets/coin');
    const fits = await page.evaluate(() => {
      const list = document.querySelector('nav[aria-label="Switch widget"] ul')!;
      return document.documentElement.scrollWidth <= innerWidth && list.getBoundingClientRect().right <= innerWidth && list.scrollWidth <= list.clientWidth;
    });
    expect(fits, `switcher at ${width}px`).toBe(true);
  }
});
