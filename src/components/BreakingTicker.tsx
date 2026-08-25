'use client';

import React from 'react';
import { StockTickerItem } from '@/lib/types';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

interface BreakingTickerProps {
  tickers: StockTickerItem[];
  breakingHeadlines?: string[];
  onOpenPortfolio?: () => void;
}

export default function BreakingTicker({ tickers, breakingHeadlines = [], onOpenPortfolio }: BreakingTickerProps) {
  // Duplicate array to enable infinite seamless CSS loop
  const loopItems = [...tickers, ...tickers];

  return (
    <div className="ticker-wrapper" aria-label="Stock & Market Ticker">
      <button
        onClick={onOpenPortfolio}
        style={{
          padding: '0 14px',
          background: 'linear-gradient(135deg, var(--accent-primary), #06b6d4)',
          color: '#fff',
          fontSize: '0.72rem',
          fontWeight: 800,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 2,
          letterSpacing: '0.05em',
          border: 'none',
          cursor: 'pointer',
        }}
        title="Click to customize your Portfolio / Watchlist"
      >
        <span>MARKETS</span>
        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 4 }}>+ EDIT</span>
      </button>
      <div className="ticker-track">
        {loopItems.map((item, idx) => (
          <a
            key={`${item.symbol}-${idx}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ticker-item"
          >
            <span className="ticker-symbol">{item.symbol}</span>
            <span style={{ opacity: 0.6 }}>({item.name})</span>
            <span className="ticker-val">{item.price}</span>
            <span
              className={`ticker-val ${
                item.isPositive ? 'ticker-positive' : 'ticker-negative'
              }`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
            >
              {item.isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {item.change}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
