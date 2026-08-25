'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Edit3 } from 'lucide-react';

interface BreakingTickerProps {
  quotes: StockQuote[];
  onOpenPortfolio: () => void;
}

export default function BreakingTicker({ quotes, onOpenPortfolio }: BreakingTickerProps) {
  // If quotes are empty, show fallback indices while loading
  const displayQuotes = quotes.length > 0 ? quotes : [];
  const loopItems = [...displayQuotes, ...displayQuotes];

  return (
    <div className="ticker-wrapper" aria-label="Real-Time Yahoo Finance Ticker">
      <button
        onClick={onOpenPortfolio}
        className="ticker-badge-btn"
        title="Click to edit your Portfolio Watchlist"
      >
        <span className="ticker-live-dot" />
        <span>PORTFOLIO</span>
        <Edit3 size={11} style={{ opacity: 0.8 }} />
      </button>

      <div className="ticker-track">
        {loopItems.map((item, idx) => (
          <a
            key={`${item.symbol}-${idx}`}
            href={`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ticker-item"
          >
            <span className="ticker-symbol">${item.symbol}</span>
            <span className="ticker-name">({item.shortName})</span>
            <span className="ticker-val">{item.formattedPrice}</span>
            <span
              className={`ticker-change-badge ${
                item.isPositive ? 'ticker-positive' : 'ticker-negative'
              }`}
            >
              {item.isPositive ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              {item.formattedChange}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
