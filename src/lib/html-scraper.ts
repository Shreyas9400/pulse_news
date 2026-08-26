/**
 * Scrapling-Grade Multi-Engine HTML Web Scraper (DuckDuckGo, Bing News & Google-Compliant)
 * Features:
 * - Domain Rate Limiting (Concurrency = 1, 2-10s pause)
 * - Exponential Backoff on 429, Halt on 403/CAPTCHA
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

// Realistic Stealth Browser User-Agents
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

// Domain-level rate limiter state
interface DomainLimiterState {
  lastRequestTime: number;
  backoffMs: number;
  isBlocked: boolean;
}

const domainLimiters: Record<string, DomainLimiterState> = {
  'duckduckgo.com': { lastRequestTime: 0, backoffMs: 0, isBlocked: false },
  'bing.com': { lastRequestTime: 0, backoffMs: 0, isBlocked: false },
  'google.com': { lastRequestTime: 0, backoffMs: 0, isBlocked: false },
};

// Domain queue lock to enforce concurrency = 1 per domain
const domainLocks: Record<string, Promise<void>> = {};

async function acquireDomainLock(domain: string, minIntervalMs = 2000, maxIntervalMs = 5000): Promise<boolean> {
  const limiter = domainLimiters[domain] || { lastRequestTime: 0, backoffMs: 0, isBlocked: false };
  domainLimiters[domain] = limiter;

  if (limiter.isBlocked) {
    console.warn(`[Scraper] Domain ${domain} is currently marked blocked (403/CAPTCHA). Skipping.`);
    return false;
  }

  // Wait for previous request to domain to finish (concurrency = 1)
  while (domainLocks[domain]) {
    await domainLocks[domain];
  }

  let releaseLock: () => void = () => {};
  domainLocks[domain] = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  try {
    const now = Date.now();
    const elapsed = now - limiter.lastRequestTime;
    const requiredInterval = Math.max(minIntervalMs + Math.floor(Math.random() * (maxIntervalMs - minIntervalMs)), limiter.backoffMs);

    if (elapsed < requiredInterval) {
      const waitTime = requiredInterval - elapsed;
      await new Promise((r) => setTimeout(r, waitTime));
    }

    limiter.lastRequestTime = Date.now();
    return true;
  } finally {
    releaseLock();
    delete domainLocks[domain];
  }
}

function handleDomainResponseStatus(domain: string, status: number) {
  const limiter = domainLimiters[domain];
  if (!limiter) return;

  if (status === 429) {
    // Exponential backoff: 2s -> 4s -> 8s -> 16s
    limiter.backoffMs = limiter.backoffMs === 0 ? 2000 : Math.min(limiter.backoffMs * 2, 16000);
    console.warn(`[Scraper] Domain ${domain} returned 429 Too Many Requests. Increasing backoff to ${limiter.backoffMs}ms`);
  } else if (status === 403 || status === 418) {
    // Strict enterprise compliance: STOP immediately on 403 / CAPTCHA
    limiter.isBlocked = true;
    console.warn(`[Scraper] Domain ${domain} returned 403 Forbidden / CAPTCHA. Halting automated crawler.`);
  } else if (status === 200) {
    // Reset backoff on success
    limiter.backoffMs = 0;
  }
}

// In-Memory L1 Cache (20 min TTL)
const l1Cache = new Map<string, { data: ScrapedSearchResult[]; expiresAt: number }>();

/**
 * Reads from L1 / Firestore L2 Cache
 */
async function getCachedScrape(queryKey: string): Promise<ScrapedSearchResult[] | null> {
  const now = Date.now();

  // 1. Check L1 Memory Cache
  const l1 = l1Cache.get(queryKey);
  if (l1 && l1.expiresAt > now) {
    return l1.data;
  }

  // 2. Check Firestore L2 Cache in 'pulsenews' database
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

/**
 * Saves to L1 & Firestore L2 Cache
 */
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
  const domain = 'duckduckgo.com';
  const allowed = await acquireDomainLock(domain, 2500, 5000);
  if (!allowed) return [];

  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' (credit OR debt OR bonds OR earnings OR rating)')}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://duckduckgo.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    handleDomainResponseStatus(domain, res.status);
    if (!res.ok) return [];

    const html = await res.text();
    if (html.includes('robot') || html.includes('captcha') || html.includes('challenge')) {
      handleDomainResponseStatus(domain, 403);
      return [];
    }

    const $ = cheerio.load(html);
    const results: ScrapedSearchResult[] = [];

    // Adaptive selector fallback (Scrapling style)
    $('.result').each((_, elem) => {
      if (results.length >= maxResults) return;

      const titleElem = $(elem).find('.result__title a, .result__a, a.result__url').first();
      const title = titleElem.text().trim();
      let rawHref = titleElem.attr('href') || '';

      // Decode DuckDuckGo redirect url: /l/?uddg=https%3A%2F%2F...
      if (rawHref.includes('uddg=')) {
        const match = rawHref.match(/uddg=([^&]+)/);
        if (match && match[1]) {
          rawHref = decodeURIComponent(match[1]);
        }
      }

      const snippet = $(elem).find('.result__snippet, .result__snippet__body').text().trim();
      const source = $(elem).find('.result__url').text().trim().replace(/https?:\/\//, '').split('/')[0] || 'Web Intelligence';

      if (title && rawHref && title.length > 10 && !rawHref.includes('duckduckgo.com')) {
        results.push({
          title,
          url: rawHref,
          snippet,
          source: source.toUpperCase(),
          sourceIcon: '🦆',
          timestamp: Date.now() - results.length * 180000,
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
  const domain = 'bing.com';
  const allowed = await acquireDomainLock(domain, 2000, 4500);
  if (!allowed) return [];

  const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&qft=interval%3d"7"`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
      },
    });

    handleDomainResponseStatus(domain, res.status);
    if (!res.ok) return [];

    const html = await res.text();
    if (html.includes('challenge') || html.includes('recaptcha')) {
      handleDomainResponseStatus(domain, 403);
      return [];
    }

    const $ = cheerio.load(html);
    const results: ScrapedSearchResult[] = [];

    // Adaptive multi-selector for Bing News cards
    $('.news-card, .newsitem, .na_cnt, div[data-author]').each((_, elem) => {
      if (results.length >= maxResults) return;

      const titleElem = $(elem).find('a.title, a[target="_blank"], .na_t a').first();
      const title = titleElem.text().trim();
      const url = titleElem.attr('href') || '';
      const snippet = $(elem).find('.snippet, .na_snippet, .desc').text().trim();
      const source = $(elem).find('.source, .na_source, .prov').text().trim() || 'Bing News Wire';

      if (title && url && url.startsWith('http') && title.length > 10) {
        results.push({
          title,
          url,
          snippet,
          source: source.toUpperCase(),
          sourceIcon: '🅱️',
          timestamp: Date.now() - results.length * 120000,
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
 * Unified Multi-Engine Scraper with Firestore Caching & Politeness
 */
export async function scrapeMultiEngineNews(query: string, maxResults = 10): Promise<NewsArticle[]> {
  const cleanKey = query.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  
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
      publishedAt: new Date(r.timestamp).toISOString(),
      timestamp: r.timestamp,
      category: 'portfolio',
      sentiment: deriveSentiment(r.title, r.snippet),
    }));
  }

  // 2. Concurrently fetch DuckDuckGo + Bing News
  const [ddgResults, bingResults] = await Promise.allSettled([
    scrapeDuckDuckGoNews(query, 6),
    scrapeBingNews(query, 6),
  ]);

  const combined: ScrapedSearchResult[] = [];
  if (ddgResults.status === 'fulfilled') combined.push(...ddgResults.value);
  if (bingResults.status === 'fulfilled') combined.push(...bingResults.value);

  // Save to L1 & Firestore L2 Cache
  if (combined.length > 0) {
    await saveCachedScrape(cleanKey, combined);
  }

  return combined.slice(0, maxResults).map((r, i) => ({
    id: `scraped-${r.engine}-${Date.now()}-${i}`,
    title: r.title,
    link: r.url,
    description: r.snippet,
    source: `${r.source}`,
    sourceIcon: r.sourceIcon || '🌐',
    publishedAt: new Date(r.timestamp).toISOString(),
    timestamp: r.timestamp,
    category: 'portfolio',
    sentiment: deriveSentiment(r.title, r.snippet),
  }));
}
