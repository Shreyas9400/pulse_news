'use client';

import React from 'react';
import { X, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { PortfolioDeepDiveReport } from '@/lib/gemini';

interface PortfolioDeepDiveModalProps {
  isOpen: boolean;
  report: PortfolioDeepDiveReport | null;
  isLoading: boolean;
  onClose: () => void;
  onRegenerate: () => void;
}

export default function PortfolioDeepDiveModal({ isOpen, report, isLoading, onClose, onRegenerate }: PortfolioDeepDiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-content dd-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <div className="detail-header-entity">
              <Sparkles size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
              Full Portfolio Analysis
            </div>
            <h2 className="detail-header-title">{report?.title || 'Preparing your portfolio review...'}</h2>
            {report?.generatedAt && (
              <p className="modal-subtitle" style={{ marginTop: 4 }}>
                Generated {new Date(report.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-serif)' }}>Reading across your portfolio's research findings...</p>
          </div>
        ) : report ? (
          <>
            <div className="dd-bottomline-box">
              <div className="dd-section-label">Bottom Line</div>
              <p className="ib-analyst-line" style={{ padding: '4px 0 0 0', fontSize: '1.05rem' }}>{report.bottomLineSummary}</p>
            </div>

            {report.entityCards.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">Holdings With Material Developments</div>
                {report.entityCards.map((card, i) => (
                  <div key={card.symbol} className={`dd-entity-card tone-bg-${card.tone}`} style={{ marginTop: i === 0 ? 0 : 12 }}>
                    <div className="dd-entity-card-header">
                      <span className="dd-entity-symbol">{card.symbol}</span>
                      <span className="dd-entity-name">{card.name}</span>
                      <span className={`dd-status-pill tone-${card.tone}`}>{card.statusLabel}</span>
                    </div>

                    {card.metrics.length > 0 && (
                      <div className="dd-metrics-row">
                        {card.metrics.map((m, mi) => (
                          <span key={mi} className="dd-metric-chip">
                            <span className="dd-metric-label">{m.label}:</span>{' '}
                            {m.from && <span className="dd-metric-from">{m.from} → </span>}
                            <strong>{m.to}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {card.confirmedFacts.length > 0 && (
                      <div className="dd-facts-list">
                        {card.confirmedFacts.map((fact, fi) => (
                          <div key={fi} className="detail-fact-item" style={{ marginBottom: 4 }}>
                            <CheckCircle2 size={13} className="tone-green" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="dd-card-text">
                      <strong>Why it matters: </strong>
                      {card.whyItMatters}
                    </p>
                    {card.creditRiskInterpretation && (
                      <p className="dd-card-text">
                        <strong>Credit-risk interpretation: </strong>
                        {card.creditRiskInterpretation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {report.dashboard.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">Portfolio Dashboard</div>
                <div className="dd-dashboard-table">
                  {report.dashboard.map((row, i) => (
                    <div key={i} className="dd-dashboard-row">
                      <span className="dd-dashboard-holding">{row.holding}</span>
                      <span className={`dd-status-pill tone-${row.tone}`}>{row.signal}</span>
                      <span className="dd-dashboard-watching">{row.watching}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">Credit-Risk Takeaway</div>
              <p className="modal-article-body" style={{ fontSize: '0.95rem', borderTop: 'none', paddingTop: 0 }}>
                {report.takeaway}
              </p>
            </div>

            <div className="detail-footer-actions">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Synthesized from the current research cycle · no new scraping</span>
              <button className="ib-link-btn" onClick={onRegenerate}>
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          </>
        ) : (
          <p className="ib-empty-state">Run the portfolio analysis at least once to generate a review.</p>
        )}
      </div>
    </div>
  );
}
