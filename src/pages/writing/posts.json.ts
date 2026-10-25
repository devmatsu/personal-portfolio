import type { APIRoute } from 'astro';
import { getArticles } from '../../lib/devto';

// The dev.to posts this build includes, newest first. The daily writing check (.github/workflows/writing-refresh.yml)
// compares it with dev.to and rebuilds the site when dev.to has a post that isn't here.
export const GET: APIRoute = async () => {
  const articles = await getArticles();
  return new Response(JSON.stringify({ ids: articles.map((article) => article.id) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
