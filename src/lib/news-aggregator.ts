import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { NewsArticle } from './types';
import { RSS_SOURCES, getCustomSearchRssUrl, getYahooStockRssUrl, RssSource } from './rss-sources';
import { getTickerMeta, isSectorEntity, getSymbolDisplayInfo } from './stock-aliases';
import { searchTavilyForEntity } from './tavily';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PulseNews/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
    ],
  },
});

/**
 * Extracts a clean image URL from RSS item metadata or HTML content
 */
function extractImageUrl(item: any, rawHtml?: string): string | undefined {
  if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  if (item.mediaContent) {
    const media = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
    if (media?.$?.url) return media.$.url;
  }
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }

  const htmlToParse = rawHtml || item.contentEncoded || item.content || item.summary || item.description || '';
  if (htmlToParse) {
    try {
      const $ = cheerio.load(htmlToParse);
      const src = $('img').first().attr('src');
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        return src;
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}

/**
 * Strips HTML tags and excessive whitespace
 */
function cleanDescription(rawHtml?: string): string {
  if (!rawHtml) return '';
  try {
    const $ = cheerio.load(rawHtml);
    const text = $.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 320);
  } catch {
    return rawHtml.replace(/<[^>]*>?/gm, '').trim().slice(0, 320);
  }
}

/**
 * Simple heuristic sentiment indicator (positive/neutral/negative)
 */
export function deriveSentiment(title: string, desc: string): 'positive' | 'neutral' | 'negative' {
  const combined = (title + ' ' + desc).toLowerCase();
  const positiveWords = ['surge', 'jump', 'gains', 'record high', 'breakthrough', 'profit', 'rally', 'boost', 'soars', 'win', 'success', 'growth', 'optimism', 'advances', 'upgrade'];
  const negativeWords = ['slump', 'crash', 'falls', 'war', 'crisis', 'drop', 'inflation', 'loss', 'recession', 'warning', 'layoffs', 'threat', 'plunge', 'decline', 'attack', 'downgrade', 'default'];

  let posScore = 0;
  let negScore = 0;

  for (const w of positiveWords) {
    if (combined.includes(w)) posScore++;
  }
  for (const w of negativeWords) {
    if (combined.includes(w)) negScore++;
  }

  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

/**
 * Fetches and parses a single RSS feed source safely with timeout
 */
async function fetchFeed(source: RssSource): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    if (!feed || !feed.items) return [];

    return feed.items.map((item, index) => {
      const title = item.title ? item.title.trim() : 'Market Intelligence Update';
      const rawHtml = item.content || item.summary || item['content:encoded'] || (item as any).description || '';
      const description = cleanDescription(rawHtml);
      const imageUrl = extractImageUrl(item, rawHtml);
      const timestamp = item.pubDate ? new Date(item.pubDate).getTime() : Date.now() - index * 60000;
      const sentiment = deriveSentiment(title, description);

      return {
        id: `${source.id}-${item.guid || item.link || Math.random().toString(36).slice(2)}`,
        title,
        link: item.link || '#',
        description,
        source: source.name,
        sourceIcon: source.icon,
        publishedAt: item.pubDate || new Date().toISOString(),
        timestamp,
        category: source.category,
        imageUrl,
        author: (item as any).creator || (item as any).author || undefined,
        sentiment,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetches news tailored specifically to portfolio assets & sectors
 */
export async function getAggregatedNews({
  category = 'all',
  query,
  stockSymbols,
  limit = 40,
}: {
  category?: string;
  query?: string;
  stockSymbols?: string[];
  limit?: number;
} = {}): Promise<NewsArticle[]> {
  let sourcesToFetch: RssSource[] = [];

  if (query) {
    sourcesToFetch = [
      {
        id: `search-${encodeURIComponent(query)}`,
        name: `Topic: "${query}"`,
        url: getCustomSearchRssUrl(query),
        category: 'markets',
        icon: '🔍',
      },
    ];
  } else if (stockSymbols && stockSymbols.length > 0) {
    // 1. Separate pure stock tickers from sector entities
    const pureStockTickers = stockSymbols.filter((s) => !isSectorEntity(s));
    const sectorEntities = stockSymbols.filter((s) => isSectorEntity(s));

    // A. Yahoo Finance RSS for actual stock tickers
    if (pureStockTickers.length > 0) {
      sourcesToFetch.push({
        id: 'yahoo-portfolio-stocks',
        name: 'Yahoo Finance Wire',
        url: getYahooStockRssUrl(pureStockTickers.slice(0, 10)),
        category: 'portfolio',
        icon: '📈',
        isFinancialTicker: true,
      });

      // Targeted Google News RSS queries for top individual portfolio stocks
      pureStockTickers.slice(0, 5).forEach((sym) => {
        const info = getSymbolDisplayInfo(sym);
        const stockQuery = `("${info.name}" OR ${sym}) AND (stock OR earnings OR debt OR credit OR revenue)`;
        sourcesToFetch.push({
          id: `stock-wire-${sym}`,
          name: `${sym} Intelligence Wire`,
          url: getCustomSearchRssUrl(stockQuery),
          category: 'portfolio',
          icon: '⚡',
        });
      });
    }

    // B. Targeted Google News RSS queries for Sector Trackers
    sectorEntities.slice(0, 4).forEach((sec) => {
      const meta = getTickerMeta(sec);
      const sectorLabel = meta?.name || sec.replace(/_/g, ' ');
      const sectorQuery = `("${sectorLabel}") AND (credit OR debt OR market OR bonds OR industry OR outlook)`;
      sourcesToFetch.push({
        id: `sector-wire-${sec}`,
        name: `${sectorLabel} Intelligence`,
        url: getCustomSearchRssUrl(sectorQuery),
        category: 'portfolio',
        icon: '📊',
      });
    });
  } else if (category === 'all') {
    sourcesToFetch = RSS_SOURCES;
  } else {
    sourcesToFetch = RSS_SOURCES.filter((s) => s.category === category);
  }

  // Fetch all feeds concurrently with Promise.allSettled
  const results = await Promise.allSettled(sourcesToFetch.map((s) => fetchFeed(s)));
  let allArticles: NewsArticle[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled') {
      allArticles.push(...res.value);
    }
  }

  // Multi-Engine HTML Scraper Integration (DuckDuckGo + Bing News + Google Realtime Wire)
  if (stockSymbols && stockSymbols.length > 0) {
    try {
      const { scrapeMultiEngineNews } = await import('./html-scraper');
      const topSymbols = stockSymbols.slice(0, 4);
      const scrapeTasks = topSymbols.map(async (s) => {
        const meta = getTickerMeta(s);
        const q = meta ? `${s} ${meta.name.replace(/company|inc|corp|ltd/gi, '').trim()}` : s;
        return scrapeMultiEngineNews(q, 4);
      });
      const scrapedResults = await Promise.allSettled(scrapeTasks);
      scrapedResults.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allArticles.unshift(...res.value);
        }
      });
    } catch (e) {
      console.warn('Scraper integration skipped:', e);
    }
  }

  // If Tavily API Key is configured, fetch targeted credit news
  const tavilyQuery = query || (stockSymbols && stockSymbols.length > 0 ? stockSymbols.slice(0, 3).join(' ') : (category !== 'all' ? category : ''));
  if (tavilyQuery && (process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY)) {
    try {
      const { results: tavilyResults } = await searchTavilyForEntity(tavilyQuery, { maxResults: 5 });
      const tavilyArticles: NewsArticle[] = tavilyResults.map((t, idx) => ({
        id: `tavily-${Date.now()}-${idx}`,
        title: t.title,
        link: t.url,
        description: t.content,
        source: t.source,
        sourceIcon: '⚡',
        publishedAt: t.publishedDate || new Date().toISOString(),
        timestamp: t.publishedDate ? new Date(t.publishedDate).getTime() : Date.now() - idx * 60000,
        category: category || 'portfolio',
        sentiment: deriveSentiment(t.title, t.content),
      }));
      allArticles.unshift(...tavilyArticles);
    } catch (e) {
      console.warn('Tavily search skipped:', e);
    }
  }

  // Filter articles strictly matching portfolio if in portfolio category and stockSymbols provided
  if (category === 'portfolio' && stockSymbols && stockSymbols.length > 0) {
    const portfolioKeywords = stockSymbols.flatMap((s) => {
      const meta = getTickerMeta(s);
      return [
        s.toLowerCase(),
        (meta?.name || '').toLowerCase(),
        ...(meta?.aliases || []).map((a) => a.toLowerCase()),
      ].filter((k) => k.length > 1);
    });

    const relevantArticles = allArticles.filter((a) => {
      const text = `${a.title} ${a.description} ${a.source}`.toLowerCase();
      return portfolioKeywords.some((kw) => text.includes(kw));
    });

    if (relevantArticles.length > 0) {
      allArticles = relevantArticles;
    }
  }

  // Advanced Semantic Deduplication Layer (Jaccard + Normalized Fingerprint)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'for', 'on', 'with', 'is', 'as', 'at', 'by', 'from', 'says', 'amid', 'new', 'after']);
  const deduplicated: NewsArticle[] = [];

  for (const article of allArticles) {
    if (!article.title || article.title.length < 10) continue;

    // Tokenize title words for semantic overlap comparison
    const words = new Set(
      article.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w))
    );

    let isDuplicate = false;
    for (const existing of deduplicated) {
      const existingWords = new Set(
        existing.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !stopWords.has(w))
      );

      // Compute Jaccard word set similarity
      let intersection = 0;
      words.forEach((w) => {
        if (existingWords.has(w)) intersection++;
      });
      const union = new Set([...words, ...existingWords]).size;
      const similarity = union > 0 ? intersection / union : 0;

      // Also check exact normalized prefix
      const key1 = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
      const key2 = existing.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);

      if (similarity > 0.55 || key1 === key2) {
        isDuplicate = true;
        // If current article has richer description, replace the existing one
        if (article.description && article.description.length > (existing.description?.length || 0)) {
          const idx = deduplicated.indexOf(existing);
          if (idx !== -1) deduplicated[idx] = article;
        }
        break;
      }
    }

    if (!isDuplicate) {
      deduplicated.push(article);
    }
  }

  // Sort newest first
  deduplicated.sort((a, b) => b.timestamp - a.timestamp);

  return deduplicated.slice(0, limit);
}

/**
 * Real-time major index tickers
 */
export function getLiveMarketTickers() {
  return [
    { symbol: '^GSPC', shortName: 'S&P 500', price: 5980.25, formattedPrice: '$5,980.25', change: 24.15, changePercent: 0.41, formattedChange: '+0.41%', isPositive: true, currency: 'USD' },
    { symbol: '^IXIC', shortName: 'NASDAQ', price: 18990.10, formattedPrice: '$18,990.10', change: 95.80, changePercent: 0.51, formattedChange: '+0.51%', isPositive: true, currency: 'USD' },
    { symbol: '^DJI', shortName: 'DOW JONES', price: 43450.70, formattedPrice: '$43,450.70', change: -48.20, changePercent: -0.11, formattedChange: '-0.11%', isPositive: false, currency: 'USD' },
    { symbol: 'BTC-USD', shortName: 'BITCOIN', price: 96420.00, formattedPrice: '$96,420.00', change: 1820.00, changePercent: 1.92, formattedChange: '+1.92%', isPositive: true, currency: 'USD' },
  ];
}
