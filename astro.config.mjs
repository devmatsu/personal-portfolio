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
  },
  // Preload same-site pages on hover/focus so navigation (and its page transition) starts without waiting on the network.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [react()],
});
