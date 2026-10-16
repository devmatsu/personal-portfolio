// Layout with classic scrollbars (Windows, Linux, macOS with a mouse or "Show scroll bars: Always"), which take up
// width on pages that scroll. Playwright hides scrollbars by default; this file shows them.
import { expect, test } from '@playwright/test';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('the page does not shift sideways between pages that scroll and pages that fit on one screen', async ({ page }) => {
  // With overlay scrollbars (macOS without a mouse) a page that fits reserves no gutter even with
  // `scrollbar-gutter: stable`, while the style below still gives the scrolling page a classic one, so the two can't
  // match. Measure the browser's own scrollbar on the blank start page, before that style exists.
  const scrollbarWidth = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'width: 100px; height: 100px; overflow: scroll';
    document.body.append(probe);
    return probe.offsetWidth - probe.clientWidth;
  });
  test.skip(scrollbarWidth === 0, 'this browser uses overlay scrollbars, which take up no width, so there is no shift to check');

  // A scrollbar style pins the classic scrollbar to a known width.
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
