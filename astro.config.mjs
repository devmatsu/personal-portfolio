import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://devmatsu.com',
  output: 'static',
  // Writing moved from /blog to /writing; keep old links (and anything shared earlier) working.
  redirects: {
    '/blog': '/writing',
    '/blog/post/[id]': '/writing/[id]',
    // Old SPA widget routes dropped in v3.
    '/widgets/tictactoe': '/widgets',
    '/widgets/gitHubGraph': '/widgets',
    // Roulette was renamed Wheel.
    '/widgets/roulette': '/widgets/wheel',
  },
  // Preload same-site pages on hover/focus so navigation (and its page transition) starts without waiting on the network.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Content-Security-Policy as a <meta> on every page: Astro hashes each inline script and style it renders, so nothing
  // needs 'unsafe-inline'. Everything else is same-origin only. A <meta> CSP can't set frame-ancestors; framing is
  // blocked by the response headers in customHttp.yml instead.
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "object-src 'none'", "base-uri 'self'", "form-action 'self'"],
    },
  },
  // No Markdown here (posts arrive as dev.to HTML), so Shiki, whose inline styles the CSP would block, is switched off.
  markdown: { syntaxHighlight: false },
  integrations: [react()],
});
