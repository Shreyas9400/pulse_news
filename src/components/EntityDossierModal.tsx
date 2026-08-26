'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  DollarSign,
  AlertOctagon,
  Zap,
  Globe,
  Bell,
  History,
  CheckCircle2,
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
  const [filingsError, setFilingsError] = useState<string | null>(null);
  const [companyCik, setCompanyCik] = useState<string | null>(null);

  // Multi-Engine Scraped Articles state
  const [scrapedArticles, setScrapedArticles] = useState<NewsArticle[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);

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

    if (!resolved) return;

    const loadFilings = async () => {
      setIsLoadingFilings(true);
      setFilingsError(null);
      try {
        const res = await fetch(`/api/sec-filings?symbol=${encodeURIComponent(cleanSym)}&form=${selectedFormFilter}`);
        const data = await res.json();
        if (data.success && data.filings) {
          setFilings(data.filings);
        } else {
          setFilings([]);
          if (data.error) setFilingsError(data.error);
        }
      } catch (err: any) {
        setFilingsError(err.message || 'Failed to load SEC EDGAR filings');
      } finally {
        setIsLoadingFilings(false);
      }
    };

    loadFilings();
  }, [isOpen, cleanSym, selectedFormFilter, info.isSector]);

  // Trigger AI Credit Risk Batch Analysis with Memory Layer & 4-Hour Cache
  const runAiAnalysis = async (force: boolean = false) => {
    if (!cleanSym) return;
    setIsLoadingAi(true);

    try {
      const allNewsCombined = [...tavilyArticles, ...scrapedArticles, ...matchingArticles];
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

  // Run AI analysis on modal open
  useEffect(() => {
    if (isOpen && cleanSym) {
      runAiAnalysis(false);
    }
  }, [isOpen, cleanSym]);

  // Multi-Engine Web Scraping Trigger (DuckDuckGo + Bing News)
  const handleTriggerScrape = async () => {
    if (!cleanSym) return;
    setIsScraping(true);

    try {
      const res = await fetch(`/api/scrape-news?q=${encodeURIComponent(info.name || cleanSym)}&maxResults=10`);
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setScrapedArticles(data.articles);
        setActiveTab('web_scraped');
        // Refresh AI analysis with freshly scraped intelligence
        setTimeout(() => runAiAnalysis(true), 300);
      }
    } catch (e) {
      console.warn('Scraping failed:', e);
    } finally {
      setIsScraping(false);
    }
  };

  // Tavily Fresh Search
  const fetchTavilyFreshNews = async (force: boolean = false) => {
    if (!cleanSym) return;
    setIsFetchingTavily(true);
    try {
      const res = await fetch(`/api/tavily-fresh?symbol=${encodeURIComponent(cleanSym)}&force=${force}`);
      const data = await res.json();
      if (data.success && data.articles && data.articles.length > 0) {
        setTavilyArticles(data.articles);
        setTimeout(() => runAiAnalysis(true), 300);
      }
    } catch (e) {
      console.warn('Tavily lookup failed:', e);
    } finally {
      setIsFetchingTavily(false);
    }
  };

  if (!isOpen || !symbol) return null;

  const allArticlesList = [...tavilyArticles, ...scrapedArticles, ...matchingArticles];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dossier-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header-row">
          <div className="dossier-header-left">
            <div className="portfolio-icon-badge" style={{ width: 42, height: 42, borderRadius: 3 }}>
              {info.isSector ? <BarChart3 size={20} /> : <Landmark size={20} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 className="dossier-symbol-title">
                  {info.isSector ? '' : '$'}{cleanSym}
                </h2>
                <span className="dossier-name-tag">{info.name}</span>
                {info.isSector && <span className="sector-badge-tag">INDUSTRY SECTOR</span>}
                {companyCik && (
                  <span className="cik-badge" title="SEC Central Index Key">
                    <FileText size={11} /> CIK: {companyCik}
                  </span>
                )}
              </div>

              <p className="dossier-industry-line">
                {info.industry} • ROLE: SENIOR CREDIT RISK ANALYST & FIXED INCOME STRATEGIST
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                onFilterHomeFeed(cleanSym);
                onClose();
              }}
              className="btn-filter-terminal"
              title="Filter main terminal wire to this issuer"
            >
              <Search size={13} />
              <span className="hide-on-mobile-sm">FILTER WIRE</span>
            </button>

            <button onClick={onClose} className="btn-icon" title="Close" aria-label="Close">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Action Toolbar: Multi-Engine Scraper & Tavily Refresh */}
        <div className="dossier-action-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Scrapling Web Scraper Button */}
            <button
              onClick={handleTriggerScrape}
              disabled={isScraping}
              className="btn-tavily-refresh"
              style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #38bdf8', color: '#38bdf8' }}
              title="Scrape DuckDuckGo & Bing News with enterprise politeness"
            >
              <Globe size={13} style={{ animation: isScraping ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isScraping ? 'SCRAPING DUCKDUCKGO & BING...' : '🌐 MULTI-ENGINE WEB SCRAPE'}</span>
            </button>

            {/* Tavily Refresh Button */}
            <button
              onClick={() => fetchTavilyFreshNews(true)}
              disabled={isFetchingTavily}
              className="btn-tavily-refresh"
              title="Deep Search via Tavily Credit Intelligence"
            >
              <Zap size={13} style={{ animation: isFetchingTavily ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isFetchingTavily ? 'FETCHING TAVILY...' : '⚡ REFRESH VIA TAVILY'}</span>
            </button>

            {/* Force AI Refresh */}
            <button
              onClick={() => runAiAnalysis(true)}
              disabled={isLoadingAi}
              className="btn-tavily-refresh"
              style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
              title="Re-run AI Credit Synthesis"
            >
              <Sparkles size={13} style={{ animation: isLoadingAi ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isLoadingAi ? 'ANALYZING...' : 'AI REFRESH'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            L2 FIRESTORE MEMORY ACTIVE
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dossier-tab-bar">
          <button
            onClick={() => setActiveTab('credit_dossier')}
            className={`dossier-tab-btn ${activeTab === 'credit_dossier' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            <span>AI CREDIT DOSSIER & ANALYTICS</span>
          </button>

          {!info.isSector && (
            <button
              onClick={() => setActiveTab('sec_filings')}
              className={`dossier-tab-btn ${activeTab === 'sec_filings' ? 'active' : ''}`}
            >
              <FileText size={13} />
              <span>SEC EDGAR FILINGS ({filings.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('news_wire')}
            className={`dossier-tab-btn ${activeTab === 'news_wire' ? 'active' : ''}`}
          >
            <Clock size={13} />
            <span>VERIFIED DISPATCHES ({matchingArticles.length})</span>
          </button>

          {scrapedArticles.length > 0 && (
            <button
              onClick={() => setActiveTab('web_scraped')}
              className={`dossier-tab-btn ${activeTab === 'web_scraped' ? 'active' : ''}`}
              style={{ color: '#38bdf8' }}
            >
              <Globe size={13} />
              <span>SCRAPED INTEL ({scrapedArticles.length})</span>
            </button>
          )}
        </div>

        {/* Tab 1: AI Credit Risk Analytics & Memory Dashboard */}
        {activeTab === 'credit_dossier' && (
          <div className="dossier-content-body">
            {/* Materiality Alert Banner (if notify === true) */}
            {aiAnalysis?.notify && (
              <div className="dossier-notification-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} color="var(--accent-gold)" />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                      {aiAnalysis.notificationTitle}
                    </strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: 2 }}>
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
                <span className="kpi-sub">Coverage & Cash Reserves</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <TrendingUp size={12} />
                  <span>SPREAD TRAJECTORY</span>
                </div>
                <div className={`kpi-val ${aiAnalysis?.analytics?.spreadTrajectory === 'WIDENING' ? 'neg' : aiAnalysis?.analytics?.spreadTrajectory === 'TIGHTENING' ? 'pos' : 'neu'}`}>
                  {aiAnalysis?.analytics?.spreadTrajectory || 'STABLE'}
                </div>
                <span className="kpi-sub">IG / HY Secondary Yields</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <Scale size={12} />
                  <span>LEVERAGE WATCH</span>
                </div>
                <div className="kpi-val pos" style={{ fontSize: '0.85rem' }}>
                  {aiAnalysis?.analytics?.leverageWatch || 'STABLE (1.2x)'}
                </div>
                <span className="kpi-sub">Net Debt / Asset Base</span>
              </div>

              <div className="dossier-kpi-card">
                <div className="kpi-label">
                  <AlertOctagon size={12} />
                  <span>REFINANCING RISK</span>
                </div>
                <div className={`kpi-val ${aiAnalysis?.analytics?.refinancingRisk === 'HIGH' ? 'neg' : aiAnalysis?.analytics?.refinancingRisk === 'MODERATE' ? 'neu' : 'pos'}`}>
                  {aiAnalysis?.analytics?.refinancingRisk || 'LOW'}
                </div>
                <span className="kpi-sub">Near-Term Maturity Walls</span>
              </div>
            </div>

            {/* Executive Synthesis */}
            <div className="dossier-section-card">
              <div className="dossier-card-title">
                <Sparkles size={14} color="var(--accent-gold)" />
                <span>EXECUTIVE CREDIT RISK SYNTHESIS</span>
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
              <div className="dossier-section-card">
                <div className="dossier-card-title">
                  <ShieldAlert size={14} color="#f43f5e" />
                  <span>KEY RISK DRIVERS & VULNERABILITIES</span>
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
              <div className="dossier-section-card">
                <div className="dossier-card-title">
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>POSITIVE CREDIT CATALYSTS</span>
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
            <div className="dossier-section-card">
              <div className="dossier-card-title">
                <History size={14} color="var(--accent-gold)" />
                <span>HISTORICAL CREDIT MILESTONES (FIRESTORE MEMORY LAYER)</span>
              </div>

              {(!aiAnalysis?.historicalMilestones || aiAnalysis.historicalMilestones.length === 0) ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                  No historical milestones recorded yet. New material credit events will be automatically remembered here.
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

        {/* Tab 2: SEC EDGAR Filings */}
        {activeTab === 'sec_filings' && !info.isSector && (
          <div className="dossier-content-body">
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
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.85rem' }}>FETCHING SEC EDGAR ARCHIVES...</p>
              </div>
            ) : filings.length === 0 ? (
              <div className="empty-box-sm">
                NO SEC FILINGS FOUND FOR CIK: {companyCik || 'UNRESOLVED'}.
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

        {/* Tab 3: Verified Dispatches (RSS) */}
        {activeTab === 'news_wire' && (
          <div className="dossier-content-body">
            {matchingArticles.length === 0 ? (
              <div className="empty-box-sm">
                NO DIRECT DISPATCHES MATCHING THIS ENTITY IN CURRENT WIRE.
              </div>
            ) : (
              <div className="dossier-articles-list">
                {matchingArticles.map((article) => (
                  <div key={article.id} className="dossier-article-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="dossier-article-source">{article.source}</span>
                      <span className={`badge-sentiment badge-${article.sentiment || 'neutral'}`}>
                        {(article.sentiment || 'neutral').toUpperCase()}
                      </span>
                    </div>

                    <h4 className="dossier-article-title">{article.title}</h4>
                    <p className="dossier-article-desc">{article.description}</p>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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

        {/* Tab 4: Multi-Engine Web Scraped Intel */}
        {activeTab === 'web_scraped' && (
          <div className="dossier-content-body">
            <div className="dossier-articles-list">
              {scrapedArticles.map((article) => (
                <div key={article.id} className="dossier-article-item">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="dossier-article-source" style={{ color: '#38bdf8' }}>
                      {article.sourceIcon} {article.source}
                    </span>
                    <span className={`badge-sentiment badge-${article.sentiment || 'neutral'}`}>
                      {(article.sentiment || 'neutral').toUpperCase()}
                    </span>
                  </div>

                  <h4 className="dossier-article-title">{article.title}</h4>
                  <p className="dossier-article-desc">{article.description}</p>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
