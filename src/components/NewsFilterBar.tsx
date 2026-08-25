'use client';

import React from 'react';
import { Filter, SlidersHorizontal, Sparkles, Check, X, Tag } from 'lucide-react';

interface NewsFilterBarProps {
  portfolioSymbols: string[];
  selectedEntityFilter: string;
  onSelectEntityFilter: (entity: string) => void;
  selectedSentimentFilter: 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  onSelectSentimentFilter: (sentiment: 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') => void;
  sortBy: 'newest' | 'sentiment' | 'relevance';
  onSelectSortBy: (sort: 'newest' | 'sentiment' | 'relevance') => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export default function NewsFilterBar({
  portfolioSymbols,
  selectedEntityFilter,
  onSelectEntityFilter,
  selectedSentimentFilter,
  onSelectSentimentFilter,
  sortBy,
  onSelectSortBy,
  totalCount,
  filteredCount,
  onResetFilters,
}: NewsFilterBarProps) {
  const isFiltered = selectedEntityFilter !== 'ALL' || selectedSentimentFilter !== 'ALL' || sortBy !== 'newest';

  return (
    <div className="news-filter-bar">
      <div className="news-filter-bar-header">
        <div className="filter-title-wrap">
          <SlidersHorizontal size={14} color="var(--accent-gold)" />
          <span className="filter-title">INTELLIGENCE WIRE FILTERS</span>
          <span className="filter-count-badge">
            SHOWING {filteredCount} OF {totalCount} STORIES
          </span>
        </div>

        {isFiltered && (
          <button onClick={onResetFilters} className="btn-reset-filters" title="Reset all filters">
            <X size={12} />
            <span>RESET FILTERS</span>
          </button>
        )}
      </div>

      <div className="filter-controls-row">
        {/* Entity / Asset Selector */}
        <div className="filter-group">
          <label className="filter-label">
            <Tag size={11} />
            <span>ENTITY:</span>
          </label>
          <select
            value={selectedEntityFilter}
            onChange={(e) => onSelectEntityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">ALL ENTITIES & SECTORS ({portfolioSymbols.length})</option>
            {portfolioSymbols.map((sym) => (
              <option key={sym} value={sym}>
                {sym.startsWith('^') ? '' : sym.includes('_') ? '' : '$'}{sym.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Sentiment Selector */}
        <div className="filter-group">
          <label className="filter-label">
            <Sparkles size={11} />
            <span>SENTIMENT:</span>
          </label>
          <div className="sentiment-filter-buttons">
            <button
              onClick={() => onSelectSentimentFilter('ALL')}
              className={`sentiment-filter-btn ${selectedSentimentFilter === 'ALL' ? 'active' : ''}`}
            >
              ALL
            </button>
            <button
              onClick={() => onSelectSentimentFilter('POSITIVE')}
              className={`sentiment-filter-btn pos ${selectedSentimentFilter === 'POSITIVE' ? 'active' : ''}`}
            >
              🟢 POSITIVE
            </button>
            <button
              onClick={() => onSelectSentimentFilter('NEGATIVE')}
              className={`sentiment-filter-btn neg ${selectedSentimentFilter === 'NEGATIVE' ? 'active' : ''}`}
            >
              🔴 NEGATIVE
            </button>
            <button
              onClick={() => onSelectSentimentFilter('NEUTRAL')}
              className={`sentiment-filter-btn neu ${selectedSentimentFilter === 'NEUTRAL' ? 'active' : ''}`}
            >
              ⚪ NEUTRAL
            </button>
          </div>
        </div>

        {/* Sort By Selector */}
        <div className="filter-group ml-auto">
          <label className="filter-label">SORT:</label>
          <select
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="relevance">MOST RELEVANT</option>
            <option value="sentiment">CREDIT RISK / SPREAD IMPACT</option>
          </select>
        </div>
      </div>
    </div>
  );
}
