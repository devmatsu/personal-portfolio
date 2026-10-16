import { setTimeout as sleep } from 'node:timers/promises';

export interface Article {
  id: number;
  title: string;
  description: string;
  slug: string;
  url: string;
  published_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  cover_image: string | null;
  social_image: string;
}

export interface ArticleDetail extends Article {
  body_html: string;
}

const API = 'https://dev.to/api';
const PAGE_SIZE = 100;

let articlesPromise: Promise<Article[]> | undefined;

const MAX_ATTEMPTS = 5;

async function fetchJson<T>(url: string): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url);
    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      // dev.to rate-limits unauthenticated bursts; honour Retry-After, else back off exponentially.
      const retryAfter = Number(response.headers.get('retry-after'));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
      await sleep(delayMs);
      continue;
    }
    if (!response.ok) {
      throw new Error(`dev.to API request failed (${response.status} ${response.statusText}): ${url}`);
    }
    return response.json() as Promise<T>;
  }
}

export function getArticles(): Promise<Article[]> {
  articlesPromise ??= (async () => {
    const articles: Article[] = [];
    for (let page = 1; ; page += 1) {
      const batch = await fetchJson<Article[]>(
        `${API}/articles?username=devmatsu&page=${page}&per_page=${PAGE_SIZE}`,
      );
      articles.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
    return articles.sort(
      (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at),
    );
  })();
  return articlesPromise;
}

// The single-article endpoint returns `tag_list` as a comma-separated string and the array as `tags`.
type RawArticleDetail = Omit<ArticleDetail, 'tag_list'> & { tags: string[] };

export async function getArticle(id: number): Promise<ArticleDetail> {
  const { tags, ...article } = await fetchJson<RawArticleDetail>(`${API}/articles/${id}`);
  return { ...article, tag_list: tags };
}
