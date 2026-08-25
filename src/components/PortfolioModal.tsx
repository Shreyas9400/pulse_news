'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, TrendingUp, Sparkles, Check } from 'lucide-react';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: string[];
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const POPULAR_SUGGESTIONS = [
  'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD',
  'PLTR', 'COIN', 'NFLX', 'BTC-USD', 'ETH-USD', 'SPY', 'QQQ'
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Manage Your Portfolio</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track custom stocks, crypto, and receive tailored Yahoo Finance news
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter Ticker Symbol (e.g. NVDA, AAPL, TSLA, BTC-USD)..."
            value={inputSymbol}
            onChange={(e) => {
              setInputSymbol(e.target.value);
              setError(null);
            }}
            style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
            autoFocus
          />
          <button
            type="submit"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0 20px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.88rem',
            }}
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>

        {error && (
          <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: 14 }}>
            {error}
          </p>
        )}

        {/* Current Portfolio List */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
            Active Watchlist ({portfolio.length} symbols)
          </h4>
          {portfolio.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your portfolio is empty. Add symbols above or pick from popular tickers below.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {portfolio.map((symbol) => (
                <div
                  key={symbol}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                >
                  <span>${symbol}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSymbol(symbol)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0,
                    }}
                    title={`Remove ${symbol}`}
                  >
                    <Trash2 size={13} style={{ color: '#fb7185' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Suggestions */}
        <div>
          <h4 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
            Popular Market Movers (Click to toggle)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {POPULAR_SUGGESTIONS.map((sym) => {
              const inPortfolio = portfolio.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSuggestionClick(sym)}
                  style={{
                    background: inPortfolio ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-card)',
                    border: `1px solid ${inPortfolio ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                    color: inPortfolio ? '#34d399' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {inPortfolio && <Check size={12} />}
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
