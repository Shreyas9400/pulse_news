'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StockQuote, NewsArticle } from '@/lib/types';
import { getTickerMeta, getSymbolDisplayInfo } from '@/lib/stock-aliases';
import { SecFiling, resolveCik } from '@/lib/sec-edgar';
import { analyzeEntityBatch, EntityCreditDossierAnalysis } from '@/lib/gemini';
import {
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  BookOpen,
  ExternalLink,
  Search,
  Activity,
  BarChart3,
  FileText,
  Clock,
  RefreshCw,
  Landmark,
  Scale,
  AlertOctagon,
  Zap,
  Globe,
  Bell,
  History,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface EntityDossierModalProps {
  symbol: string | null;
  quote?: StockQuote;
  articles: NewsArticle[];
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
  onFilterHomeFeed: (symbol: string) => void;
}

export default function EntityDossierModal({
  symbol,
  quote,
  articles,
  isOpen,
  onClose,
  onSelectArticle,
  onFilterHomeFeed,
}: EntityDossierModalProps) {
  const [activeTab, setActiveTab] = useState<'credit_dossier' | 'sec_filings' | 'news_wire' | 'web_scraped'>('credit_dossier');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('ALL');
  const [filings, setFilings] = useState<SecFiling[]>([]);
  const [isLoadingFilings, setIsLoadingFilings] = useState<boolean>(false);
  const [filingsNotice, setFilingsNotice] = useState<string | null>(null);
  const [companyCik, setCompanyCik] = useState<string | null>(null);

  // Multi-Engine Scraped Articles state
  const [scrapedArticles, setScrapedArticles] = useState<NewsArticle[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeCompleted, setScrapeCompleted] = useState<boolean>(false);

  // AI Structured Analysis & Memory state
  const [aiAnalysis, setAiAnalysis] = useState<EntityCreditDossierAnalysis | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Tavily on-demand state
  const [tavilyArticles, setTavilyArticles] = useState<NewsArticle[]>([]);
  const [isFetchingTavily, setIsFetchingTavily] = useState<boolean>(false);

  const cleanSym = symbol ? symbol.toUpperCase() : '';
  const meta = cleanSym ? getTickerMeta(cleanSym) : null;
  const info = cleanSym ? getSymbolDisplayInfo(cleanSym) : { name: '', industry: '', aliases: [], isSector: false };

  // Filter matching RSS articles for this entity
  const matchingArticles = useMemo(() => {
    if (!cleanSym) return [];
    const searchTerms = [cleanSym.toLowerCase(), info.name.toLowerCase(), ...(info.aliases || []).map((a) => a.toLowerCase())].filter((t) => t.length > 1);

    return articles.filter((article) => {
      const textToSearch = `${article.title} ${article.description} ${article.source}`.toLowerCase();
      return searchTerms.some((term) => textToSearch.includes(term));
    });
  }, [articles, cleanSym, info]);

  // Fetch SEC Filings from API
  useEffect(() => {
    if (!isOpen || !cleanSym || info.isSector) return;

    const resolved = resolveCik(cleanSym);
    setCompanyCik(resolved);

    const loadFilings = async () => {
      setIsLoadingFilings(true);
      setFilingsNotice(null);
      try {
        const res = await fetch(`/api/sec-filings?symbol=${encodeURIComponent(cleanSym)}&form=${selectedFormFilter}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.filings)) {
          setFilings(data.filings);
          if (data.notice) setFilingsNotice(data.notice);
        } else {
          setFilings([]);
        }
      } catch (err: any) {
        setFilings([]);
      } finally {
        setIsLoadingFilings(false);
      }
    };

    loadFilings();
  }, [isOpen, cleanSym, selectedFormFilter, info.isSector]);

  // Trigger AI Credit Risk Batch Analysis with Memory Layer & 4-Hour Cache
  const runAiAnalysis = async (force: boolean = false, extraArticles: NewsArticle[] = []) => {
    if (!cleanSym) return;
    setIsLoadingAi(true);

    try {
      const allNewsCombined = [...tavilyArticles, ...scrapedArticles, ...extraArticles, ...matchingArticles];
      const analysis = await analyzeEntityBatch({
        entity: cleanSym,
        name: info.name || cleanSym,
        industry: info.industry,
        isSector: info.isSector,
        articles: allNewsCombined,
        filings: filings.map((f) => ({
          form: f.form,
          filingDate: f.filingDate,
          description: f.primaryDocDescription || f.form,
          creditRiskTakeaway: f.creditRiskTakeaway,
        })),
        forceRefresh: force,
      });

      setAiAnalysis(analysis);
    } catch (e) {
      console.warn('Error running AI batch analysis:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Automated Web Scraping (DuckDuckGo + Bing News) on Modal Open
  const runAutoWebScrape = async () => {
    if (!cleanSym) return;
    setIsScraping(true);
    setScrapeCompleted(false);

    try {
      const res = await fetch(`/api/scrape-news?q=${encodeURIComponent(info.name || cleanSym)}&maxResults=8`);
      const data = await res.json();
      if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
        setScrapedArticles(data.articles);
        setScrapeCompleted(true);
        // Refresh AI synthesis with newly scraped intelligence
        runAiAnalysis(true, data.articles);
      }
    } catch (e) {
      console.warn('Auto scraping error:', e);
    } finally {
      setIsScraping(false);
      setScrapeCompleted(true);
    }
  };

  // Run automatically whenever a new entity dossier is opened
  useEffect(() => {
    if (isOpen && cleanSym) {
      runAiAnalysis(false);
      runAutoWebScrape();
    }
  }, [isOpen, cleanSym]);

  // Tavily Fresh Search Trigger
  const fetchTavilyFreshNews = async (force: boolean = false) => {
    if (!cleanSym) return;
    setIsFetchingTavily(true);
    try {
      const res = await fetch(`/api/tavily-fresh?symbol=${encodeURIComponent(cleanSym)}&force=${force}`);
      const data = await res.json();
      if (data.success && data.articles && data.articles.length > 0) {
        setTavilyArticles(data.articles);
        runAiAnalysis(true, data.articles);
      }
    } catch (e) {
      console.warn('Tavily lookup failed:', e);
    } finally {
      setIsFetchingTavily(false);
    }
  };

  if (!isOpen || !symbol) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dossier-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Sleek Live Scrape Progress Bar */}
        {isScraping && (
          <div className="dossier-live-scrape-bar">
            <div className="scrape-indicator-pulse" />
            <Radio size={13} className="scrape-icon-pulse" />
            <span>LIVE WEB SCRAPE IN PROGRESS: SCANNING DUCKDUCKGO & BING NEWS WIRE...</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="dossier-masthead-header">
          <div className="dossier-header-identity">
            <div className="dossier-avatar-badge">
              {info.isSector ? <BarChart3 size={22} /> : <Landmark size={22} />}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 className="dossier-main-symbol">
                  {info.isSector ? '' : '$'}{cleanSym}
                </h2>
                <span className="dossier-main-name">{info.name}</span>
                {info.isSector ? (
                  <span className="dossier-type-badge sector">SECTOR</span>
                ) : (
                  <span className="dossier-type-badge issuer">US FI ISSUER</span>
                )}
                {companyCik && (
                  <span className="dossier-cik-pill" title="SEC Central Index Key">
                    <FileText size={11} /> CIK: {companyCik}
                  </span>
                )}
              </div>

              <p className="dossier-sub-role">
                {info.industry} • <span style={{ color: 'var(--accent-gold)' }}>SENIOR CREDIT RISK & FIXED INCOME STRATEGIST</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => {
                onFilterHomeFeed(cleanSym);
                onClose();
              }}
              className="dossier-action-chip"
              title="Filter main terminal wire to this issuer"
            >
              <Search size={13} />
              <span className="hide-on-mobile-sm">FILTER WIRE</span>
            </button>

            <button onClick={onClose} className="btn-icon" title="Close" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Intelligence Controls & Action Bar */}
        <div className="dossier-toolbar-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Multi-Engine Web Scrape Button */}
            <button
              onClick={runAutoWebScrape}
              disabled={isScraping}
              className="dossier-btn-tool scraper"
              title="Query DuckDuckGo HTML & Bing News with domain politeness"
            >
              <Globe size={13} style={{ animation: isScraping ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isScraping ? 'SCANNING WEB...' : 'WEB SCRAPE (DDG + BING)'}</span>
            </button>

            {/* Tavily Refresh Button */}
            <button
              onClick={() => fetchTavilyFreshNews(true)}
              disabled={isFetchingTavily}
              className="dossier-btn-tool tavily"
              title="Deep Search via Tavily Credit Intelligence"
            >
              <Zap size={13} style={{ animation: isFetchingTavily ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isFetchingTavily ? 'FETCHING TAVILY...' : 'TAVILY DEEP-DIVE'}</span>
            </button>

            {/* AI Re-Analyze */}
            <button
              onClick={() => runAiAnalysis(true)}
              disabled={isLoadingAi}
              className="dossier-btn-tool ai"
              title="Re-run AI Credit Synthesis"
            >
              <Sparkles size={13} style={{ animation: isLoadingAi ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isLoadingAi ? 'ANALYZING...' : 'AI RE-SYNTHESIZE'}</span>
            </button>
          </div>

          <div className="dossier-memory-badge">
            <History size={12} />
            <span>FIRESTORE MEMORY ACTIVE</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dossier-tab-row">
          <button
            onClick={() => setActiveTab('credit_dossier')}
            className={`dossier-tab-chip ${activeTab === 'credit_dossier' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            <span>AI CREDIT DOSSIER & ANALYTICS</span>
          </button>

          {!info.isSector && (
            <button
              onClick={() => setActiveTab('sec_filings')}
              className={`dossier-tab-chip ${activeTab === 'sec_filings' ? 'active' : ''}`}
            >
              <FileText size={13} />
              <span>SEC EDGAR FILINGS ({filings.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('news_wire')}
            className={`dossier-tab-chip ${activeTab === 'news_wire' ? 'active' : ''}`}
          >
            <Clock size={13} />
            <span>VERIFIED DISPATCHES ({matchingArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('web_scraped')}
            className={`dossier-tab-chip ${activeTab === 'web_scraped' ? 'active' : ''}`}
          >
            <Globe size={13} />
            <span>SCRAPED WEB INTEL ({scrapedArticles.length})</span>
          </button>
        </div>

        {/* TAB 1: AI Credit Risk Analytics & Memory Dashboard */}
        {activeTab === 'credit_dossier' && (
          <div className="dossier-body-scroll">
            {/* Materiality Alert Banner (if notify === true) */}
            {aiAnalysis?.notify && (
              <div className="dossier-alert-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="alert-bell-pulse">
                    <Bell size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#f43f5e', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      {aiAnalysis.notificationTitle}
                    </strong>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-primary)', marginTop: 2 }}>
                      {aiAnalysis.notificationBody}
                    </p>
                  </div>
                </div>
                <span className="materiality-badge high">HIGH MATERIALITY</span>
              </div>
            )}

            {/* Credit Risk KPI Matrix */}
            <div className="dossier-kpi-grid">
              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <Activity size={12} />
                  <span>LIQUIDITY RISK</span>
                </div>
                <div className={`kpi-val ${aiAnalysis?.analytics?.liquidityRisk === 'ELEVATED' ? 'neg' : aiAnalysis?.analytics?.liquidityRisk === 'MODERATE' ? 'neu' : 'pos'}`}>
                  {aiAnalysis?.analytics?.liquidityRisk || 'LOW'}
                </div>
                <span className="kpi-sub">Coverage & Reserves</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <TrendingUp size={12} />
                  <span>SPREAD TRAJECTORY</span>
                </div>
                <div className={`kpi-val ${aiAnalysis?.analytics?.spreadTrajectory === 'WIDENING' ? 'neg' : aiAnalysis?.analytics?.spreadTrajectory === 'TIGHTENING' ? 'pos' : 'neu'}`}>
                  {aiAnalysis?.analytics?.spreadTrajectory || 'STABLE'}
                </div>
                <span className="kpi-sub">Secondary Yields</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <Scale size={12} />
                  <span>LEVERAGE WATCH</span>
                </div>
                <div className="kpi-val pos" style={{ fontSize: '0.82rem' }}>
                  {aiAnalysis?.analytics?.leverageWatch || 'STABLE (1.2x)'}
                </div>
                <span className="kpi-sub">Net Debt / EBITDA</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <AlertOctagon size={12} />
                  <span>REFINANCING RISK</span>
                </div>
                <div className={`kpi-val ${aiAnalysis?.analytics?.refinancingRisk === 'HIGH' ? 'neg' : aiAnalysis?.analytics?.refinancingRisk === 'MODERATE' ? 'neu' : 'pos'}`}>
                  {aiAnalysis?.analytics?.refinancingRisk || 'LOW'}
                </div>
                <span className="kpi-sub">Near-Term Maturity</span>
              </div>
            </div>

            {/* Executive Synthesis */}
            <div className="dossier-card-panel">
              <div className="dossier-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="var(--accent-gold)" />
                  <span className="panel-title-text">EXECUTIVE CREDIT RISK SYNTHESIS</span>
                </div>
                <span className="relevance-score-badge">
                  {aiAnalysis?.relevanceScore || 90}% RELEVANCE
                </span>
              </div>
              <p className="dossier-synopsis-text">
                {aiAnalysis?.executiveSummary || 'Synthesizing institutional credit intelligence across balance sheet metrics and debt obligations...'}
              </p>
            </div>

            {/* Risk Drivers & Catalysts Two-Column Layout */}
            <div className="dossier-two-col">
              {/* Risk Watchpoints */}
              <div className="dossier-card-panel">
                <div className="dossier-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={14} color="#f43f5e" />
                    <span className="panel-title-text">KEY RISK DRIVERS & WATCHPOINTS</span>
                  </div>
                </div>
                <ul className="dossier-bullet-list">
                  {(aiAnalysis?.keyRiskWatchpoints || [
                    'Debt maturity schedule and refinancing cost trajectory.',
                    'Fixed charge coverage ratio sensitivity against EBITDA.',
                    'Covenant cushion under senior secured credit facilities.',
                  ]).map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>

              {/* Credit Catalysts */}
              <div className="dossier-card-panel">
                <div className="dossier-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span className="panel-title-text">POSITIVE CREDIT CATALYSTS</span>
                  </div>
                </div>
                <ul className="dossier-bullet-list">
                  {(aiAnalysis?.creditCatalysts || [
                    'Adequate liquidity cushion supporting debt obligations.',
                    'Consistent operating cash flow conversion.',
                  ]).map((cat, i) => (
                    <li key={i}>{cat}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Historical Credit Memory Milestones */}
            <div className="dossier-card-panel">
              <div className="dossier-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={14} color="var(--accent-gold)" />
                  <span className="panel-title-text">HISTORICAL CREDIT MILESTONES (FIRESTORE MEMORY LAYER)</span>
                </div>
              </div>

              {(!aiAnalysis?.historicalMilestones || aiAnalysis.historicalMilestones.length === 0) ? (
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                  No historical milestones recorded yet. New material credit events will be automatically archived here.
                </p>
              ) : (
                <div className="memory-timeline">
                  {aiAnalysis.historicalMilestones.map((m, i) => (
                    <div key={i} className="memory-timeline-item">
                      <div className="memory-date">{m.date}</div>
                      <div className="memory-body">
                        <strong className="memory-title">{m.title}</strong>
                        <p className="memory-desc">{m.impactSummary}</p>
                        <span className={`badge-sentiment badge-${m.materiality === 'HIGH' ? 'negative' : 'neutral'}`}>
                          {m.materiality} MATERIALITY
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SEC EDGAR Filings */}
        {activeTab === 'sec_filings' && !info.isSector && (
          <div className="dossier-body-scroll">
            <div className="filings-filter-bar">
              <span className="filings-filter-label">FORM FILTER:</span>
              {['ALL', '10-K', '10-Q', '8-K', '424B2'].map((form) => (
                <button
                  key={form}
                  onClick={() => setSelectedFormFilter(form)}
                  className={`filings-filter-pill ${selectedFormFilter === form ? 'active' : ''}`}
                >
                  {form}
                </button>
              ))}
            </div>

            {isLoadingFilings ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.82rem' }}>FETCHING SEC EDGAR ARCHIVES...</p>
              </div>
            ) : filings.length === 0 ? (
              <div className="empty-box-sm">
                {filingsNotice || `NO SEC FILINGS FOUND FOR CIK: ${companyCik || 'UNRESOLVED'}.`}
              </div>
            ) : (
              <div className="filings-list">
                {filings.map((filing, idx) => (
                  <div key={idx} className="filing-card">
                    <div className="filing-header-row">
                      <span className={`filing-form-pill form-${filing.form.toLowerCase().replace(/[^a-z0-9]/g, '')}`}>
                        {filing.form}
                      </span>
                      <span className="filing-date">{filing.filingDate}</span>
                    </div>

                    <p className="filing-desc">{filing.primaryDocDescription || filing.form}</p>

                    {filing.creditRiskTakeaway && (
                      <div className="filing-credit-takeaway">
                        <strong>CREDIT IMPACT:</strong> {filing.creditRiskTakeaway}
                      </div>
                    )}

                    <div className="filing-footer">
                      <a
                        href={filing.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-filing-link"
                      >
                        <span>VIEW SEC DOCUMENT</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Verified Dispatches (RSS) */}
        {activeTab === 'news_wire' && (
          <div className="dossier-body-scroll">
            {matchingArticles.length === 0 ? (
              <div className="empty-box-sm">
                NO DIRECT DISPATCHES MATCHING THIS ENTITY IN CURRENT WIRE.
              </div>
            ) : (
              <div className="dossier-articles-list">
                {matchingArticles.map((article) => (
                  <div key={article.id} className="dossier-article-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="dossier-article-source">{article.source}</span>
                      <span className={`badge-sentiment badge-${article.sentiment || 'neutral'}`}>
                        {(article.sentiment || 'neutral').toUpperCase()}
                      </span>
                    </div>

                    <h4 className="dossier-article-title">{article.title}</h4>
                    <p className="dossier-article-desc">{article.description}</p>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => onSelectArticle(article)}
                        className="btn-read btn-read-primary"
                        style={{ height: 26, fontSize: '0.72rem' }}
                      >
                        <BookOpen size={11} />
                        <span>READER</span>
                      </button>

                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-read"
                        style={{ height: 26, fontSize: '0.72rem' }}
                      >
                        <span>ORIGINAL</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Multi-Engine Web Scraped Intel */}
        {activeTab === 'web_scraped' && (
          <div className="dossier-body-scroll">
            {isScraping && scrapedArticles.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', color: '#38bdf8' }} />
                <p style={{ fontSize: '0.82rem' }}>SCRAPING DUCKDUCKGO & BING NEWS ENGINES...</p>
              </div>
            ) : scrapedArticles.length === 0 ? (
              <div className="empty-box-sm">
                NO WEB SCRAPED STORIES DETECTED FOR THIS QUERY.
              </div>
            ) : (
              <div className="dossier-articles-list">
                {scrapedArticles.map((article) => (
                  <div key={article.id} className="dossier-article-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="dossier-article-source" style={{ color: '#38bdf8', fontWeight: 800 }}>
                        {article.sourceIcon} {article.source}
                      </span>
                      <span className={`badge-sentiment badge-${article.sentiment || 'neutral'}`}>
                        {(article.sentiment || 'neutral').toUpperCase()}
                      </span>
                    </div>

                    <h4 className="dossier-article-title">{article.title}</h4>
                    <p className="dossier-article-desc">{article.description}</p>

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => onSelectArticle(article)}
                        className="btn-read btn-read-primary"
                        style={{ height: 26, fontSize: '0.72rem' }}
                      >
                        <BookOpen size={11} />
                        <span>READER</span>
                      </button>

                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-read"
                        style={{ height: 26, fontSize: '0.72rem' }}
                      >
                        <span>ORIGINAL</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
