'use client';

import React, { useState } from 'react';
import { X, Plus, TrendingUp, Check, BarChart2, Tag, Building2, Search, Zap, FileText, Edit2, RotateCcw } from 'lucide-react';
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

  // Public vs Private company toggle
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Stock inputs
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockName, setStockName] = useState('');
  const [stockCik, setStockCik] = useState('');
  const [stockAliases, setStockAliases] = useState('');

  // Sector inputs (Pure Name — No Ticker)
  const [sectorName, setSectorName] = useState('');
  const [sectorAliases, setSectorAliases] = useState('');

  // Editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Auto-generate internal private company ID from name
  const generatePrivateId = (name: string) =>
    'PRIV_' + name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24);

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

  // Start editing a stock
  const handleStartEditStock = (symbol: string) => {
    const meta = getTickerMeta(symbol);
    setEditingKey(symbol);
    setStockSymbol(symbol);
    setStockName(meta?.name || symbol);
    setStockCik(meta?.cik || DEFAULT_CIK_DIRECTORY[symbol] || '');
    setStockAliases(meta?.aliases ? meta.aliases.join(', ') : '');
    setActiveTab('stocks');
    setError(null);
  };

  // Start editing a sector
  const handleStartEditSector = (sectorId: string) => {
    const meta = getTickerMeta(sectorId);
    setEditingKey(sectorId);
    setSectorName(meta?.name || sectorId.replace(/_/g, ' '));
    setSectorAliases(meta?.aliases ? meta.aliases.join(', ') : '');
    setActiveTab('sectors');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setStockSymbol('');
    setStockName('');
    setStockCik('');
    setStockAliases('');
    setSectorName('');
    setSectorAliases('');
    setError(null);
    setIsPrivate(false);
  };

  // Add or Save Stock / Private Company
  const handleAddOrSaveStock = (e: React.FormEvent) => {
    e.preventDefault();

    let clean = stockSymbol.trim().toUpperCase();

    if (isPrivate) {
      // For private companies, ticker is optional — auto-generate from name if blank
      if (!clean && !stockName.trim()) {
        setError('PLEASE ENTER A COMPANY NAME (TICKER IS OPTIONAL FOR PRIVATE COMPANIES).');
        return;
      }
      if (!clean) {
        clean = generatePrivateId(stockName);
      }
    } else {
      if (!clean) {
        setError('PLEASE ENTER A TICKER SYMBOL.');
        return;
      }
    }

    if (!editingKey && portfolio.includes(clean)) {
      setError(`"${clean}" IS ALREADY IN YOUR WATCHLIST.`);
      return;
    }

    const aliasesList = stockAliases
      .split(',')
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);

    const resolvedCik = stockCik.trim() || DEFAULT_CIK_DIRECTORY[clean] || '';

    const customMeta: Partial<TickerMetadata & { cik?: string; isPrivate?: boolean }> = {
      symbol: clean,
      name: (stockName.trim() || clean).toUpperCase(),
      aliases: aliasesList,
      industry: isPrivate ? 'PRIVATE COMPANY / UNLISTED CREDIT' : 'EQUITIES & FIXED INCOME',
      isSector: false,
      ...(isPrivate ? { isPrivate: true } : {}),
      ...(resolvedCik ? { cik: resolvedCik } : {}),
    };

    saveCustomMetadata(clean, customMeta);
    onAddSymbol(clean, customMeta);

    handleCancelEdit();
  };

  // Add or Save Sector
  const handleAddOrSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    const nameClean = sectorName.trim().toUpperCase();
    if (!nameClean) {
      setError('PLEASE ENTER A SECTOR NAME.');
      return;
    }

    const sectorId = nameClean.replace(/\s+/g, '_');
    if (!editingKey && (portfolio.includes(sectorId) || portfolio.includes(nameClean))) {
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

    handleCancelEdit();
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
                ADD, EDIT ISSUER NAMES, SEC CIK & ALIASES, OR TRACK SECTORS
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

        {/* Form Mode 1: Stocks / Private Companies (Ticker + Name + SEC CIK + Aliases) */}
        {activeTab === 'stocks' ? (
          <form onSubmit={handleAddOrSaveStock} className="portfolio-detailed-form">
            {editingKey && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, background: 'rgba(212, 175, 55, 0.12)', padding: '6px 10px', borderRadius: 2, border: '1px solid var(--accent-gold)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  EDITING ISSUER: {editingKey}
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  <RotateCcw size={11} /> CANCEL
                </button>
              </div>
            )}

            {/* Public / Private Company Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>COMPANY TYPE:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setIsPrivate(false); setError(null); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${!isPrivate ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    background: !isPrivate ? 'rgba(212,175,55,0.15)' : 'transparent',
                    color: !isPrivate ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <TrendingUp size={12} /> PUBLIC (LISTED)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPrivate(true); setError(null); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isPrivate ? '#6366f1' : 'var(--border-subtle)'}`,
                    background: isPrivate ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isPrivate ? '#818cf8' : 'var(--text-muted)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Building2 size={12} /> PRIVATE (UNLISTED)
                </button>
              </div>
              {isPrivate && (
                <span style={{ fontSize: '0.7rem', color: '#818cf8', marginLeft: 4 }}>
                  Ticker is optional — auto-generated if blank
                </span>
              )}
            </div>

            <div className="form-fields-grid">
              {/* Ticker Symbol */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <Tag size={12} />
                  <span>TICKER SYMBOL {isPrivate ? '(OPTIONAL FOR PRIVATE)' : '*'}</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder={isPrivate ? 'OPTIONAL — E.G. BAIN-CREDIT, APOLLO-FI (OR LEAVE BLANK)' : 'E.G. NVDA, JPM, CCLFX, BCSF'}
                  value={stockSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  autoFocus={!isPrivate}
                  style={isPrivate ? { borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)' } : {}}
                />
                {isPrivate && !stockSymbol && stockName && (
                  <span className="form-field-hint" style={{ color: '#818cf8' }}>
                    AUTO-ID: {generatePrivateId(stockName)}
                  </span>
                )}
              </div>

              {/* Company Name */}
              <div className="form-field-group">
                <label className="form-field-label">
                  <Building2 size={12} />
                  <span>EDIT ISSUER / COMPANY NAME</span>
                </label>
                <input
                  type="text"
                  className="search-input portfolio-input"
                  placeholder="E.G. CLIFFWATER CORPORATE LENDING FUND"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value.toUpperCase())}
                />
              </div>

              {/* SEC CIK */}
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
                  placeholder="E.G. CLIFFWATER, DIRECT LENDING, PRIVATE CREDIT"
                  value={stockAliases}
                  onChange={(e) => setStockAliases(e.target.value.toUpperCase())}
                />
                <span className="form-field-hint">
                  Auto-syncs Boolean search queries to pull recent credit intelligence.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              {editingKey && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-portfolio-action"
                  style={{ height: 42, fontSize: '0.85rem' }}
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                className="btn-portfolio-primary"
                style={{ padding: '0 20px', height: 42, fontSize: '0.85rem' }}
              >
                {editingKey ? <Check size={15} /> : <Plus size={15} />}
                <span>{editingKey ? 'SAVE CHANGES' : 'ADD ISSUER TO WATCHLIST'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Form Mode 2: Sectors (Pure Name + Search Aliases — NO TICKER) */
          <form onSubmit={handleAddOrSaveSector} className="portfolio-detailed-form">
            {editingKey && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, background: 'rgba(212, 175, 55, 0.12)', padding: '6px 10px', borderRadius: 2, border: '1px solid var(--accent-gold)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  EDITING SECTOR: {editingKey}
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  <RotateCcw size={11} /> CANCEL
                </button>
              </div>
            )}

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
                  placeholder="E.G. SEMICONDUCTORS, US FIXED INCOME, DIRECT LENDING"
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
                  placeholder="E.G. PRIVATE CREDIT, LOANS, TREASURIES, CREDIT SPREADS"
                  value={sectorAliases}
                  onChange={(e) => setSectorAliases(e.target.value.toUpperCase())}
                />
                <span className="form-field-hint">
                  SEARCH QUERIES WILL AGGREGATE ALL INDUSTRY & THEMATIC CREDIT DISPATCHES.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              {editingKey && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-portfolio-action"
                  style={{ height: 42, fontSize: '0.85rem' }}
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                className="btn-portfolio-primary"
                style={{ padding: '0 20px', height: 42, fontSize: '0.85rem', background: 'var(--accent-gold)', color: '#121212' }}
              >
                {editingKey ? <Check size={15} /> : <Plus size={15} />}
                <span>{editingKey ? 'SAVE SECTOR CHANGES' : 'ADD SECTOR TRACKER'}</span>
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
                      {meta?.cik && <span style={{ fontSize: '0.62rem', color: 'var(--accent-gold)' }}>CIK: {meta.cik}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (meta?.isSector) handleStartEditSector(symbol);
                          else handleStartEditStock(symbol);
                        }}
                        className="chip-remove-btn"
                        title={`Edit ${symbol}`}
                        style={{ color: 'var(--accent-gold)' }}
                      >
                        <Edit2 size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveSymbol(symbol)}
                        className="chip-remove-btn"
                        title={`Remove ${symbol}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
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
