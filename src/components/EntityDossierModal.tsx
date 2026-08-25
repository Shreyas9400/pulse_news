'use client';

import React, { useMemo } from 'react';
import { StockQuote, NewsArticle } from '@/lib/types';
import { getTickerMeta, getSymbolDisplayInfo } from '@/lib/stock-aliases';
import {
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Zap,
  BookOpen,
  ExternalLink,
  Layers,
  Search,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface EntityDossierModalProps {
  symbol: string | null;
  quote?: StockQuote;
  articles: NewsArticle[];
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
  onFilterHomeFeed: (symbol: string) => void;
}

export default function EntityDossierModal({
  symbol,
  quote,
  articles,
  isOpen,
  onClose,
  onSelectArticle,
  onFilterHomeFeed,
}: EntityDossierModalProps) {
  if (!isOpen || !symbol) return null;

  const cleanSym = symbol.toUpperCase();
  const meta = getTickerMeta(cleanSym);
  const info = getSymbolDisplayInfo(cleanSym);

  // Filter articles matching this entity
  const matchedArticles = useMemo(() => {
    const searchTerms = [
      cleanSym.toLowerCase(),
      info.name.toLowerCase(),
      ...info.aliases.map((a) => a.toLowerCase()),
    ].filter(Boolean);

    return articles.filter((article) => {
      const text = `${article.title} ${article.description} ${article.source}`.toLowerCase();
      return searchTerms.some((t) => text.includes(t));
    });
  }, [articles, cleanSym, info]);

  // Compute AI Materiality & Sentiment Metrics
  const analysis = useMemo(() => {
    let pos = 0;
    let neg = 0;
    matchedArticles.forEach((a) => {
      if (a.sentiment === 'positive') pos++;
      else if (a.sentiment === 'negative') neg++;
    });

    const total = matchedArticles.length || 1;
    let sentiment: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
    let sentimentScore = 50;

    if (pos > neg) {
      sentiment = 'Bullish';
      sentimentScore = Math.min(95, 55 + Math.round((pos / total) * 40));
    } else if (neg > pos) {
      sentiment = 'Bearish';
      sentimentScore = Math.max(15, 45 - Math.round((neg / total) * 35));
    }

    // Determine Materiality Level
    const materialityLevel =
      matchedArticles.length >= 4 || Math.abs((quote?.changePercent || 0)) > 2.5
        ? 'High Materiality'
        : matchedArticles.length >= 2
        ? 'Moderate Materiality'
        : 'Standard Monitoring';

    const materialityColor =
      materialityLevel === 'High Materiality'
        ? '#f43f5e'
        : materialityLevel === 'Moderate Materiality'
        ? '#d4af37'
        : '#10b981';

    return {
      sentiment,
      sentimentScore,
      materialityLevel,
      materialityColor,
      storyCount: matchedArticles.length,
      pos,
      neg,
    };
  }, [matchedArticles, quote]);

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dossier-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header-row" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-sm)',
                background: info.isSector
                  ? 'linear-gradient(135deg, #d4af37 0%, #990f3d 100%)'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}
            >
              {info.isSector ? <BarChart3 size={20} /> : <Activity size={20} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
                  ${cleanSym}
                </h3>
                <span className="edition-badge" style={{ background: info.isSector ? 'var(--accent-gold)' : 'var(--accent-primary)', color: info.isSector ? '#121212' : '#fff' }}>
                  {info.isSector ? 'SECTOR ETF' : 'EQUITY'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {info.industry}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {info.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" title="Close Dossier" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Live Market Price & Intraday Metrics Bar */}
        {quote && quote.price > 0 && (
          <div className="dossier-price-banner">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live Price
              </div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                {quote.formattedPrice}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className={`portfolio-change-chip ${quote.isPositive ? 'positive' : 'negative'}`} style={{ fontSize: '0.88rem', padding: '3px 8px' }}>
                {quote.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{quote.isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}% ({quote.formattedChange})</span>
              </span>
              {quote.high && quote.low && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  Day Range: ${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search Aliases Pill Bar */}
        {info.aliases && info.aliases.length > 0 && (
          <div style={{ margin: '14px 0', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
              <Search size={12} />
              <span>Active Boolean Search Aliases</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {info.aliases.map((alias, i) => (
                <span key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 2, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  "{alias}"
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Materiality & Sentiment Radar */}
        <div className="dossier-metrics-grid">
          {/* Sentiment Metric Box */}
          <div className="dossier-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                AI Sentiment Gauge
              </span>
              <Sparkles size={14} color="var(--accent-gold)" />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: analysis.sentiment === 'Bullish' ? '#10b981' : analysis.sentiment === 'Bearish' ? '#f43f5e' : '#94a3b8' }}>
              {analysis.sentiment} ({analysis.sentimentScore}/100)
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Derived from {analysis.storyCount} active news items ({analysis.pos} pos, {analysis.neg} neg)
            </p>
          </div>

          {/* Materiality Metric Box */}
          <div className="dossier-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Current Materiality
              </span>
              <ShieldAlert size={14} color={analysis.materialityColor} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: analysis.materialityColor }}>
              {analysis.materialityLevel}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Catalyst sensitivity rating based on market price volatility & media velocity
            </p>
          </div>
        </div>

        {/* Executive AI Synopsis */}
        <div className="dossier-synopsis-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#fb7185', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
            <Sparkles size={14} />
            <span>Executive Intelligence Synopsis</span>
          </div>

          <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>
            {matchedArticles.length > 0
              ? `${info.name} (${cleanSym}) is currently navigating significant market catalysts. Recent reporting focuses on "${matchedArticles[0].title}". Overall analyst sentiment leans ${analysis.sentiment.toLowerCase()} amid ongoing sector rotation and earnings momentum.`
              : `${info.name} (${cleanSym}) maintains steady baseline coverage across ${info.industry}. No extreme volatility catalysts reported in the last 24 hours.`}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 12 }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
              <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: 2 }}>Key Upside Drivers</strong>
              <span>Product expansions, institutional inflows, and sector tailwinds.</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
              <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: 2 }}>Downside Risks</strong>
              <span>Valuation multiples, regulatory developments, and macro interest rate pressure.</span>
            </div>
          </div>
        </div>

        {/* Live News Wire Stream for Entity */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
              Recent Intelligence Wire ({matchedArticles.length})
            </h4>

            <button
              onClick={() => {
                onFilterHomeFeed(cleanSym);
                onClose();
              }}
              style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Filter Home Feed for ${cleanSym}
            </button>
          </div>

          {matchedArticles.length === 0 ? (
            <div className="empty-box-sm">
              No recent news stories specifically matched for ${cleanSym}. Try searching via top bar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matchedArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => {
                    onSelectArticle(article);
                    onClose();
                  }}
                  className="dossier-article-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                      {article.source}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)' }}>
                      <Clock size={11} /> {getTimeAgo(article.timestamp)}
                    </span>
                  </div>

                  <h5 style={{ fontSize: '0.92rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                    {article.title}
                  </h5>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    {article.sentiment && (
                      <span className={`badge-sentiment badge-${article.sentiment}`}>
                        {article.sentiment}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-gold)', fontSize: '0.72rem', fontWeight: 700 }}>
                      <BookOpen size={12} /> Read Full Intelligence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
