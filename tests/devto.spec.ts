// dev.to client retries. These run in Node (no browser) against a stubbed global fetch, so they never hit dev.to. The
// build calls this client for every page, so a transient dev.to hiccup must not fail it, but a real failure must.
import { expect, test } from '@playwright/test';
import { fetchJson } from '../src/lib/devto';

const URL = 'https://dev.to/api/articles/1';
const BASE_DELAY_MS = 1;
const realFetch = globalThis.fetch;

/** Replaces fetch with one that plays `steps` in order (a status code, or an Error to reject with) and counts calls. */
function stubFetch(...steps: (number | Error)[]) {
  const calls = { count: 0 };
  globalThis.fetch = async () => {
    const step = steps[Math.min(calls.count, steps.length - 1)];
    calls.count += 1;
    if (step instanceof Error) throw step;
    return new Response(JSON.stringify({ id: 1 }), { status: step });
  };
  return calls;
}

test.afterEach(() => {
  globalThis.fetch = realFetch;
});

test('retries a server error and returns the next good response', async () => {
  const calls = stubFetch(503, 502, 200);
  expect(await fetchJson(URL, BASE_DELAY_MS)).toEqual({ id: 1 });
  expect(calls.count).toBe(3);
});

test('retries when the request itself fails', async () => {
  const calls = stubFetch(new TypeError('fetch failed'), 200);
  expect(await fetchJson(URL, BASE_DELAY_MS)).toEqual({ id: 1 });
  expect(calls.count).toBe(2);
});

test('retries a rate limit', async () => {
  const calls = stubFetch(429, 200);
  expect(await fetchJson(URL, BASE_DELAY_MS)).toEqual({ id: 1 });
  expect(calls.count).toBe(2);
});

test('fails after five attempts when the server keeps erroring', async () => {
  const calls = stubFetch(500);
  await expect(fetchJson(URL, BASE_DELAY_MS)).rejects.toThrow(/dev\.to API request failed \(500\b.*articles\/1$/);
  expect(calls.count).toBe(5);
});

test('fails after five attempts when the network stays down', async () => {
  const calls = stubFetch(new TypeError('fetch failed'));
  await expect(fetchJson(URL, BASE_DELAY_MS)).rejects.toThrow(/dev\.to API request failed \(fetch failed\).*articles\/1$/);
  expect(calls.count).toBe(5);
});

test('fails at once on a client error', async () => {
  const calls = stubFetch(404);
  await expect(fetchJson(URL, BASE_DELAY_MS)).rejects.toThrow(/dev\.to API request failed \(404\b.*articles\/1$/);
  expect(calls.count).toBe(1);
});
