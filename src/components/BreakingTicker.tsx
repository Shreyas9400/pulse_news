'use client';

import React from 'react';
import { StockTickerItem } from '@/lib/types';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

interface BreakingTickerProps {
  tickers: StockTickerItem[];
  breakingHeadlines?: string[];
}

export default function BreakingTicker({ tickers, breakingHeadlines = [] }: BreakingTickerProps) {
  // Duplicate array to enable infinite seamless CSS loop
  const loopItems = [...tickers, ...tickers];

  return (
    <div className="ticker-wrapper" aria-label="Stock & Market Ticker">
      <div style={{ padding: '0 16px', background: 'var(--accent-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, height: '100%', display: 'flex', alignItems: 'center', zIndex: 2, letterSpacing: '0.05em' }}>
        MARKETS
      </div>
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
