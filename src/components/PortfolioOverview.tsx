'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Plus, RefreshCw, X, Newspaper, AlertTriangle, CheckCircle, MinusCircle, Sparkles } from 'lucide-react';
import { getTickerMeta } from '@/lib/stock-aliases';

export interface PortfolioEntitySummary {
  symbol: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  headline: string;
  newsCount: number;
}

interface PortfolioOverviewProps {
  quotes: StockQuote[];
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
  onOpenManageModal,
  onSelectSymbolFilter,
  selectedSymbolFilter,
  onRefreshQuotes,
  isLoadingQuotes,
  onRemoveSymbol,
  entitySummaries = [],
  onOpenDossier,
}: PortfolioOverviewProps) {
  if (quotes.length === 0) return null;

  const validQuotes = quotes.filter(q => q.price > 0);
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
    <section className="portfolio-dashboard-panel" aria-label="Portfolio Overview">
      {/* Header */}
      <div className="portfolio-panel-header">
        <div className="portfolio-header-main">
          <div className="portfolio-icon-badge">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="portfolio-title-row">
              <h2 className="portfolio-title">My Tracked Portfolio & Sectors</h2>
              <span className={`portfolio-avg-badge ${isPortfolioPositive ? 'positive' : 'negative'}`}>
                {isPortfolioPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>{isPortfolioPositive ? '+' : ''}{avgChange.toFixed(2)}%</span>
              </span>
            </div>
            <p className="portfolio-subtitle">
              Live prices auto-refresh every 45s • Tap any entity to open AI Intelligence Dashboard
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
            <span>Sync</span>
          </button>

          <button
            onClick={onOpenManageModal}
            className="btn-portfolio-primary"
            title="Add stocks or sectors"
          >
            <Plus size={14} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="portfolio-cards-grid">
        {quotes.map((quote) => {
          const isSelected = selectedSymbolFilter === quote.symbol;
          const meta = getTickerMeta(quote.symbol);
          const entitySummary = entitySummaries.find(s => s.symbol === quote.symbol);

          return (
            <div
              key={quote.symbol}
              onClick={() => {
                if (onOpenDossier) {
                  onOpenDossier(quote.symbol);
                } else {
                  onSelectSymbolFilter(isSelected ? '' : quote.symbol);
                }
              }}
              className={`portfolio-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="portfolio-card-top">
                <div className="portfolio-sym-wrap">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="portfolio-card-symbol">${quote.symbol}</span>
                    <Sparkles size={11} color="var(--accent-gold)" />
                  </div>
                  <span className="portfolio-card-name">
                    {meta?.name || quote.shortName}
                  </span>
                  {meta && (
                    <span className="portfolio-card-industry">
                      {meta.isSector ? '📊 ' : ''}{meta.industry}
                    </span>
                  )}
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
                  style={{ borderColor: getSentimentColor(entitySummary.sentiment) + '30' }}
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
                      <Newspaper size={9} /> {entitySummary.newsCount} stories
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
