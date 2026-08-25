import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { NewsArticle, StockQuote, StockTickerItem } from './types';
import { RSS_SOURCES, getCustomSearchRssUrl, getYahooStockRssUrl, RssSource } from './rss-sources';
import { buildEnhancedSearchQuery, buildPortfolioCombinedQuery } from './stock-aliases';
import { searchTavilyCreditNews } from './tavily';

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
function deriveSentiment(title: string, desc: string): 'positive' | 'neutral' | 'negative' {
  const combined = (title + ' ' + desc).toLowerCase();
  const positiveWords = ['surge', 'jump', 'gains', 'record high', 'breakthrough', 'profit', 'rally', 'boost', 'soars', 'win', 'success', 'growth', 'optimism', 'advances'];
  const negativeWords = ['slump', 'crash', 'falls', 'war', 'crisis', 'drop', 'inflation', 'loss', 'recession', 'warning', 'layoffs', 'threat', 'plunge', 'decline', 'attack'];

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
 * Extract ticker symbol if article mentions common stock symbols or comes from Yahoo Finance
 */
function extractTicker(title: string): { symbol: string; change?: string } | undefined {
  const match = title.match(/\b([A-Z]{2,5})\b(?:\s*[:\-]\s*|\s+(?:shares|stock|soars|drops|rallies))/);
  if (match && ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD', 'SPY', 'QQQ', 'BTC'].includes(match[1])) {
    return { symbol: match[1] };
  }
  return undefined;
}

/**
 * Fetches and normalizes a single RSS source
 */
export async function fetchFeed(source: RssSource): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    if (!feed.items || feed.items.length === 0) return [];

    return feed.items.slice(0, 15).map((rawItem, idx) => {
      const item = rawItem as any;
      const title = (item.title || 'Untitled Article').trim();
      const rawDesc = item.contentSnippet || item.summary || item.description || '';
      const description = cleanDescription(rawDesc);
      const imageUrl = extractImageUrl(item, rawDesc);
      const link = item.link || item.guid || '#';
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      const timestamp = new Date(pubDate).getTime() || Date.now();

      return {
        id: `${source.id}-${timestamp}-${idx}`,
        title,
        link,
        description: description || title,
        source: source.name,
        sourceIcon: source.icon,
        publishedAt: pubDate,
        timestamp,
        category: source.category,
        imageUrl,
        author: item.creator || item.author,
        sentiment: deriveSentiment(title, description),
        stockTicker: extractTicker(title),
      };
    });
  } catch (error) {
    console.warn(`[NewsAggregator] Error fetching feed ${source.name} (${source.url}):`, error);
    return [];
  }
}

/**
 * Fetch all articles across selected category or custom query
 */
export async function getAggregatedNews(options?: {
  category?: string;
  query?: string;
  stockSymbols?: string[];
  limit?: number;
}): Promise<NewsArticle[]> {
  const { category = 'all', query, stockSymbols, limit = 50 } = options || {};

  let sourcesToFetch: RssSource[] = [];

  if (query && query.trim().length > 0) {
    sourcesToFetch = [
      {
        id: `search-${encodeURIComponent(query)}`,
        name: `Topic: "${query}"`,
        url: getCustomSearchRssUrl(query),
        category: 'tech',
        icon: '🔍',
      },
    ];
  } else if (stockSymbols && stockSymbols.length > 0) {
    // 1. Yahoo Finance RSS for the symbols
    sourcesToFetch.push({
      id: 'yahoo-custom-stocks',
      name: 'Yahoo Finance Portfolio',
      url: getYahooStockRssUrl(stockSymbols),
      category: 'portfolio',
      icon: '📈',
      isFinancialTicker: true,
    });

    // 2. Enhanced Boolean Search Operator Feed combining company aliases & executive names
    if (stockSymbols.length === 1) {
      const enhancedQuery = buildEnhancedSearchQuery(stockSymbols[0]);
      sourcesToFetch.push({
        id: `enhanced-query-${encodeURIComponent(stockSymbols[0])}`,
        name: `${stockSymbols[0]} Intelligence Wire`,
        url: getCustomSearchRssUrl(enhancedQuery),
        category: 'portfolio',
        icon: '⚡',
      });
    } else {
      const combinedPortfolioQuery = buildPortfolioCombinedQuery(stockSymbols);
      sourcesToFetch.push({
        id: 'portfolio-combined-wire',
        name: 'Portfolio Intelligence Wire',
        url: getCustomSearchRssUrl(combinedPortfolioQuery),
        category: 'portfolio',
        icon: '⚡',
      });
    }
  } else if (category === 'all') {
    sourcesToFetch = RSS_SOURCES;
  } else {
    sourcesToFetch = RSS_SOURCES.filter(s => s.category === category);
  }

  // Fetch concurrently with Promise.allSettled
  const results = await Promise.allSettled(sourcesToFetch.map(s => fetchFeed(s)));
  let allArticles: NewsArticle[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled') {
      allArticles.push(...res.value);
    }
  }

  // If Tavily API Key is configured, fetch real-time fixed income & credit intelligence
  const tavilyQuery = query || (stockSymbols && stockSymbols.length > 0 ? stockSymbols.join(' ') : (category !== 'all' ? category : ''));
  if (tavilyQuery && (process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY)) {
    try {
      const tavilyResults = await searchTavilyCreditNews(tavilyQuery, { maxResults: 6 });
      const tavilyArticles: NewsArticle[] = tavilyResults.map((t, idx) => ({
        id: `tavily-${Date.now()}-${idx}`,
        title: t.title,
        link: t.url,
        description: t.content,
        source: new URL(t.url).hostname.replace('www.', ''),
        sourceIcon: '📑',
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

  // Fallback data if network is offline or blocked
  if (allArticles.length === 0) {
    allArticles = getFallbackNews();
  }

  // Deduplicate by similar titles (ignoring punctuation & case)
  const seenTitles = new Set<string>();
  const deduplicated: NewsArticle[] = [];

  for (const article of allArticles) {
    const key = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 40);

    if (!seenTitles.has(key) && article.title.length > 10) {
      seenTitles.add(key);
      deduplicated.push(article);
    }
  }

  // Sort newest first
  deduplicated.sort((a, b) => b.timestamp - a.timestamp);

  return deduplicated.slice(0, limit);
}

/**
 * Returns mock/fallback news if external feeds fail or when testing offline
 */
export function getFallbackNews(): NewsArticle[] {
  const now = Date.now();
  return [
    {
      id: 'mock-1',
      title: 'Global Markets Rally as Tech Giants Unveil Next-Gen Generative AI Infrastructure',
      link: 'https://finance.yahoo.com',
      description: 'Major global indexes rose today led by semiconductor and cloud computing rallies following breakthroughs in server power efficiency and model training speed.',
      source: 'Yahoo Finance',
      sourceIcon: '📈',
      publishedAt: new Date(now - 1000 * 60 * 15).toISOString(),
      timestamp: now - 1000 * 60 * 15,
      category: 'markets',
      sentiment: 'positive',
      stockTicker: { symbol: 'NVDA', change: '+3.4%' },
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mock-2',
      title: 'Open Source AI Models Reach New Benchmark Milestones in Code and Reasoning',
      link: 'https://techcrunch.com',
      description: 'Developers celebrate as new open weight reasoning architectures demonstrate parity with leading closed frontier systems while running on consumer hardware.',
      source: 'TechCrunch',
      sourceIcon: '⚡',
      publishedAt: new Date(now - 1000 * 60 * 35).toISOString(),
      timestamp: now - 1000 * 60 * 35,
      category: 'ai',
      sentiment: 'positive',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mock-3',
      title: 'Central Banks Signal Potential Shifts in Monetary Policy as Inflation Stabilizes',
      link: 'https://www.reuters.com',
      description: 'Federal Reserve and ECB officials indicated in their latest economic outlook that steadying labor markets create room for calibrated rate adjustments.',
      source: 'Reuters',
      sourceIcon: '🏛️',
      publishedAt: new Date(now - 1000 * 60 * 60).toISOString(),
      timestamp: now - 1000 * 60 * 60,
      category: 'business',
      sentiment: 'neutral',
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mock-4',
      title: 'James Webb Telescope Captures Unprecedented Atmospheric Details of Exoplanet',
      link: 'https://www.nasa.gov',
      description: 'Astronomers revealed high-resolution spectroscopic signatures of carbon dioxide and water vapor on a super-Earth located 70 light-years away.',
      source: 'NASA Breaking News',
      sourceIcon: '🚀',
      publishedAt: new Date(now - 1000 * 60 * 95).toISOString(),
      timestamp: now - 1000 * 60 * 95,
      category: 'science',
      sentiment: 'positive',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    },
  ];
}

/**
 * Returns fallback market overview ticker dataset
 */
export function getLiveMarketTickers(): StockQuote[] {
  return [
    { symbol: '^GSPC', shortName: 'S&P 500', price: 7677.28, formattedPrice: '$7,677.28', change: 24.42, changePercent: 0.32, formattedChange: '+0.32%', isPositive: true, currency: 'USD' },
    { symbol: '^IXIC', shortName: 'Nasdaq', price: 21550.10, formattedPrice: '$21,550.10', change: 110.20, changePercent: 0.51, formattedChange: '+0.51%', isPositive: true, currency: 'USD' },
    { symbol: '^DJI', shortName: 'Dow Jones', price: 44250.50, formattedPrice: '$44,250.50', change: 80.15, changePercent: 0.18, formattedChange: '+0.18%', isPositive: true, currency: 'USD' },
    { symbol: 'NVDA', shortName: 'NVIDIA Corp', price: 213.05, formattedPrice: '$213.05', change: 4.57, changePercent: 2.19, formattedChange: '+2.19%', isPositive: true, currency: 'USD' },
    { symbol: 'AAPL', shortName: 'Apple Inc', price: 309.90, formattedPrice: '$309.90', change: -0.44, changePercent: -0.14, formattedChange: '-0.14%', isPositive: false, currency: 'USD' },
    { symbol: 'MSFT', shortName: 'Microsoft Corp', price: 491.71, formattedPrice: '$491.71', change: 4.40, changePercent: 0.90, formattedChange: '+0.90%', isPositive: true, currency: 'USD' },
    { symbol: 'TSLA', shortName: 'Tesla Inc', price: 350.25, formattedPrice: '$350.25', change: 1.30, changePercent: 0.37, formattedChange: '+0.37%', isPositive: true, currency: 'USD' },
    { symbol: 'BTC-USD', shortName: 'Bitcoin USD', price: 78586.50, formattedPrice: '$78,586.50', change: -395.77, changePercent: -0.50, formattedChange: '-0.50%', isPositive: false, currency: 'USD' },
  ];
}
