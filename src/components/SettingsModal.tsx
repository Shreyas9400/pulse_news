'use client';

import React from 'react';
import { X, Sliders, Clock, Globe, Bell, Check, RotateCcw, Cpu } from 'lucide-react';
import { SELECTABLE_MODELS, DEFAULT_MODEL_ID } from '@/lib/gemini-client';

export interface AppSettings {
  newsRefreshIntervalMinutes: number; // 15, 30, 60, 0 (manual)
  quotesRefreshIntervalSeconds: number; // 30, 45, 120
  enableMultiEngineScraper: boolean;
  enableBreakingAlerts: boolean;
  /** Gemini model used for the analyst reasoning pass. */
  analysisModel: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  newsRefreshIntervalMinutes: 60, // 60 minutes default as requested
  quotesRefreshIntervalSeconds: 45,
  enableMultiEngineScraper: true,
  enableBreakingAlerts: true,
  analysisModel: DEFAULT_MODEL_ID,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleSetNewsInterval = (minutes: number) => {
    onUpdateSettings({ ...settings, newsRefreshIntervalMinutes: minutes });
  };

  const handleSetQuotesInterval = (seconds: number) => {
    onUpdateSettings({ ...settings, quotesRefreshIntervalSeconds: seconds });
  };

  const handleToggleScraper = () => {
    onUpdateSettings({ ...settings, enableMultiEngineScraper: !settings.enableMultiEngineScraper });
  };

  const handleToggleAlerts = () => {
    onUpdateSettings({ ...settings, enableBreakingAlerts: !settings.enableBreakingAlerts });
  };

  const handleSetAnalysisModel = (modelId: string) => {
    onUpdateSettings({ ...settings, analysisModel: modelId });
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content portfolio-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-title-wrap">
            <div className="portfolio-icon-badge" style={{ background: 'var(--accent-gold)' }}>
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="modal-title-serif">TERMINAL & REFRESH SETTINGS</h3>
              <p className="modal-subtitle">
                CONFIGURE AUTO-SYNC FREQUENCIES, SCRAPER ENGINES & NOTIFICATIONS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
          {/* Setting 1: News Feed Auto-Refresh Frequency */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Clock size={15} color="var(--accent-gold)" />
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                NEWS FEED AUTO-REFRESH FREQUENCY
              </label>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Controls how often the portfolio news feed queries Boolean RSS and multi-engine sources.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: '15 MIN', val: 15 },
                { label: '30 MIN', val: 30 },
                { label: '60 MIN (DEFAULT)', val: 60 },
                { label: 'MANUAL', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSetNewsInterval(opt.val)}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-sm)',
                    border: settings.newsRefreshIntervalMinutes === opt.val ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    background: settings.newsRefreshIntervalMinutes === opt.val ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-card)',
                    color: settings.newsRefreshIntervalMinutes === opt.val ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  {settings.newsRefreshIntervalMinutes === opt.val && <Check size={11} />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 2: Live Stock Price Auto-Refresh */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Clock size={15} color="var(--accent-emerald)" />
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                LIVE STOCK & INDEX TICKER STREAM
              </label>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Frequency of Yahoo Finance live price quote auto-synchronization.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: '30 SECONDS', val: 30 },
                { label: '45 SEC (DEFAULT)', val: 45 },
                { label: '2 MINUTES', val: 120 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSetQuotesInterval(opt.val)}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-sm)',
                    border: settings.quotesRefreshIntervalSeconds === opt.val ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                    background: settings.quotesRefreshIntervalSeconds === opt.val ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                    color: settings.quotesRefreshIntervalSeconds === opt.val ? '#10b981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  {settings.quotesRefreshIntervalSeconds === opt.val && <Check size={11} />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Setting 3: Multi-Engine HTML Web Scraper (DuckDuckGo + Bing News) */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Globe size={15} color="var(--accent-gold)" />
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  SCRAPLING-GRADE WEB SCRAPING
                </label>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.3 }}>
                Enables on-demand deep searches across DuckDuckGo HTML & Bing News with domain politeness.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleScraper}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                background: settings.enableMultiEngineScraper ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: '#fff',
              }}
            >
              {settings.enableMultiEngineScraper ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Setting 4: Analysis model — controls cost/throughput of the reasoning pass */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Cpu size={15} color="var(--accent-gold)" />
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ANALYSIS MODEL
              </label>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, marginBottom: 10 }}>
              Model used for the senior-analyst reasoning pass. The whole portfolio is analysed in a single
              batched request per cycle, so free-tier daily limits go a long way.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SELECTABLE_MODELS.map((m) => {
                const isActive = (settings.analysisModel || DEFAULT_MODEL_ID) === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSetAnalysisModel(m.id)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-card)',
                      border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isActive && <Check size={12} color="var(--accent-gold)" />}
                      <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{m.label}</span>
                      {!m.freeTier && (
                        <span
                          style={{
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 2,
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: 'var(--accent-rose)',
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                          }}
                        >
                          BILLING REQUIRED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.note}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={12} /> RESTORE DEFAULTS
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-portfolio-primary"
            style={{ padding: '0 20px', height: 38, fontSize: '0.82rem' }}
          >
            <Check size={14} />
            <span>SAVE & CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
