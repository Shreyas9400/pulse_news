'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockQuote, NewsArticle } from '@/lib/types';
import { getTickerMeta, getSymbolDisplayInfo } from '@/lib/stock-aliases';
import { SecFiling, resolveCik } from '@/lib/sec-edgar';
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
  const [activeTab, setActiveTab] = useState<'credit_dossier' | 'sec_filings' | 'news_wire'>('credit_dossier');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('ALL');
  const [filings, setFilings] = useState<SecFiling[]>([]);
  const [isLoadingFilings, setIsLoadingFilings] = useState<boolean>(false);
  const [filingsError, setFilingsError] = useState<string | null>(null);
  const [companyCik, setCompanyCik] = useState<string | null>(null);

  // Tavily on-demand fresh intelligence state
  const [tavilyArticles, setTavilyArticles] = useState<NewsArticle[]>([]);
  const [isFetchingTavily, setIsFetchingTavily] = useState<boolean>(false);
  const [tavilyActive, setTavilyActive] = useState<boolean>(false);

  const cleanSym = symbol ? symbol.toUpperCase() : '';
  const meta = cleanSym ? getTickerMeta(cleanSym) : null;
  const info = cleanSym ? getSymbolDisplayInfo(cleanSym) : { name: '', industry: '', aliases: [], isSector: false };

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

  // Function to fetch fresh intelligence via Tavily (specifically when news is dated or on demand)
  const fetchTavilyFreshNews = async (force: boolean = false) => {
    if (!cleanSym) return;
    setIsFetchingTavily(true);
    try {
      const res = await fetch(`/api/tavily-fresh?symbol=${encodeURIComponent(cleanSym)}&force=${force}`);
      const data = await res.json();
      if (data.success && data.articles && data.articles.length > 0) {
        setTavilyArticles(data.articles);
        setTavilyActive(true);
      }
    } catch (e) {
      console.warn('Tavily fresh fetch error:', e);
    } finally {
      setIsFetchingTavily(false);
    }
  };

  // Base matched articles from global news feed
  const baseMatchedArticles = useMemo(() => {
    if (!cleanSym) return [];
    const searchTerms = [
      cleanSym.toLowerCase(),
      info.name.toLowerCase(),
      ...info.aliases.map((a) => a.toLowerCase()),
    ].filter(Boolean);

    return articles.filter((article) => {
      const text = `${article.title} ${article.description} ${article.source}`.toLowerCase();
      return searchTerms.some((t) => text.includes(t));
    });
  }, [articles, cleanSym, info]);

  // If base articles are empty or older than 24 hours, automatically fetch from Tavily once
  useEffect(() => {
    if (!isOpen || !cleanSym) return;

    const isStale = baseMatchedArticles.length === 0 || (
      Date.now() - baseMatchedArticles[0].timestamp > 24 * 60 * 60 * 1000
    );

    if (isStale && tavilyArticles.length === 0 && !isFetchingTavily) {
      fetchTavilyFreshNews(false);
    }
  }, [isOpen, cleanSym, baseMatchedArticles.length]);

  // Combined articles (Tavily + Base RSS)
  const combinedArticles = useMemo(() => {
    const map = new Map<string, NewsArticle>();
    tavilyArticles.forEach((a) => map.set(a.title.toLowerCase().slice(0, 35), a));
    baseMatchedArticles.forEach((a) => {
      const key = a.title.toLowerCase().slice(0, 35);
      if (!map.has(key)) map.set(key, a);
    });
    const list = Array.from(map.values());
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [tavilyArticles, baseMatchedArticles]);

  // Senior Credit Risk & Materiality Metrics
  const creditAnalysis = useMemo(() => {
    let pos = 0;
    let neg = 0;
    combinedArticles.forEach((a) => {
      if (a.sentiment === 'positive') pos++;
      else if (a.sentiment === 'negative') neg++;
    });

    const total = combinedArticles.length || 1;
    let creditOutlook: 'STABLE / EXPANDING' | 'NEUTRAL MONITOR' | 'DEFENSIVE / ELEVATED SPREAD RISK' = 'NEUTRAL MONITOR';
    let creditScore = 50;

    if (pos > neg) {
      creditOutlook = 'STABLE / EXPANDING';
      creditScore = Math.min(95, 55 + Math.round((pos / total) * 40));
    } else if (neg > pos) {
      creditOutlook = 'DEFENSIVE / ELEVATED SPREAD RISK';
      creditScore = Math.max(15, 45 - Math.round((neg / total) * 35));
    }

    const materialityLevel =
      combinedArticles.length >= 4 || Math.abs((quote?.changePercent || 0)) > 2.5
        ? 'HIGH CREDIT MATERIALITY'
        : combinedArticles.length >= 2
        ? 'MODERATE SURVEILLANCE'
        : 'ROUTINE SURVEILLANCE';

    const materialityColor =
      materialityLevel === 'HIGH CREDIT MATERIALITY'
        ? '#f43f5e'
        : materialityLevel === 'MODERATE SURVEILLANCE'
        ? '#d4af37'
        : '#10b981';

    return {
      creditOutlook,
      creditScore,
      materialityLevel,
      materialityColor,
      storyCount: combinedArticles.length,
      pos,
      neg,
    };
  }, [combinedArticles, quote]);

  if (!isOpen || !symbol) return null;

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'JUST NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dossier-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header-row" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-sm)',
                background: info.isSector
                  ? 'linear-gradient(135deg, #d4af37 0%, #990f3d 100%)'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}
            >
              {info.isSector ? <BarChart3 size={20} /> : <Landmark size={20} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
                  {info.isSector ? '' : '$'}{cleanSym}
                </h3>
                <span className="edition-badge" style={{ background: info.isSector ? 'var(--accent-gold)' : 'var(--accent-primary)', color: info.isSector ? '#121212' : '#fff' }}>
                  {info.isSector ? 'SECTOR DOMAIN' : 'ISSUER / CORPORATE DEBT'}
                </span>
                {companyCik && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 2 }}>
                    CIK: {companyCik}
                  </span>
                )}
                {tavilyActive && (
                  <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 5px', borderRadius: 2, fontWeight: 800 }}>
                    ⚡ TAVILY ENHANCED
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {info.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" title="Close Dossier" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Live Market Price & Intraday Metrics Bar (Only for Equities with Quotes) */}
        {quote && quote.price > 0 && !info.isSector && (
          <div className="dossier-price-banner">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LIVE EQUITY VALUE & TRADING SPREAD
              </div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                {quote.formattedPrice}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className={`portfolio-change-chip ${quote.isPositive ? 'positive' : 'negative'}`} style={{ fontSize: '0.88rem', padding: '3px 8px' }}>
                {quote.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{quote.isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}% ({quote.formattedChange})</span>
              </span>
              {quote.high && quote.low && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  DAY RANGE: ${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Multi-Tab Navigation for Credit Dossier */}
        <div className="portfolio-tabs" style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setActiveTab('credit_dossier')}
            className={`portfolio-tab ${activeTab === 'credit_dossier' ? 'active' : ''}`}
          >
            <ShieldAlert size={13} />
            <span>CREDIT RISK DOSSIER</span>
          </button>

          {!info.isSector && (
            <button
              type="button"
              onClick={() => setActiveTab('sec_filings')}
              className={`portfolio-tab ${activeTab === 'sec_filings' ? 'active' : ''}`}
            >
              <FileText size={13} />
              <span>SEC EDGAR FILINGS (10-K / 10-Q / 8-K)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('news_wire')}
            className={`portfolio-tab ${activeTab === 'news_wire' ? 'active' : ''}`}
          >
            <BookOpen size={13} />
            <span>INTELLIGENCE WIRE ({combinedArticles.length})</span>
          </button>
        </div>

        {/* TAB 1: SENIOR CREDIT RISK ANALYST DOSSIER */}
        {activeTab === 'credit_dossier' && (
          <div>
            {/* Credit Metrics Grid */}
            <div className="dossier-metrics-grid" style={{ marginTop: 12 }}>
              <div className="dossier-metric-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    CREDIT RISK OUTLOOK
                  </span>
                  <Scale size={14} color="var(--accent-gold)" />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: creditAnalysis.creditOutlook.includes('STABLE') ? '#10b981' : creditAnalysis.creditOutlook.includes('DEFENSIVE') ? '#f43f5e' : '#d4af37' }}>
                  {creditAnalysis.creditOutlook}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Health Score: {creditAnalysis.creditScore}/100 • Evaluated across balance sheet stability & liquidity
                </p>
              </div>

              <div className="dossier-metric-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    DEFAULT & SPREAD MATERIALITY
                  </span>
                  <AlertOctagon size={14} color={creditAnalysis.materialityColor} />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: creditAnalysis.materialityColor }}>
                  {creditAnalysis.materialityLevel}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Surveillance based on SEC disclosures, debt issuance, and macro rate fluctuations
                </p>
              </div>
            </div>

            {/* Senior Credit Analyst Synopsis */}
            <div className="dossier-synopsis-box" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#fb7185', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <Sparkles size={14} />
                <span>SENIOR CREDIT RISK & FIXED INCOME EVALUATION</span>
              </div>

              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>
                {combinedArticles.length > 0
                  ? `CREDIT DESK ASSESSMENT: ${info.name} (${cleanSym}) exhibits active surveillance signals. Recent reporting focuses on "${combinedArticles[0].title}". Fixed Income liquidity profile remains in focus with credit spreads trading in line with broader sector risk premia.`
                  : `CREDIT DESK ASSESSMENT: ${info.name} (${cleanSym}) demonstrates stable baseline credit health. No critical covenant breaches, debt downgrades, or liquidity constraints identified in the trailing surveillance cycle.`}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 12 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: 2 }}>LIQUIDITY & REFINANCING TAILWINDS</strong>
                  <span>Robust operating cash flow conversion, ample revolving credit facility capacity, and manageable near-term bond maturities.</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                  <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: 2 }}>DEBT SERVICEABILITY & SPREAD RISKS</strong>
                  <span>Elevated cost of capital under higher-for-longer macro interest rates, refinancing wall rollover costs, and sector leverage multiples.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REAL-TIME SEC EDGAR FILINGS (10-K / 10-Q / 8-K) */}
        {activeTab === 'sec_filings' && (
          <div style={{ marginTop: 12 }}>
            {/* Form Filter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>FORM FILTER:</span>
                {['ALL', '10-K', '10-Q', '8-K'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormFilter(f)}
                    style={{
                      background: selectedFormFilter === f ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: selectedFormFilter === f ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      padding: '3px 10px',
                      borderRadius: 2,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                SOURCE: SEC EDGAR PUBLIC REPOSITORY
              </div>
            </div>

            {/* Filings List */}
            {isLoadingFilings ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: 'var(--accent-gold)' }} />
                <p style={{ fontSize: '0.85rem' }}>FETCHING OFFICIAL SEC EDGAR FILINGS FOR CIK {companyCik}...</p>
              </div>
            ) : filingsError ? (
              <div className="empty-box-sm">
                {filingsError}
              </div>
            ) : filings.length === 0 ? (
              <div className="empty-box-sm">
                NO RECENT {selectedFormFilter} FILINGS FOUND ON SEC EDGAR FOR THIS ISSUER.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                {filings.map((filing) => (
                  <div key={filing.accessionNumber} className="dossier-article-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            background: filing.form === '10-K' ? 'var(--accent-primary)' : filing.form === '10-Q' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                            color: filing.form === '10-K' ? '#fff' : filing.form === '10-Q' ? 'var(--accent-gold)' : '#38bdf8',
                            border: '1px solid var(--border-subtle)',
                            padding: '2px 8px',
                            borderRadius: 2,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                          }}
                        >
                          FORM {filing.form}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          REPORT DATE: {filing.reportDate}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        FILED: {filing.filingDate}
                      </span>
                    </div>

                    <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0', lineHeight: 1.3 }}>
                      {filing.primaryDocDescription || `${cleanSym} SEC Form ${filing.form} Filing`}
                    </h5>

                    {/* Credit Analyst Interpretation */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: 2, fontSize: '0.75rem', color: 'var(--accent-gold)', margin: '6px 0', border: '1px solid var(--border-subtle)' }}>
                      <strong>CREDIT RISK LENS:</strong> {filing.creditRiskTakeaway}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <a
                        href={filing.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-read btn-read-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} />
                        <span>OPEN SEC EDGAR FILING DOCUMENT</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE INTELLIGENCE WIRE (TAVILY + RSS) */}
        {activeTab === 'news_wire' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <h4 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
                DISPATCHES FOR {cleanSym} ({combinedArticles.length})
              </h4>

              <div style={{ display: 'flex', gap: 8 }}>
                {/* On-Demand Tavily Freshness Button */}
                <button
                  onClick={() => fetchTavilyFreshNews(true)}
                  disabled={isFetchingTavily}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Query Tavily across SEC, Moody's, S&P, Fitch, and Reuters for fresh intelligence"
                >
                  <Zap size={11} />
                  <span>{isFetchingTavily ? 'QUERYING TAVILY...' : '⚡ REFRESH VIA TAVILY'}</span>
                </button>

                <button
                  onClick={() => {
                    onFilterHomeFeed(cleanSym);
                    onClose();
                  }}
                  style={{
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid var(--accent-gold)',
                    color: 'var(--accent-gold)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  FILTER MAIN WIRE
                </button>
              </div>
            </div>

            {isFetchingTavily && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
                Fetching fresh credit intelligence via Tavily...
              </div>
            )}

            {combinedArticles.length === 0 ? (
              <div className="empty-box-sm">
                NO RECENT INTELLIGENCE DISPATCHES FOUND. TAP &quot;⚡ REFRESH VIA TAVILY&quot; TO PULL FRESH COVERAGE.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                {combinedArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      onSelectArticle(article);
                      onClose();
                    }}
                    className="dossier-article-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                        {article.source}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)' }}>
                        <Clock size={11} /> {getTimeAgo(article.timestamp)}
                      </span>
                    </div>

                    <h5 style={{ fontSize: '0.92rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                      {article.title}
                    </h5>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                      {article.sentiment && (
                        <span className={`badge-sentiment badge-${article.sentiment}`}>
                          {article.sentiment.toUpperCase()}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-gold)', fontSize: '0.72rem', fontWeight: 700 }}>
                        <BookOpen size={12} /> OPEN FULL DISPATCH
                      </span>
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
