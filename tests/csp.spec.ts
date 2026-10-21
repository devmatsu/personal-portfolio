// The Content-Security-Policy (astro.config.mjs `security.csp`) allows only same-origin resources and the inline
// scripts and styles Astro hashed at build time. Anything else (an inline event handler, a third-party script, a
// `style` attribute in markup) is blocked silently in production, so every page type and interactive path is
// exercised here and must report no violation.
import { expect, test, type Page } from '@playwright/test';

const watchViolations = async (page: Page) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as Window & { cspViolations?: string[] }).cspViolations = seen;
    document.addEventListener('securitypolicyviolation', (event) => seen.push(`${event.effectiveDirective} ${event.blockedURI || 'inline'} ${event.sourceFile}:${event.lineNumber}`));
  });
};
const violations = (page: Page) => page.evaluate(() => (window as Window & { cspViolations?: string[] }).cspViolations ?? []);

test.beforeEach(async ({ page }) => {
  await watchViolations(page);
});

test('every page renders without CSP violations and carries the policy', async ({ page }) => {
  await page.goto('/writing');
  const firstPost = await page.locator('main a[href^="/writing/"]').first().getAttribute('href');
  const pages = ['/', '/writing', firstPost!, '/widgets', '/widgets/rubik', '/widgets/wheel', '/widgets/pomodoro', '/widgets/poker', '/widgets/coin', '/no-such-page'];
  for (const path of pages) {
    await page.goto(path);
    await page.waitForLoadState('load');
    await expect(page.locator('meta[http-equiv="content-security-policy"]'), path).toHaveAttribute('content', /script-src 'self' 'sha256-/);
    expect(await violations(page), path).toEqual([]);
  }
});

test('interactive paths run under the policy: search, page transitions and every widget', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.keyboard.type('coin');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/widgets\/coin\/?$/);
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Coin flip' }).locator('[aria-live]')).toHaveText(/^(Heads 1|Tails 2)$/);
  expect(await violations(page), 'search + coin').toEqual([]);

  // The poker calculation runs in a module Worker, which the policy must allow from the same origin.
  await page.goto('/widgets/poker');
  for (const card of ['Ace of spades', 'King of spades']) await page.getByRole('group', { name: /^Deck/ }).getByRole('button', { name: card, exact: true }).click();
  await expect(page.getByTestId('hero-equity')).toHaveText(/^≈\d+\.\d%$/);
  expect(await violations(page), 'poker').toEqual([]);

  await page.goto('/widgets/pomodoro');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.goto('/widgets/wheel');
  await page.getByRole('button', { name: 'Spin' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'The wheel landed on' })).toBeVisible({ timeout: 8000 });
  await page.goto('/widgets/rubik');
  await page.locator('main h1').click();
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.keyboard.press('a');
  await expect(page.getByText('1 solves')).toBeVisible();
  expect(await violations(page), 'pomodoro + wheel + rubik').toEqual([]);
});

test('the 404 page still opens search without an inline handler', async ({ page }) => {
  await page.goto('/no-such-page');
  await page.getByRole('button', { name: 'Open search' }).click();
  await expect(page.locator('dialog[data-palette]')).toHaveAttribute('open', '');
  expect(await violations(page)).toEqual([]);
});
