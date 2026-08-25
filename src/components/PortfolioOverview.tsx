'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Plus, RefreshCw, X, Sparkles, ExternalLink } from 'lucide-react';

interface PortfolioOverviewProps {
  quotes: StockQuote[];
  onOpenManageModal: () => void;
  onSelectSymbolFilter: (symbol: string) => void;
  selectedSymbolFilter: string | null;
  onRefreshQuotes: () => void;
  isLoadingQuotes: boolean;
  onRemoveSymbol: (symbol: string) => void;
}

export default function PortfolioOverview({
  quotes,
  onOpenManageModal,
  onSelectSymbolFilter,
  selectedSymbolFilter,
  onRefreshQuotes,
  isLoadingQuotes,
  onRemoveSymbol,
}: PortfolioOverviewProps) {
  if (quotes.length === 0) return null;

  // Calculate average portfolio daily performance
  const validQuotes = quotes.filter(q => q.price > 0);
  const avgChange = validQuotes.length > 0
    ? validQuotes.reduce((acc, q) => acc + q.changePercent, 0) / validQuotes.length
    : 0;
  const isPortfolioPositive = avgChange >= 0;

  return (
    <section className="portfolio-dashboard-panel" aria-label="Portfolio Overview">
      {/* Panel Header */}
      <div className="portfolio-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="portfolio-icon-badge">
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="portfolio-title">Live Portfolio & Watchlist</h2>
              <span className={`portfolio-avg-badge ${isPortfolioPositive ? 'positive' : 'negative'}`}>
                {isPortfolioPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{isPortfolioPositive ? '+' : ''}{avgChange.toFixed(2)}% Today</span>
              </span>
            </div>
            <p className="portfolio-subtitle">
              Real-time quotes via Yahoo Finance • Click any asset to filter tailored news
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onRefreshQuotes}
            disabled={isLoadingQuotes}
            className="btn-portfolio-action"
            title="Refresh Live Prices"
          >
            <RefreshCw size={14} style={{ animation: isLoadingQuotes ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Quotes</span>
          </button>

          <button
            onClick={onOpenManageModal}
            className="btn-portfolio-primary"
            title="Add or remove stocks"
          >
            <Plus size={15} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="portfolio-cards-grid">
        {quotes.map((quote) => {
          const isSelected = selectedSymbolFilter === quote.symbol;

          return (
            <div
              key={quote.symbol}
              onClick={() => onSelectSymbolFilter(isSelected ? '' : quote.symbol)}
              className={`portfolio-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="portfolio-card-top">
                <div>
                  <div className="portfolio-card-symbol">${quote.symbol}</div>
                  <div className="portfolio-card-name">{quote.shortName}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Price & Sparkline */}
              <div className="portfolio-card-middle">
                <div className="portfolio-card-price">{quote.formattedPrice}</div>
                
                {/* SVG Mini Sparkline */}
                {quote.sparkline && quote.sparkline.length > 2 && (
                  <svg className="sparkline-svg" viewBox="0 0 60 20" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={quote.isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      points={generateSparklinePoints(quote.sparkline, 60, 20)}
                    />
                  </svg>
                )}
              </div>

              {/* Day High / Low */}
              {quote.high && quote.low && (
                <div className="portfolio-card-range">
                  <span>L: ${quote.low.toFixed(2)}</span>
                  <div className="range-track">
                    <div
                      className="range-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((quote.price - quote.low) / (quote.high - quote.low || 1)) * 100))}%`,
                        backgroundColor: quote.isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      }}
                    />
                  </div>
                  <span>H: ${quote.high.toFixed(2)}</span>
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
