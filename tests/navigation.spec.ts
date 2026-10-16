import { expect, test, type Page } from '@playwright/test';

test('the header marks the current destination', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await page.goto('/writing');
  await expect(nav.getByRole('link', { name: 'Writing' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('a[aria-current]')).toHaveCount(1);

  await page.goto('/widgets/rubik');
  await expect(nav.getByRole('link', { name: 'Widgets' })).toHaveAttribute('aria-current', 'true');
  await expect(nav.locator('a[aria-current]')).toHaveCount(1);
});

test('on the homepage the header highlights the section in view', async ({ page }) => {
  await page.goto('/');
  const current = page.getByRole('navigation', { name: 'Primary' }).locator('a[aria-current]');
  await expect(current).toHaveCount(0);

  for (const [id, label] of [['overview', 'Overview'], ['experience', 'Experience'], ['workflow', 'Workflow'], ['contact', 'Contact']] as const) {
    await page.evaluate((target) => document.getElementById(target)?.scrollIntoView({ behavior: 'instant' }), id);
    await expect(current).toHaveText(label);
    await expect(current).toHaveAttribute('aria-current', 'location');
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(current).toHaveCount(0);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`header jumps at ${viewport.width}px show only the chosen section`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const id of ['overview', 'experience', 'workflow', 'contact']) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      if (viewport.width < 900) await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('navigation', { name: 'Primary' }).locator(`a[href="/#${id}"]`).click();
      await expect.poll(async () => {
        const before = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(150);
        return before > 0 && before === await page.evaluate(() => window.scrollY);
      }).toBe(true);
      const box = await page.evaluate((target) => ({
        top: document.getElementById(target)!.getBoundingClientRect().top,
        bottom: document.getElementById(target)!.getBoundingClientRect().bottom,
        footerBottom: document.querySelector('.site-footer')!.getBoundingClientRect().bottom,
        headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
        atPageEnd: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1,
        viewport: window.innerHeight,
      }), id);
      expect(box.top, `${id} should start just below the sticky header`).toBeGreaterThanOrEqual(box.headerBottom);
      expect(box.top, `${id} should start just below the sticky header`).toBeLessThan(110);
      if (id === 'contact') {
        // The last screen is Contact plus the footer: the footer is fully visible without another scroll.
        expect(box.atPageEnd, 'jumping to Contact reaches the end of the page').toBe(true);
        expect(box.footerBottom, 'the footer is fully visible').toBeLessThanOrEqual(box.viewport + 1);
      } else {
        // The section fills the rest of the screen, so neither the next nor the previous section shows after the jump.
        expect(box.bottom, `${id} should fill the screen`).toBeGreaterThanOrEqual(box.viewport - 1);
      }
    }
  });
}

test('a scroll that stops in the blank space below a short section glides to a section; elsewhere it stays put', async ({ page }) => {
  const sectionTop = (id: string) => page.evaluate((target) => Math.round(document.getElementById(target)!.getBoundingClientRect().top + window.scrollY - 96), id);
  const wheelFrom = async (from: number, delta: number) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), from);
    await page.mouse.move(700, 450);
    for (let step = 0; step < 6; step++) await page.mouse.wheel(0, delta / 6);
  };

  // A stop over content (here, inside Experience, which is taller than a 1440×900 screen) is left alone.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const experienceAt1440 = await sectionTop('experience');
  await wheelFrom(experienceAt1440, 120);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => Math.round(window.scrollY)), 'a stop over content is left alone').toBe(experienceAt1440 + 120);

  // On a tall screen Overview is shorter than its screen, leaving a large blank space before Experience.
  await page.setViewportSize({ width: 1728, height: 1117 });
  await page.goto('/');
  const overview = await sectionTop('overview');
  const experience = await sectionTop('experience');

  await wheelFrom(overview, Math.round((experience - overview) * 0.6));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { message: 'scrolling down into the gap continues to Experience' }).toBe(experience);

  await wheelFrom(experience, -300);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { message: 'scrolling up into the gap returns to Overview' }).toBe(overview);

  // Reaching the very end (Contact plus the footer) stays there instead of gliding back to the top of Contact.
  const bottom = await page.evaluate(() => Math.round(document.documentElement.scrollHeight - window.innerHeight));
  await page.evaluate((y) => window.scrollTo({ top: y - 300, behavior: 'instant' }), bottom);
  await page.waitForTimeout(500);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), bottom);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => Math.round(window.scrollY)), 'the footer stays in view at the end of the page').toBe(bottom);
});

test.describe('PageDown / PageUp', () => {
  const sectionTop = (page: Page, id: string) => page.evaluate((target) => Math.round(document.getElementById(target)!.getBoundingClientRect().top + window.scrollY - 96), id);
  const settledScroll = async (page: Page) => {
    let before = -1;
    await expect.poll(async () => {
      const now = await page.evaluate(() => Math.round(window.scrollY));
      const stable = now === before;
      before = now;
      return stable;
    }, { intervals: [150] }).toBe(true);
    return before;
  };

  // 1728×1117 (a 16" MacBook Pro) is tall enough that short sections leave a big blank space below them on landing.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1728, height: 1117 }]) {
    test(`step through the sections one screen at a time at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator('main h1').click();
      const stops = ['overview', 'experience', 'workflow', 'contact'];
      // Wait past the moment a follow-up glide would start, so a second jump after landing is caught.
      const landing = async () => { await settledScroll(page); await page.waitForTimeout(500); return settledScroll(page); };

      for (const id of stops) {
        // A section taller than the screen takes extra presses to page through; none may skip past the next section.
        const target = await sectionTop(page, id);
        let position = await settledScroll(page);
        for (let press = 0; press < 4 && position !== target; press++) {
          await page.keyboard.press('PageDown');
          position = await landing();
          expect(position, `PageDown never skips past ${id}`).toBeLessThanOrEqual(target);
        }
        expect(position, `PageDown reaches ${id} and stays there`).toBe(target);
      }
      for (const id of [...stops.slice(0, -1)].reverse()) {
        await page.keyboard.press('PageUp');
        expect(await landing(), `PageUp lands on ${id} and stays there`).toBe(await sectionTop(page, id));
      }
      await page.keyboard.press('PageUp');
      expect(await landing(), 'PageUp from Overview returns to the top').toBe(0);
    });
  }

  test('pressing again mid-animation moves on to the following section instead of being ignored', async ({ page }) => {
    // A screen where every section fits (2560×1440, a 27" monitor), so each press is a plain section-to-section step.
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    await page.locator('main h1').click();

    await page.keyboard.press('PageDown');
    await page.waitForTimeout(150);
    await page.keyboard.press('PageDown');
    expect(await settledScroll(page), 'two quick PageDowns from the top land on Experience').toBe(await sectionTop(page, 'experience'));

    await page.keyboard.press('PageDown');
    await page.waitForTimeout(150);
    await page.keyboard.press('PageDown');
    expect(await settledScroll(page), 'two more land on Contact').toBe(await sectionTop(page, 'contact'));

    await page.keyboard.press('PageUp');
    await page.waitForTimeout(150);
    await page.keyboard.press('PageUp');
    expect(await settledScroll(page), 'two quick PageUps from Contact land on Experience').toBe(await sectionTop(page, 'experience'));
  });

  test('a section taller than the screen is paged through before moving on', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const experience = await sectionTop(page, 'experience');
    const workflow = await sectionTop(page, 'workflow');
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), experience);
    await page.locator('#experience h2').click();

    await page.keyboard.press('PageDown');
    const afterFirst = await settledScroll(page);
    expect(afterFirst, 'stays inside Experience').toBeGreaterThan(experience);
    expect(afterFirst, 'does not skip to Workflow').toBeLessThan(workflow);

    await page.keyboard.press('PageUp');
    expect(await settledScroll(page), 'PageUp from partway in returns to the start of Experience').toBe(experience);
  });
});

test('resizing the window keeps what you are reading in place', async ({ page }) => {
  // Homepage screens are sized from the window height, so a taller or shorter window changes every screen above you.
  // Like any page, the content in view should stay put and the window should just show more or less below it.
  // Unrounded: layout positions are fractional but the page scrolls in whole pixels, so "in place" means within 1px.
  const positionOf = (selector: string) => page.evaluate((target) => document.querySelector(target)!.getBoundingClientRect().top, selector);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  for (const [selector, label] of [['#workflow h2', 'a section start'], ['#experience .entry:nth-child(2) h3', 'partway into a tall section']] as const) {
    await page.evaluate((target) => window.scrollTo({ top: document.querySelector(target)!.getBoundingClientRect().top + window.scrollY - 200, behavior: 'instant' }), selector);
    await page.waitForTimeout(400);
    const before = await positionOf(selector);
    for (const [width, height] of [[1440, 1100], [1440, 700], [1280, 1000], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      // Long enough for any follow-up movement (such as the gap glide) to have started and moved the page.
      await page.waitForTimeout(700);
      expect(Math.abs(await positionOf(selector) - before), `${label}: still in place at ${width}×${height}`).toBeLessThan(1);
    }
  }
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens from the keyboard, tabs into the links and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();

    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Overview' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  test('closes after choosing a destination', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Widgets' }).click();
    await expect(page).toHaveURL(/\/widgets\/?$/);
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});

test('opening the mobile menu does not move the page or change the highlighted section', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'instant' }));
  const section = page.locator('#workflow');
  const before = (await section.boundingBox())!.y;

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Primary' }).locator('a[aria-current]')).toHaveText('Workflow');
  expect((await section.boundingBox())!.y).toBe(before);
});

test('the logo scrolls back to the top on the homepage without reloading', async ({ page }) => {
  // Reach Contact the way a visitor does, and wait for that smooth scroll to finish before using the logo.
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Contact' }).click();
  await expect.poll(async () => {
    const before = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(150);
    return before > 0 && before === await page.evaluate(() => window.scrollY);
  }).toBe(true);
  await page.evaluate(() => { (window as Window & { samePage?: boolean }).samePage = true; });

  await page.getByRole('link', { name: 'Matsu home' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as Window & { samePage?: boolean }).samePage)).toBe(true);
});

test('section links scroll in place without putting #section in the URL or history', async ({ page }) => {
  await page.goto('/');
  const historyLength = await page.evaluate(() => history.length);

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Workflow' }).click();
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('workflow')!.getBoundingClientRect().top))).toBeLessThan(110);
  await page.getByRole('link', { name: 'View experience' }).evaluate((link: HTMLAnchorElement) => link.click());
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('experience')!.getBoundingClientRect().top))).toBeLessThan(110);

  expect(page.url()).toMatch(/\/$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test('a link to a section from another page lands on it and tidies the URL', async ({ page }) => {
  await page.goto('/widgets');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Workflow' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('workflow')!.getBoundingClientRect().top))).toBeLessThan(110);
});
