'use client';

import React, { useState } from 'react';
import { X, Plus, TrendingUp, Check, Layers, BarChart2, Tag, Building2, Search, Info } from 'lucide-react';
import { getAvailableSectors, FULL_DIRECTORY, getTickerMeta, saveCustomMetadata, TickerMetadata } from '@/lib/stock-aliases';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: string[];
  onAddSymbol: (symbol: string, meta?: Partial<TickerMetadata>) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const POPULAR_STOCKS = [
  'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD',
  'AVGO', 'TSM', 'PLTR', 'CRWD', 'CRM', 'NFLX', 'COIN',
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'SPY', 'QQQ',
];

const POPULAR_SECTORS = [
  'XLK', 'SMH', 'SOXX', 'XLF', 'XLV', 'XBI', 'XLE', 'QCLN', 'CIBR', 'BOTZ', 'ITA', 'XLY',
];

export default function PortfolioModal({
  isOpen,
  onClose,
  portfolio,
  onAddSymbol,
  onRemoveSymbol,
}: PortfolioModalProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'sectors'>('stocks');
  const [inputSymbol, setInputSymbol] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputAliases, setInputAliases] = useState('');
  const [entityType, setEntityType] = useState<'stock' | 'sector' | 'crypto'>('stock');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputSymbol.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a ticker symbol.');
      return;
    }

    if (portfolio.includes(clean)) {
      setError(`"${clean}" is already in your portfolio.`);
      return;
    }

    const aliasesList = inputAliases
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const isSector = activeTab === 'sectors' || entityType === 'sector';

    const customMeta: Partial<TickerMetadata> = {
      symbol: clean,
      name: inputName.trim() || clean,
      aliases: aliasesList,
      industry: isSector ? 'Sector ETF' : entityType === 'crypto' ? 'Digital Assets' : 'Equities',
      isSector,
    };

    // Persist to custom metadata
    saveCustomMetadata(clean, customMeta);
    onAddSymbol(clean, customMeta);

    // Reset inputs
    setInputSymbol('');
    setInputName('');
    setInputAliases('');
    setError(null);
  };

  const handleToggle = (sym: string) => {
    if (portfolio.includes(sym)) {
      onRemoveSymbol(sym);
    } else {
      const meta = getTickerMeta(sym);
      onAddSymbol(sym, meta || undefined);
    }
  };

  const stocksInPortfolio = portfolio.filter((s) => {
    const meta = getTickerMeta(s);
    return !meta?.isSector;
  });

  const sectorsInPortfolio = portfolio.filter((s) => {
    const meta = getTickerMeta(s);
    return !!meta?.isSector;
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
              <h3 className="modal-title-serif">Manage Watchlist & Sectors</h3>
              <p className="modal-subtitle">
                Configure tickers, custom search aliases, and industry sectors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        {/* Toggle Tabs: Stocks vs Sectors */}
        <div className="portfolio-tabs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('stocks');
              setEntityType('stock');
            }}
            className={`portfolio-tab ${activeTab === 'stocks' ? 'active' : ''}`}
          >
            <TrendingUp size={13} />
            <span>Stocks & Crypto ({stocksInPortfolio.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sectors');
              setEntityType('sector');
            }}
            className={`portfolio-tab ${activeTab === 'sectors' ? 'active' : ''}`}
          >
            <BarChart2 size={13} />
            <span>Sectors & ETFs ({sectorsInPortfolio.length})</span>
          </button>
        </div>

        {/* Separate Inputs Form */}
        <form onSubmit={handleAdd} className="portfolio-detailed-form">
          <div className="form-fields-grid">
            {/* Field 1: Ticker Symbol */}
            <div className="form-field-group">
              <label className="form-field-label">
                <Tag size={12} />
                <span>Ticker Symbol *</span>
              </label>
              <input
                type="text"
                className="search-input portfolio-input"
                placeholder={activeTab === 'stocks' ? 'e.g. NVDA, AAPL, BTC-USD' : 'e.g. XLK, SMH, XBI'}
                value={inputSymbol}
                onChange={(e) => {
                  setInputSymbol(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
            </div>

            {/* Field 2: Company / Sector Name */}
            <div className="form-field-group">
              <label className="form-field-label">
                <Building2 size={12} />
                <span>Company / Sector Name</span>
              </label>
              <input
                type="text"
                className="search-input"
                placeholder={activeTab === 'stocks' ? 'e.g. NVIDIA Corporation' : 'e.g. Tech Select Sector SPDR'}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
              />
            </div>

            {/* Field 3: Search Aliases */}
            <div className="form-field-group full-width">
              <label className="form-field-label">
                <Search size={12} />
                <span>Search Aliases & Boolean Keywords (comma separated)</span>
              </label>
              <input
                type="text"
                className="search-input"
                placeholder={activeTab === 'stocks' ? 'e.g. Jensen Huang, Blackwell GPU, GeForce, AI chips' : 'e.g. semiconductor index, fab capacity, TSMC supply'}
                value={inputAliases}
                onChange={(e) => setInputAliases(e.target.value)}
              />
              <span className="form-field-hint">
                These aliases power Google News Boolean operators (`${inputSymbol || 'TICKER'} OR "Jensen Huang"`) to surface hidden intelligence.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="submit"
              className="btn-portfolio-primary"
              style={{ padding: '0 20px', height: 42, fontSize: '0.85rem' }}
            >
              <Plus size={15} />
              <span>Add to {activeTab === 'stocks' ? 'Watchlist' : 'Sectors'}</span>
            </button>
          </div>
        </form>

        {error && <p className="form-error-msg">{error}</p>}

        {/* Active Watchlist */}
        <div className="portfolio-watchlist-section">
          <h4 className="section-label-sm">
            {activeTab === 'stocks' ? `Active Stocks (${stocksInPortfolio.length})` : `Tracked Sectors (${sectorsInPortfolio.length})`}
          </h4>

          {(activeTab === 'stocks' ? stocksInPortfolio : sectorsInPortfolio).length === 0 ? (
            <div className="empty-box-sm">
              {activeTab === 'stocks'
                ? 'No individual stocks added yet. Add custom tickers above or select from popular companies.'
                : 'No sector trackers added yet. Add sector ETFs (e.g. XLK, SMH) to monitor industry-wide developments.'}
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
            {activeTab === 'stocks' ? 'Suggested Stocks & Crypto' : 'Suggested Sector & ETF Trackers'}
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
                  {meta && <span className="suggestion-name">{meta.name}</span>}
                  {meta && <span className="suggestion-industry">{meta.industry}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
