// Does dev.to have a published post that the live site doesn't? Prints the missing post ids and writes
// `stale=true|false` to $GITHUB_OUTPUT when run in GitHub Actions. Usage: node scripts/writing-is-stale.mjs [site-url]
import { appendFileSync } from 'node:fs';

const site = process.argv[2] ?? 'https://devmatsu.com';
const getJson = async (url) => {
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url} answered ${response.status} ${response.statusText}`);
  return response.json();
};

const live = await getJson(`${site}/writing/posts.json?checked=${Date.now()}`);
const published = [];
for (let page = 1; ; page += 1) {
  const batch = await getJson(`https://dev.to/api/articles?username=devmatsu&per_page=100&page=${page}`);
  published.push(...batch);
  if (batch.length < 100) break;
}

const onSite = new Set(live.ids);
const missing = published.filter((article) => !onSite.has(article.id));
for (const article of missing) console.log(`missing: ${article.id} ${article.published_at} ${article.title}`);
console.log(`${published.length} posts on dev.to, ${live.ids.length} on ${site}, ${missing.length} missing`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `stale=${missing.length > 0}\n`);
