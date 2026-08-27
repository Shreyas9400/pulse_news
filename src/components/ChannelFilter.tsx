'use client';

import React from 'react';
import { CategoryId } from '@/lib/types';
import { getTickerMeta } from '@/lib/stock-aliases';
import { Bookmark, Newspaper, Wallet, BarChart3 } from 'lucide-react';

interface ChannelFilterProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  savedCount: number;
  portfolioCount?: number;
  sectorSymbols?: string[];
  activeSectorFilter?: string | null;
  onSelectSector?: (symbol: string) => void;
}

const CATEGORIES: { id: CategoryId; label: string; icon: any; isFeatured?: boolean }[] = [
  { id: 'brief', label: 'Portfolio', icon: Wallet, isFeatured: true },
  { id: 'portfolio', label: 'Portfolio News', icon: Newspaper },
  { id: 'all', label: 'Headlines', icon: BarChart3 },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export default function ChannelFilter({
  activeCategory,
  onSelectCategory,
  savedCount,
  portfolioCount = 0,
  sectorSymbols = [],
  activeSectorFilter,
  onSelectSector,
}: ChannelFilterProps) {
  return (
    <div className="channels-nav-wrapper">
      <nav className="channels-nav" aria-label="News Sections">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id && !activeSectorFilter;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`channel-pill ${isActive ? 'active' : ''} ${cat.isFeatured ? 'featured-pill' : ''}`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              {cat.id === 'portfolio' && portfolioCount > 0 && (
                <span className="pill-badge-count">{portfolioCount}</span>
              )}
              {cat.id === 'saved' && savedCount > 0 && (
                <span className="pill-badge-count">{savedCount}</span>
              )}
            </button>
          );
        })}

        {/* Dynamically generated from the user's own portfolio sector holdings */}
        {sectorSymbols.length > 0 && onSelectSector && (
          <>
            <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-subtle)', margin: '0 4px', flexShrink: 0 }} />
            {sectorSymbols.map((sym) => {
              const meta = getTickerMeta(sym);
              const isActive = activeSectorFilter === sym;
              return (
                <button
                  key={sym}
                  onClick={() => onSelectSector(sym)}
                  className={`channel-pill ${isActive ? 'active' : ''}`}
                  title={meta?.name || sym}
                >
                  <span>{meta?.name || sym.replace(/_/g, ' ')}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}
