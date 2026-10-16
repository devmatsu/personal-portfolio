// Layout with classic scrollbars (Windows, Linux, macOS with a mouse or "Show scroll bars: Always"), which take up
// width on pages that scroll. Playwright hides scrollbars by default; this file shows them.
import { expect, test } from '@playwright/test';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('the page does not shift sideways between pages that scroll and pages that fit on one screen', async ({ page }) => {
  // Chromium on macOS uses overlay scrollbars; a scrollbar style forces the classic kind that takes up width.
  await page.addInitScript(() => addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '::-webkit-scrollbar { width: 15px; } ::-webkit-scrollbar-thumb { background: #555; }';
    document.head.append(style);
  }));
  await page.setViewportSize({ width: 1440, height: 900 });
  const layout = async (path: string) => {
    await page.goto(path);
    return page.evaluate(() => ({
      scrolls: document.documentElement.scrollHeight > window.innerHeight,
      headerLeft: document.querySelector('header')!.getBoundingClientRect().left,
    }));
  };

  const writing = await layout('/writing');
  const widgets = await layout('/widgets');
  expect(writing.scrolls && !widgets.scrolls, 'one page scrolls and the other fits, so only one has a scrollbar').toBe(true);
  expect(widgets.headerLeft).toBe(writing.headerLeft);
});
