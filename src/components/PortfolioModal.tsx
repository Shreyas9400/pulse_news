'use client';

import React, { useState } from 'react';
import { X, Plus, TrendingUp, Check, BarChart2, Tag, Building2, Search, Zap, FileText } from 'lucide-react';
import { SECTOR_DIRECTORY, getTickerMeta, saveCustomMetadata, TickerMetadata } from '@/lib/stock-aliases';
import { DEFAULT_CIK_DIRECTORY } from '@/lib/sec-edgar';

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
  'BTC-USD', 'ETH-USD', 'SOL-USD',
];

const PRESET_SECTORS = Object.keys(SECTOR_DIRECTORY);

export default function PortfolioModal({
  isOpen,
  onClose,
  portfolio,
  onAddSymbol,
  onRemoveSymbol,
}: PortfolioModalProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'sectors'>('stocks');
  
  // Stock inputs
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockName, setStockName] = useState('');
  const [stockCik, setStockCik] = useState('');
  const [stockAliases, setStockAliases] = useState('');

  // Sector inputs (Pure Name — No Ticker)
  const [sectorName, setSectorName] = useState('');
  const [sectorAliases, setSectorAliases] = useState('');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-fill CIK when user types ticker symbol
  const handleSymbolChange = (val: string) => {
    const clean = val.toUpperCase();
    setStockSymbol(clean);
    setError(null);

    // Auto-populate CIK if found in directory and CIK is empty
    if (DEFAULT_CIK_DIRECTORY[clean] && !stockCik) {
      setStockCik(DEFAULT_CIK_DIRECTORY[clean]);
    }
  };

  // Add Stock (with Ticker + Name + CIK + Aliases)
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stockSymbol.trim().toUpperCase();
    if (!clean) {
      setError('PLEASE ENTER A TICKER SYMBOL.');
      return;
    }

    if (portfolio.includes(clean)) {
      setError(`"${clean}" IS ALREADY IN YOUR WATCHLIST.`);
      return;
    }

    const aliasesList = stockAliases
      .split(',')
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);

    const resolvedCik = stockCik.trim() || DEFAULT_CIK_DIRECTORY[clean] || '';

    const customMeta: Partial<TickerMetadata & { cik?: string }> = {
      symbol: clean,
      name: (stockName.trim() || clean).toUpperCase(),
      aliases: aliasesList,
      industry: 'EQUITIES & FIXED INCOME',
      isSector: false,
      ...(resolvedCik ? { cik: resolvedCik } : {}),
    };

    saveCustomMetadata(clean, customMeta);
    onAddSymbol(clean, customMeta);

    setStockSymbol('');
    setStockName('');
    setStockCik('');
    setStockAliases('');
    setError(null);
  };

  // Add Sector (Pure Name + Aliases — NO TICKER)
  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    const nameClean = sectorName.trim().toUpperCase();
    if (!nameClean) {
      setError('PLEASE ENTER A SECTOR NAME.');
      return;
    }

    const sectorId = nameClean.replace(/\s+/g, '_');
    if (portfolio.includes(sectorId) || portfolio.includes(nameClean)) {
      setError(`"${nameClean}" IS ALREADY IN YOUR SECTORS.`);
      return;
    }

    const aliasesList = sectorAliases
      .split(',')
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);

    const customMeta: Partial<TickerMetadata> = {
      symbol: sectorId,
      name: nameClean,
      aliases: [nameClean, ...aliasesList],
      industry: 'SECTOR INTELLIGENCE',
      isSector: true,
    };

    saveCustomMetadata(sectorId, customMeta);
    onAddSymbol(sectorId, customMeta);

    setSectorName('');
    setSectorAliases('');
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
              <h3 className="modal-title-serif">PORTFOLIO & SEC FILINGS CIK MANAGER</h3>
              <p className="modal-subtitle">
                TRACK US FIXED INCOME ISSUERS (WITH SEC CIK FOR 10-K/10-Q/8-K) OR INDUSTRY SECTORS
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
              setError(null);
            }}
            className={`portfolio-tab ${activeTab === 'stocks' ? 'active' : ''}`}
          >
            <TrendingUp size={13} />
            <span>ISSUERS & STOCKS ({stocksInPortfolio.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sectors');
              setError(null);
            }}
            className={`portfolio-tab ${activeTab === 'sectors' ? 'active' : ''}`}
          >
            <BarChart2 size={13} />
            <span>SECTORS (PURE NAMES) ({sectorsInPortfolio.length})</span>
          </button>
        </div>

        {/* Form Mode 1: Stocks (Ticker + Name + SEC CIK + Aliases) */}
        {activeTab === 'stocks' ? (
          <form onSubmit={handleAddStock} className="portfolio-detailed-form">
            <div className="form-fields-grid">
              {/* Ticker Symbol */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <Tag size={12} />
                  <span>TICKER SYMBOL *</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. NVDA, JPM, AAPL, MSFT"
                  value={stockSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Company Name */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <Building2 size={12} />
                  <span>ISSUER / COMPANY NAME</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. NVIDIA CORPORATION"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value.toUpperCase())}
                />
              </div>

              {/* SEC CIK (Crucial for 10-K/10-Q EDGAR Credit Filings) */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <FileText size={12} color="var(--accent-gold)" />
                  <span>SEC CIK NUMBER (FOR 10-K / 10-Q / 8-K FILINGS)</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. 0001045810 (AUTO-RESOLVED IF BLANK)"
                  value={stockCik}
                  onChange={(e) => setStockCik(e.target.value.toUpperCase())}
                />
                <span className="form-field-hint">
                  Used to fetch SEC EDGAR debt disclosures, 10-K balance sheets, 10-Q cash flows, and 8-K material credit events.
                </span>
              </div>

              {/* Aliases */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <Search size={12} />
                  <span>SEARCH ALIASES & BOOLEAN OPERATORS</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. JENSEN HUANG, BLACKWELL GPU, AI CHIPS"
                  value={stockAliases}
                  onChange={(e) => setStockAliases(e.target.value.toUpperCase())}
                />
                <span className="form-field-hint">
                  Auto-syncs Boolean search queries to pull recent credit intelligence.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="submit"
                className="btn-portfolio-primary"
                style={{ padding: '0 20px', height: 42, fontSize: '0.85rem' }}
              >
                <Plus size={15} />
                <span>ADD ISSUER TO WATCHLIST</span>
              </button>
            </div>
          </form>
        ) : (
          /* Form Mode 2: Sectors (Pure Name + Search Aliases — NO TICKER) */
          <form onSubmit={handleAddSector} className="portfolio-detailed-form">
            <div className="form-fields-grid">
              {/* Sector Name */}
              <div className="form-field-group full-width">
                <label className="form-field-label">
                  <Zap size={12} />
                  <span>SECTOR / INDUSTRY NAME * (NO TICKER REQUIRED)</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. SEMICONDUCTORS, US FIXED INCOME, US BANKING"
                  value={sectorName}
                  onChange={(e) => {
                    setSectorName(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  autoFocus
                />
              </div>

              {/* Sector Search Aliases */}
              <div className="form-field-group full-width">
                <label className="form-field-label">
                  <Search size={12} />
                  <span>SECTOR ALIASES & KEYWORDS (COMMA SEPARATED)</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. CHIPS, FAB CAPACITY, TREASURIES, CREDIT SPREADS"
                  value={sectorAliases}
                  onChange={(e) => setSectorAliases(e.target.value.toUpperCase())}
                />
                <span className="form-field-hint">
                  SEARCH QUERIES WILL AGGREGATE ALL INDUSTRY & THEMATIC CREDIT DISPATCHES.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                className="btn-portfolio-primary"
                style={{ padding: '0 20px', height: 42, fontSize: '0.85rem', background: 'var(--accent-gold)', color: '#121212' }}
              >
                <Plus size={15} />
                <span>ADD SECTOR TRACKER</span>
              </button>
            </div>
          </form>
        )}

        {error && <p className="form-error-msg">{error}</p>}

        {/* Active Watchlist / Sector List */}
        <div className="portfolio-watchlist-section">
          <h4 className="section-label-sm">
            {activeTab === 'stocks'
              ? `ACTIVE ISSUERS & STOCKS (${stocksInPortfolio.length})`
              : `TRACKED SECTORS (${sectorsInPortfolio.length})`}
          </h4>

          {(activeTab === 'stocks' ? stocksInPortfolio : sectorsInPortfolio).length === 0 ? (
            <div className="empty-box-sm">
              {activeTab === 'stocks'
                ? 'NO ISSUERS ADDED YET. ADD CUSTOM TICKERS/CIK ABOVE OR PICK FROM SUGGESTIONS.'
                : 'NO SECTORS ADDED YET. ADD INDUSTRY NAMES ABOVE (E.G. SEMICONDUCTORS) OR SELECT PRESETS BELOW.'}
            </div>
          ) : (
            <div className="portfolio-chips-wrap">
              {(activeTab === 'stocks' ? stocksInPortfolio : sectorsInPortfolio).map((symbol) => {
                const meta = getTickerMeta(symbol);
                return (
                  <div key={symbol} className="active-symbol-chip">
                    <div className="chip-info">
                      <span className="chip-symbol">
                        {meta?.isSector ? '' : '$'}{meta?.name || symbol}
                      </span>
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
            {activeTab === 'stocks' ? 'CORE US ISSUERS & LIQUID EQUITIES (TAP TO TOGGLE)' : 'CORE INDUSTRY SECTORS (TAP TO TOGGLE)'}
          </h4>
          <div className="suggestions-grid">
            {(activeTab === 'stocks' ? POPULAR_STOCKS : PRESET_SECTORS).map((sym) => {
              const inPortfolio = portfolio.includes(sym);
              const meta = getTickerMeta(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleToggle(sym)}
                  className={`suggestion-chip-detailed ${inPortfolio ? 'active' : ''}`}
                >
                  <div className="suggestion-chip-top">
                    {inPortfolio && <Check size={11} />}
                    <span className="suggestion-symbol">
                      {meta?.isSector ? '' : '$'}{meta?.name || sym}
                    </span>
                  </div>
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
