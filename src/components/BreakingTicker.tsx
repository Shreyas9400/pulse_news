'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Edit3 } from 'lucide-react';

interface BreakingTickerProps {
  quotes: StockQuote[];
  onOpenPortfolio: () => void;
}

export default function BreakingTicker({ quotes, onOpenPortfolio }: BreakingTickerProps) {
  const displayQuotes = quotes.length > 0 ? quotes : [];
  const loopItems = [...displayQuotes, ...displayQuotes];

  return (
    <div className="ticker-wrapper" aria-label="Real-Time Market Ticker">
      <button
        onClick={onOpenPortfolio}
        className="ticker-badge-btn"
        title="Customize Portfolio"
      >
        <span className="ticker-live-dot" />
        <span className="ticker-badge-text">PORTFOLIO</span>
        <Edit3 size={11} className="ticker-edit-icon" />
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
            <span className="ticker-val">{item.formattedPrice}</span>
            <span
              className={`ticker-change-badge ${
                item.isPositive ? 'ticker-positive' : 'ticker-negative'
              }`}
            >
              {item.isPositive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {item.formattedChange}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
