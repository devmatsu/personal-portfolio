import { createHash } from 'node:crypto';

/**
 * CSP hash of an inline script's exact text. Astro hashes the scripts it bundles, not inline ones, so each inline
 * script registers its own with `Astro.csp.insertScriptHash` before the page's <head> (and its CSP <meta>) is written.
 */
export function inlineScriptHash(code: string): `sha256-${string}` {
  return `sha256-${createHash('sha256').update(code).digest('base64')}`;
}
