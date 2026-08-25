'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Plus, RefreshCw, X, Newspaper, AlertTriangle, CheckCircle, MinusCircle, Sparkles, BarChart3, Layers } from 'lucide-react';
import { getTickerMeta, isSectorEntity } from '@/lib/stock-aliases';

export interface PortfolioEntitySummary {
  symbol: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  headline: string;
  newsCount: number;
}

interface PortfolioOverviewProps {
  quotes: StockQuote[];
  portfolioSymbols?: string[];
  onOpenManageModal: () => void;
  onSelectSymbolFilter: (symbol: string) => void;
  selectedSymbolFilter: string | null;
  onRefreshQuotes: () => void;
  isLoadingQuotes: boolean;
  onRemoveSymbol: (symbol: string) => void;
  entitySummaries?: PortfolioEntitySummary[];
  onOpenDossier?: (symbol: string) => void;
}

export default function PortfolioOverview({
  quotes,
  portfolioSymbols = [],
  onOpenManageModal,
  onSelectSymbolFilter,
  selectedSymbolFilter,
  onRefreshQuotes,
  isLoadingQuotes,
  onRemoveSymbol,
  entitySummaries = [],
  onOpenDossier,
}: PortfolioOverviewProps) {
  // Separate stocks (with live price quotes) from pure sectors (industry domains)
  const stockQuotes = quotes.filter((q) => !isSectorEntity(q.symbol));
  const sectorSymbols = portfolioSymbols.filter((s) => isSectorEntity(s));

  // Average change for stock assets
  const validQuotes = stockQuotes.filter((q) => q.price > 0);
  const avgChange = validQuotes.length > 0
    ? validQuotes.reduce((acc, q) => acc + q.changePercent, 0) / validQuotes.length
    : 0;
  const isPortfolioPositive = avgChange >= 0;

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'positive') return <CheckCircle size={11} color="#10b981" />;
    if (sentiment === 'negative') return <AlertTriangle size={11} color="#f43f5e" />;
    return <MinusCircle size={11} color="#94a3b8" />;
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return '#10b981';
    if (sentiment === 'negative') return '#f43f5e';
    return '#94a3b8';
  };

  return (
    <section className="portfolio-dashboard-panel" aria-label="Portfolio and Sectors Overview">
      {/* Header */}
      <div className="portfolio-panel-header">
        <div className="portfolio-header-main">
          <div className="portfolio-icon-badge">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="portfolio-title-row">
              <h2 className="portfolio-title">MY TRACKED PORTFOLIO & SECTORS</h2>
              {stockQuotes.length > 0 && (
                <span className={`portfolio-avg-badge ${isPortfolioPositive ? 'positive' : 'negative'}`}>
                  {isPortfolioPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>{isPortfolioPositive ? '+' : ''}{avgChange.toFixed(2)}% TODAY</span>
                </span>
              )}
            </div>
            <p className="portfolio-subtitle">
              LIVE PRICES AUTO-SYNC EVERY 45S • TAP ANY ASSET OR SECTOR TO OPEN AI INTELLIGENCE DOSSIER
            </p>
          </div>
        </div>

        <div className="portfolio-actions-row">
          <button
            onClick={onRefreshQuotes}
            disabled={isLoadingQuotes}
            className="btn-portfolio-action"
            title="Sync Live Prices"
          >
            <RefreshCw size={13} style={{ animation: isLoadingQuotes ? 'spin 1s linear infinite' : 'none' }} />
            <span>SYNC</span>
          </button>

          <button
            onClick={onOpenManageModal}
            className="btn-portfolio-primary"
            title="Add stocks or sectors"
          >
            <Plus size={14} />
            <span>ADD ASSET / SECTOR</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: STOCKS & CRYPTO WATCHLIST */}
      {stockQuotes.length > 0 && (
        <div style={{ marginBottom: sectorSymbols.length > 0 ? 20 : 0 }}>
          <div className="portfolio-subheading">
            <span>STOCKS & DIGITAL ASSETS</span>
            <span className="count-pill">{stockQuotes.length}</span>
          </div>

          <div className="portfolio-cards-grid">
            {stockQuotes.map((quote) => {
              const isSelected = selectedSymbolFilter === quote.symbol;
              const meta = getTickerMeta(quote.symbol);
              const entitySummary = entitySummaries.find((s) => s.symbol === quote.symbol);

              return (
                <div
                  key={quote.symbol}
                  onClick={() => {
                    if (onOpenDossier) onOpenDossier(quote.symbol);
                    else onSelectSymbolFilter(isSelected ? '' : quote.symbol);
                  }}
                  className={`portfolio-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="portfolio-card-top">
                    <div className="portfolio-sym-wrap">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="portfolio-card-symbol">${quote.symbol}</span>
                        <Sparkles size={11} color="var(--accent-gold)" />
                      </div>
                      <span className="portfolio-card-name">
                        {meta?.name || quote.shortName}
                      </span>
                    </div>

                    <div className="portfolio-chip-wrap">
                      <span className={`portfolio-change-chip ${quote.isPositive ? 'positive' : 'negative'}`}>
                        {quote.isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSymbol(quote.symbol);
                        }}
                        className="portfolio-remove-btn"
                        title={`Remove ${quote.symbol}`}
                        aria-label={`Remove ${quote.symbol}`}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Price & Sparkline */}
                  <div className="portfolio-card-middle">
                    <div className="portfolio-card-price">{quote.formattedPrice}</div>

                    {quote.sparkline && quote.sparkline.length > 2 && (
                      <svg className="sparkline-svg" viewBox="0 0 54 18" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke={quote.isPositive ? '#10b981' : '#f43f5e'}
                          strokeWidth="2"
                          points={generateSparklinePoints(quote.sparkline, 54, 18)}
                        />
                      </svg>
                    )}
                  </div>

                  {/* Day High / Low */}
                  {quote.high && quote.low && (
                    <div className="portfolio-card-range">
                      <span>L: ${quote.low.toFixed(1)}</span>
                      <div className="range-track">
                        <div
                          className="range-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, ((quote.price - quote.low) / (quote.high - quote.low || 1)) * 100))}%`,
                            backgroundColor: quote.isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          }}
                        />
                      </div>
                      <span>H: ${quote.high.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Entity News Sentiment Summary */}
                  {entitySummary && (
                    <div
                      className="portfolio-card-sentiment"
                      style={{ borderColor: getSentimentColor(entitySummary.sentiment) + '35' }}
                    >
                      <div className="sentiment-row">
                        {getSentimentIcon(entitySummary.sentiment)}
                        <span
                          className="sentiment-label"
                          style={{ color: getSentimentColor(entitySummary.sentiment) }}
                        >
                          {entitySummary.sentiment.toUpperCase()}
                        </span>
                        <span className="sentiment-count">
                          <Newspaper size={9} /> {entitySummary.newsCount} STORIES
                        </span>
                      </div>
                      <p className="sentiment-headline">
                        {entitySummary.headline}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: INDUSTRY SECTOR INTELLIGENCE TRACKERS (PURE NAMES, NO TICKERS) */}
      {sectorSymbols.length > 0 && (
        <div>
          <div className="portfolio-subheading" style={{ color: 'var(--accent-gold)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <BarChart3 size={13} />
              <span>INDUSTRY SECTOR INTELLIGENCE TRACKERS</span>
            </span>
            <span className="count-pill" style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--accent-gold)' }}>
              {sectorSymbols.length}
            </span>
          </div>

          <div className="portfolio-cards-grid">
            {sectorSymbols.map((sym) => {
              const meta = getTickerMeta(sym);
              const entitySummary = entitySummaries.find((s) => s.symbol === sym);
              const isSelected = selectedSymbolFilter === sym;

              return (
                <div
                  key={sym}
                  onClick={() => {
                    if (onOpenDossier) onOpenDossier(sym);
                    else onSelectSymbolFilter(isSelected ? '' : sym);
                  }}
                  className={`portfolio-card sector-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="portfolio-card-top">
                    <div className="portfolio-sym-wrap">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span className="sector-badge-tag">SECTOR</span>
                        <Sparkles size={11} color="var(--accent-gold)" />
                      </div>
                      <span className="portfolio-card-symbol" style={{ fontSize: '0.92rem', marginTop: 3 }}>
                        {meta?.name || sym}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSymbol(sym);
                      }}
                      className="portfolio-remove-btn"
                      title={`Remove ${sym}`}
                      aria-label={`Remove ${sym}`}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Sector Sentiment & Intelligence Box */}
                  <div
                    className="portfolio-card-sentiment"
                    style={{
                      borderColor: entitySummary ? getSentimentColor(entitySummary.sentiment) + '35' : 'var(--border-subtle)',
                      marginTop: 10,
                    }}
                  >
                    <div className="sentiment-row">
                      {entitySummary && getSentimentIcon(entitySummary.sentiment)}
                      <span
                        className="sentiment-label"
                        style={{ color: entitySummary ? getSentimentColor(entitySummary.sentiment) : 'var(--text-muted)' }}
                      >
                        {entitySummary ? entitySummary.sentiment.toUpperCase() : 'MONITORING'}
                      </span>
                      <span className="sentiment-count">
                        <Newspaper size={9} /> {entitySummary?.newsCount || 0} STORIES
                      </span>
                    </div>
                    <p className="sentiment-headline">
                      {entitySummary?.headline || 'Continuous sector intelligence and macro monitoring active.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function generateSparklinePoints(data: number[], width: number, height: number): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
