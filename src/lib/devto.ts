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

/**
 * GETs `url` as JSON. Rate limits (429), server errors (5xx) and network failures are retried with exponential backoff
 * up to MAX_ATTEMPTS times; any other error, or one that outlasts the retries, throws so the build fails loudly.
 * `baseDelayMs` is only overridden by tests, to retry without waiting.
 */
export async function fetchJson<T>(url: string, baseDelayMs = 500): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    const backoffMs = baseDelayMs * 2 ** attempt;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(backoffMs);
        continue;
      }
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`dev.to API request failed (${reason}): ${url}`, { cause: error });
    }
    if ((response.status === 429 || response.status >= 500) && attempt < MAX_ATTEMPTS) {
      // dev.to rate-limits unauthenticated bursts and has the odd outage; honour Retry-After, else back off.
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs);
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
