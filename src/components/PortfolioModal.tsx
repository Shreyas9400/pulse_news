'use client';

import React, { useState } from 'react';
import { X, Plus, TrendingUp, Check, Layers, BarChart2 } from 'lucide-react';
import { getAvailableSectors, FULL_DIRECTORY, getTickerMeta } from '@/lib/stock-aliases';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: string[];
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const POPULAR_STOCKS = [
  'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD',
  'AVGO', 'TSM', 'PLTR', 'CRWD', 'CRM', 'NFLX', 'COIN',
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'SPY', 'QQQ',
];

const POPULAR_SECTORS = [
  'XLK', 'SMH', 'XLF', 'XLV', 'XBI', 'XLE', 'QCLN', 'CIBR', 'BOTZ', 'ITA', 'XLY',
];

export default function PortfolioModal({
  isOpen,
  onClose,
  portfolio,
  onAddSymbol,
  onRemoveSymbol,
}: PortfolioModalProps) {
  const [inputSymbol, setInputSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stocks' | 'sectors'>('stocks');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputSymbol.trim().toUpperCase();
    if (!clean) return;

    if (portfolio.includes(clean)) {
      setError(`"${clean}" is already in your portfolio.`);
      return;
    }

    onAddSymbol(clean);
    setInputSymbol('');
    setError(null);
  };

  const handleToggle = (sym: string) => {
    if (portfolio.includes(sym)) {
      onRemoveSymbol(sym);
    } else {
      onAddSymbol(sym);
    }
  };

  const stocksInPortfolio = portfolio.filter(s => {
    const meta = getTickerMeta(s);
    return !meta?.isSector;
  });

  const sectorsInPortfolio = portfolio.filter(s => {
    const meta = getTickerMeta(s);
    return meta?.isSector;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content portfolio-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-title-wrap">
            <div className="portfolio-icon-badge">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="modal-title-serif">Manage Portfolio & Sectors</h3>
              <p className="modal-subtitle">
                Stocks, ETFs & sector trackers with alias-enhanced intelligence
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAdd} className="portfolio-add-form">
          <input
            type="text"
            className="search-input portfolio-input"
            placeholder="Enter any ticker (e.g. NVDA, XLK, BTC-USD, SMH)..."
            value={inputSymbol}
            onChange={(e) => {
              setInputSymbol(e.target.value);
              setError(null);
            }}
            autoFocus
          />
          <button type="submit" className="btn-portfolio-primary" style={{ padding: '0 16px', height: 40 }}>
            <Plus size={15} />
            <span>Add</span>
          </button>
        </form>

        {error && <p className="form-error-msg">{error}</p>}

        {/* Toggle Tabs: Stocks vs Sectors */}
        <div className="portfolio-tabs">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`portfolio-tab ${activeTab === 'stocks' ? 'active' : ''}`}
          >
            <TrendingUp size={13} />
            <span>Stocks & Crypto ({stocksInPortfolio.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`portfolio-tab ${activeTab === 'sectors' ? 'active' : ''}`}
          >
            <BarChart2 size={13} />
            <span>Sectors & ETFs ({sectorsInPortfolio.length})</span>
          </button>
        </div>

        {/* Active Watchlist */}
        <div className="portfolio-watchlist-section">
          <h4 className="section-label-sm">
            {activeTab === 'stocks' ? 'Active Stock Watchlist' : 'Tracked Sectors'}
          </h4>

          {(activeTab === 'stocks' ? stocksInPortfolio : sectorsInPortfolio).length === 0 ? (
            <div className="empty-box-sm">
              {activeTab === 'stocks'
                ? 'No stocks in watchlist yet. Add tickers above or pick from suggestions.'
                : 'No sectors tracked yet. Add sector ETFs to monitor industry-level intelligence.'}
            </div>
          ) : (
            <div className="portfolio-chips-wrap">
              {(activeTab === 'stocks' ? stocksInPortfolio : sectorsInPortfolio).map((symbol) => {
                const meta = getTickerMeta(symbol);
                return (
                  <div key={symbol} className="active-symbol-chip">
                    <div className="chip-info">
                      <span className="chip-symbol">${symbol}</span>
                      {meta && <span className="chip-name">{meta.name}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSymbol(symbol)}
                      className="chip-remove-btn"
                      title={`Remove ${symbol}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggestions Grid */}
        <div className="portfolio-suggestions-section">
          <h4 className="section-label-sm">
            {activeTab === 'stocks' ? 'Popular Stocks & Crypto (Tap to Toggle)' : 'Available Sector Trackers (Tap to Toggle)'}
          </h4>
          <div className="suggestions-grid">
            {(activeTab === 'stocks' ? POPULAR_STOCKS : POPULAR_SECTORS).map((sym) => {
              const inPortfolio = portfolio.includes(sym);
              const meta = getTickerMeta(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleToggle(sym)}
                  className={`suggestion-chip-detailed ${inPortfolio ? 'active' : ''}`}
                  title={meta?.aliases.slice(0, 3).join(', ')}
                >
                  <div className="suggestion-chip-top">
                    {inPortfolio && <Check size={11} />}
                    <span className="suggestion-symbol">${sym}</span>
                  </div>
                  {meta && (
                    <span className="suggestion-name">{meta.name}</span>
                  )}
                  {meta && (
                    <span className="suggestion-industry">{meta.industry}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alias Info Box */}
        <div className="alias-info-box">
          <Layers size={14} />
          <div>
            <strong>Smart Search Integration</strong>
            <p>Every entity auto-generates Boolean search queries using aliases, CEO names, product lines, and sector keywords for comprehensive news coverage.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
