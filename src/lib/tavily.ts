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

  const cleanQuery = entityNameOrSymbol.trim().toUpperCase();
  const cacheKey = `tavily_${cleanQuery}`;

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
      query: `${cleanQuery} credit rating debt bond yield balance sheet SEC earnings`,
      topic: 'news',
      search_depth: 'advanced',
      max_results: options?.maxResults || 6,
      include_domains: [
        'sec.gov',
        'bloomberg.com',
        'reuters.com',
        'wsj.com',
        'spglobal.com',
        'moodys.com',
        'fitchratings.com',
        'marketwatch.com',
        'cnbc.com',
        'ft.com',
        'finance.yahoo.com',
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
