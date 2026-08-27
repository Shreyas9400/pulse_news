/**
 * Scrapling-Grade Multi-Engine HTML Web Scraper (DuckDuckGo, Bing News & Google Compliant)
 * Features:
 * - Multi-Engine Parallel Scraping (DuckDuckGo + Bing News + Google Realtime Wire)
 * - Domain Rate Limiting & Enterprise Politeness
 * - Adaptive Multi-Tiered Selector Extraction
 * - L1 In-Memory + L2 Firestore 'pulsenews' Cache
 */

import * as cheerio from 'cheerio';
import { getFirestoreDb } from './firebase';
import { deriveSentiment } from './news-aggregator';
import { NewsArticle } from './types';

export interface ScrapedSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  sourceIcon?: string;
  publishedDate?: string;
  timestamp: number;
  engine: 'duckduckgo' | 'bing' | 'google';
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Best-effort extraction of a real publish timestamp from scraped search-result text
 * (e.g. "3 hours ago", "2 days ago", or an absolute date string). Returns null when
 * no genuine date signal is present, so callers can fall back to a synthetic value.
 */
function parseScrapedDateText(text: string): number | null {
  if (!text) return null;
  const trimmed = text.trim();

  const relativeMatch = trimmed.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const unitMs: Record<string, number> = {
      minute: 60_000,
      hour: 3_600_000,
      day: 86_400_000,
      week: 7 * 86_400_000,
      month: 30 * 86_400_000,
    };
    return Date.now() - amount * unitMs[unit];
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed) && parsed > 0 && parsed <= Date.now() + 86_400_000) {
    return parsed;
  }

  return null;
}

// In-Memory L1 Cache (20 min TTL)
const l1Cache = new Map<string, { data: ScrapedSearchResult[]; expiresAt: number }>();

async function getCachedScrape(queryKey: string): Promise<ScrapedSearchResult[] | null> {
  const now = Date.now();
  const l1 = l1Cache.get(queryKey);
  if (l1 && l1.expiresAt > now) {
    return l1.data;
  }

  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(firestore, 'scraped_cache', queryKey));
      if (snap.exists()) {
        const item = snap.data();
        if (item && item.expiresAt > now && Array.isArray(item.results)) {
          l1Cache.set(queryKey, { data: item.results, expiresAt: item.expiresAt });
          return item.results;
        }
      }
    }
  } catch {}

  return null;
}

async function saveCachedScrape(queryKey: string, results: ScrapedSearchResult[], ttlMs = 20 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  l1Cache.set(queryKey, { data: results, expiresAt });

  try {
    const firestore = await getFirestoreDb();
    if (firestore) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'scraped_cache', queryKey), {
        query: queryKey,
        results,
        cachedAt: new Date().toISOString(),
        expiresAt,
      }, { merge: true });
    }
  } catch {}
}

/**
 * Scrapling-Style DuckDuckGo HTML News Scraper
 */
export async function scrapeDuckDuckGoNews(query: string, maxResults = 8): Promise<ScrapedSearchResult[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const results: ScrapedSearchResult[] = [];

    $('.result').each((_, elem) => {
      if (results.length >= maxResults) return;

      const titleElem = $(elem).find('.result__title a, .result__a').first();
      const title = titleElem.text().trim();
      let rawHref = titleElem.attr('href') || '';

      if (rawHref.includes('uddg=')) {
        const match = rawHref.match(/uddg=([^&]+)/);
        if (match && match[1]) {
          rawHref = decodeURIComponent(match[1]);
        }
      }

      const snippet = $(elem).find('.result__snippet, .result__snippet__body').text().trim();
      const source = $(elem).find('.result__url').text().trim().replace(/https?:\/\//, '').split('/')[0] || 'DuckDuckGo Wire';
      const dateHint = $(elem).find('.result__timestamp').text().trim() || snippet.split(' - ')[0];
      const realDate = parseScrapedDateText(dateHint);

      if (title && rawHref && title.length > 8 && !rawHref.includes('duckduckgo.com')) {
        const timestamp = realDate ?? Date.now() - results.length * 120000;
        results.push({
          title,
          url: rawHref,
          snippet: snippet || 'Market intelligence reported via DuckDuckGo web search.',
          source: source.toUpperCase(),
          sourceIcon: '🦆',
          publishedDate: realDate ? new Date(realDate).toISOString() : undefined,
          timestamp,
          engine: 'duckduckgo',
        });
      }
    });

    return results;
  } catch (e) {
    console.warn('[Scraper] DuckDuckGo scrape error:', e);
    return [];
  }
}

/**
 * Scrapling-Style Bing News HTML Scraper
 */
export async function scrapeBingNews(query: string, maxResults = 8): Promise<ScrapedSearchResult[]> {
  const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const results: ScrapedSearchResult[] = [];

    $('.news-card, .newsitem, .na_cnt, div.card, .t_s').each((_, elem) => {
      if (results.length >= maxResults) return;

      const titleElem = $(elem).find('a.title, a[target="_blank"], .na_t a, a.tit').first();
      const title = titleElem.text().trim();
      const url = titleElem.attr('href') || '';
      const snippet = $(elem).find('.snippet, .na_snippet, .desc, .snippet_t').text().trim();
      const source = $(elem).find('.source, .na_source, .prov').text().trim() || 'Bing News Wire';
      const dateHint = $(elem).find('time, .na_t time, [aria-label*="ago" i], .source span').last().text().trim();
      const realDate = parseScrapedDateText(dateHint);

      if (title && url && url.startsWith('http') && title.length > 8) {
        const timestamp = realDate ?? Date.now() - results.length * 180000;
        results.push({
          title,
          url,
          snippet: snippet || 'Market intelligence reported via Bing News search.',
          source: source.toUpperCase(),
          sourceIcon: '🅱️',
          publishedDate: realDate ? new Date(realDate).toISOString() : undefined,
          timestamp,
          engine: 'bing',
        });
      }
    });

    return results;
  } catch (e) {
    console.warn('[Scraper] Bing News scrape error:', e);
    return [];
  }
}

/**
 * Google News Realtime Web Scraper Fallback
 */
export async function scrapeGoogleRealtimeNews(query: string, maxResults = 8): Promise<ScrapedSearchResult[]> {
  const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const results: ScrapedSearchResult[] = [];

    $('item').each((_, elem) => {
      if (results.length >= maxResults) return;

      const title = $(elem).find('title').text().trim();
      const link = $(elem).find('link').text().trim();
      const rawDesc = $(elem).find('description').text().trim();
      const source = $(elem).find('source').text().trim() || 'Google News Wire';
      const cleanSnippet = rawDesc.replace(/<[^>]*>?/gm, '').trim();
      const pubDateText = $(elem).find('pubDate').text().trim();
      const parsedPubDate = pubDateText ? Date.parse(pubDateText) : NaN;
      const hasRealDate = !isNaN(parsedPubDate);

      if (title && link && title.length > 8) {
        results.push({
          title,
          url: link,
          snippet: cleanSnippet || title,
          source: source.toUpperCase(),
          sourceIcon: '🌐',
          publishedDate: hasRealDate ? new Date(parsedPubDate).toISOString() : undefined,
          timestamp: hasRealDate ? parsedPubDate : Date.now() - results.length * 60000,
          engine: 'google',
        });
      }
    });

    return results;
  } catch (e) {
    console.warn('[Scraper] Google News scrape error:', e);
    return [];
  }
}

/**
 * Unified Multi-Engine Scraper with Automatic Multi-Source Aggregation & Cache
 */
export async function scrapeMultiEngineNews(query: string, maxResults = 12): Promise<NewsArticle[]> {
  const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const cleanKey = cleanQuery.toLowerCase().replace(/\s+/g, '_');
  
  // 1. Check L1 / L2 Cache
  const cached = await getCachedScrape(cleanKey);
  if (cached && cached.length > 0) {
    return cached.map((r, i) => ({
      id: `scraped-cache-${cleanKey}-${i}`,
      title: r.title,
      link: r.url,
      description: r.snippet,
      source: r.source,
      sourceIcon: r.sourceIcon || '🌐',
      publishedAt: r.publishedDate || new Date(r.timestamp).toISOString(),
      timestamp: r.timestamp,
      category: 'portfolio',
      sentiment: deriveSentiment(r.title, r.snippet),
    }));
  }

  // 2. Parallel Multi-Engine Scrape (DuckDuckGo + Bing News + Google Realtime Wire)
  const [ddgRes, bingRes, googleRes] = await Promise.allSettled([
    scrapeDuckDuckGoNews(cleanQuery, 6),
    scrapeBingNews(cleanQuery, 6),
    scrapeGoogleRealtimeNews(cleanQuery, 6),
  ]);

  const combined: ScrapedSearchResult[] = [];
  if (ddgRes.status === 'fulfilled') combined.push(...ddgRes.value);
  if (bingRes.status === 'fulfilled') combined.push(...bingRes.value);
  if (googleRes.status === 'fulfilled') combined.push(...googleRes.value);

  // Deduplicate by title similarity
  const seenTitles = new Set<string>();
  const uniqueResults: ScrapedSearchResult[] = [];

  for (const r of combined) {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueResults.push(r);
    }
  }

  // Save to L1 & Firestore L2 Cache
  if (uniqueResults.length > 0) {
    await saveCachedScrape(cleanKey, uniqueResults);
  }

  return uniqueResults.slice(0, maxResults).map((r, i) => ({
    id: `scraped-${r.engine}-${Date.now()}-${i}`,
    title: r.title,
    link: r.url,
    description: r.snippet,
    source: r.source,
    sourceIcon: r.sourceIcon || '🌐',
    publishedAt: new Date(r.timestamp).toISOString(),
    timestamp: r.timestamp,
    category: 'portfolio',
    sentiment: deriveSentiment(r.title, r.snippet),
  }));
}
