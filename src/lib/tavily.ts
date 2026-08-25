/**
 * Optional Tavily AI Search Engine Integration for US Fixed Income & Credit Risk
 * Optimized for domain-specific credit intelligence (sec.gov, spglobal.com, moodys.com, reuters.com).
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export async function searchTavilyCreditNews(query: string, options?: {
  maxResults?: number;
  includeDomains?: string[];
}): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} credit rating debt fixed income balance sheet`,
        topic: 'news',
        search_depth: 'advanced',
        max_results: options?.maxResults || 8,
        include_domains: options?.includeDomains || [
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
        ],
      }),
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.warn(`Tavily API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score || 1,
        publishedDate: r.published_date,
      }));
    }

    return [];
  } catch (err) {
    console.warn('[TavilySearch] Fallback to standard RSS wire:', err);
    return [];
  }
}
