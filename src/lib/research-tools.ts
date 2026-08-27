/**
 * Unified Research Tools Facade
 * Provider-agnostic interface over search engines, scrapers, SEC EDGAR, and market data.
 */

import { scrapeMultiEngineNews, ScrapedSearchResult } from './html-scraper';
import { searchTavilyForEntity, TavilySearchResult } from './tavily';
import { fetchSecFilings, resolveCik, SecFiling } from './sec-edgar';
import { fetchLiveStockQuote } from './stock-service';
import { getAggregatedNews } from './news-aggregator';
import { EvidenceItem, SourceTier, EvidenceType } from './types';
import { buildEvidenceItem, detectSourceTier, scoreEvidenceAuthority } from './evidence-engine';

export interface ToolSearchOptions {
  query: string;
  entityId?: string;
  sourcePreference?: 'PRIMARY' | 'JOURNALISM' | 'MARKET' | 'ALL';
  maxResults?: number;
  dateRange?: string;
  forceFresh?: boolean;
}

export class ResearchTools {
  /**
   * Multi-provider web and market search
   */
  public static async searchWeb(options: ToolSearchOptions): Promise<EvidenceItem[]> {
    const { query, entityId = 'GENERAL', maxResults = 8, forceFresh = false } = options;
    const cleanQuery = query.trim();

    const evidenceList: EvidenceItem[] = [];

    // 1. Try Tavily AI Search first if API key available
    try {
      const tavilyRes = await searchTavilyForEntity(cleanQuery, { forceFresh, maxResults });
      if (tavilyRes.results && tavilyRes.results.length > 0) {
        for (const item of tavilyRes.results) {
          evidenceList.push(
            buildEvidenceItem({
              sourceUrl: item.url,
              sourceName: item.source,
              snippet: item.content || item.title,
              publishedAt: item.publishedDate || new Date().toISOString(),
              publisher: item.source,
              entityId,
            })
          );
        }
      }
    } catch (e) {
      console.warn('[ResearchTools] Tavily search fallback:', e);
    }

    // 2. Parallel Multi-Engine HTML Scraper (DuckDuckGo + Bing + Google Wire)
    if (evidenceList.length < maxResults) {
      try {
        const scrapedArticles = await scrapeMultiEngineNews(cleanQuery, maxResults);
        for (const art of scrapedArticles) {
          evidenceList.push(
            buildEvidenceItem({
              sourceUrl: art.link,
              sourceName: art.source,
              snippet: `${art.title} - ${art.description}`,
              publishedAt: art.publishedAt,
              publisher: art.source,
              entityId,
            })
          );
        }
      } catch (e) {
        console.warn('[ResearchTools] HTML scraper fallback:', e);
      }
    }

    return evidenceList.slice(0, maxResults);
  }

  /**
   * Primary source search targeting SEC EDGAR filings
   */
  public static async fetchPrimarySEC(tickerOrCik: string, formFilter = 'ALL'): Promise<EvidenceItem[]> {
    const resolvedCik = resolveCik(tickerOrCik);
    if (!resolvedCik) return [];

    try {
      const secData = await fetchSecFilings(resolvedCik, formFilter);
      return (secData.filings || []).slice(0, 10).map((f) => {
        return buildEvidenceItem({
          sourceUrl: f.documentUrl,
          sourceName: `SEC EDGAR Form ${f.form}`,
          snippet: `[${f.form} Filed ${f.filingDate}] ${f.primaryDocDescription}: ${f.creditRiskTakeaway || 'Official regulatory disclosure'}`,
          publishedAt: f.filingDate,
          publisher: 'SEC.GOV',
          sourceTier: 'TIER_1_PRIMARY',
          evidenceType: 'PRIMARY_FACT',
          entityId: tickerOrCik,
        });
      });
    } catch (e) {
      console.warn('[ResearchTools] SEC fetch error:', e);
      return [];
    }
  }

  /**
   * Fetches RSS feed intelligence
   */
  public static async fetchRSSNews(category = 'all', limit = 15): Promise<EvidenceItem[]> {
    try {
      const articles = await getAggregatedNews({ category, limit });
      return articles.map((art) =>
        buildEvidenceItem({
          sourceUrl: art.link,
          sourceName: art.source,
          snippet: `${art.title} - ${art.description}`,
          publishedAt: art.publishedAt,
          publisher: art.source,
          entityId: 'RSS_FEED',
        })
      );
    } catch (e) {
      console.warn('[ResearchTools] RSS news error:', e);
      return [];
    }
  }

  /**
   * Live stock / market snapshot
   */
  public static async fetchMarketData(ticker: string) {
    return await fetchLiveStockQuote(ticker);
  }
}
