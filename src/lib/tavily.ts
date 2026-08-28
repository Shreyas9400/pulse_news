/**
 * Tavily AI Search Engine Integration for US Fixed Income & Credit Risk
 * Optimized for targeting specific entities with dated/stale news.
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
  source: string;
}

// In-memory server cache to conserve Tavily 1,000 monthly free tier credits
const TAVILY_CACHE = new Map<string, { timestamp: number; results: TavilySearchResult[] }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours cache per entity

export async function searchTavilyForEntity(
  entityNameOrSymbol: string,
  options?: {
    forceFresh?: boolean;
    maxResults?: number;
  }
): Promise<{ results: TavilySearchResult[]; cached: boolean }> {
  const apiKey = process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY;

  if (!apiKey) {
    return { results: [], cached: false };
  }

  // Preserve the caller's actual research question — upper-casing and keyword-stuffing it
  // destroys the specificity that makes Tavily worth calling.
  const cleanQuery = entityNameOrSymbol.trim();
  const cacheKey = `tavily_${cleanQuery.toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;

  // Check cache first (unless user explicitly requested forceFresh)
  if (!options?.forceFresh) {
    const cached = TAVILY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { results: cached.results, cached: true };
    }
  }

  try {
    const searchBody = {
      api_key: apiKey,
      query: cleanQuery,
      topic: 'news',
      search_depth: 'advanced',
      max_results: options?.maxResults || 6,
      // Deliberately NOT using include_domains: a narrow whitelist filtered out exactly the
      // specialist outlets that break private-credit stories (PitchBook, Alternative Credit
      // Investor, AltsWire, Investing.com). We instead exclude known low-signal domains and
      // let the downstream source-tier scoring rank what remains.
      exclude_domains: [
        'linkedin.com',
        'reddit.com',
        'x.com',
        'twitter.com',
        'facebook.com',
        'youtube.com',
        'tiktok.com',
        'quora.com',
        'pinterest.com',
      ],
    };

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Tavily API responded with status ${res.status}`);
      return { results: [], cached: false };
    }

    const data = await res.json();
    if (data.results && Array.isArray(data.results)) {
      const results: TavilySearchResult[] = data.results.map((r: any) => {
        let domain = 'reuters.com';
        try {
          domain = new URL(r.url).hostname.replace('www.', '');
        } catch {}

        return {
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score || 1,
          publishedDate: r.published_date || new Date().toISOString(),
          source: domain.toUpperCase(),
        };
      });

      // Cache results in memory to protect free tier credits
      TAVILY_CACHE.set(cacheKey, { timestamp: Date.now(), results });

      return { results, cached: false };
    }

    return { results: [], cached: false };
  } catch (err) {
    console.warn('[TavilySearch] Search error:', err);
    return { results: [], cached: false };
  }
}
