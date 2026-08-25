'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, TrendingUp, Check } from 'lucide-react';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: string[];
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const POPULAR_SUGGESTIONS = [
  'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD',
  'PLTR', 'COIN', 'BTC-USD', 'ETH-USD', 'SPY', 'QQQ'
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

  const handleSuggestionClick = (sym: string) => {
    if (portfolio.includes(sym)) {
      onRemoveSymbol(sym);
    } else {
      onAddSymbol(sym);
    }
  };

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
              <h3 className="modal-title-serif">Manage Watchlist</h3>
              <p className="modal-subtitle">Track custom stocks, crypto & industry leaders</p>
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
            placeholder="Enter Ticker Symbol (e.g. NVDA, AAPL, TSLA, BTC-USD)..."
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

        {/* Active Watchlist List */}
        <div className="portfolio-watchlist-section">
          <h4 className="section-label-sm">Active Watchlist ({portfolio.length})</h4>
          {portfolio.length === 0 ? (
            <div className="empty-box-sm">
              Your watchlist is empty. Add symbols above or pick below.
            </div>
          ) : (
            <div className="portfolio-chips-wrap">
              {portfolio.map((symbol) => (
                <div key={symbol} className="active-symbol-chip">
                  <span>${symbol}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSymbol(symbol)}
                    className="chip-remove-btn"
                    title={`Remove ${symbol}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Suggestions */}
        <div className="portfolio-suggestions-section">
          <h4 className="section-label-sm">Market Movers (Tap to Toggle)</h4>
          <div className="suggestions-grid">
            {POPULAR_SUGGESTIONS.map((sym) => {
              const inPortfolio = portfolio.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSuggestionClick(sym)}
                  className={`suggestion-chip ${inPortfolio ? 'active' : ''}`}
                >
                  {inPortfolio && <Check size={11} />}
                  <span>${sym}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
