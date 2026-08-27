'use client';

import React, { useState } from 'react';
import { X, Sparkles, Activity, Layers, Compass, HelpCircle, FileText, ArrowRight, Plus, User } from 'lucide-react';
import { PortfolioIntelligenceProfile } from '@/lib/types';
import { humanizeEntityTokens } from '@/lib/risk-presentation';

interface PortfolioIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PortfolioIntelligenceProfile | null;
  customQuestions?: string[];
  onAddCustomQuestion?: (question: string) => void;
  onRemoveCustomQuestion?: (question: string) => void;
}

export default function PortfolioIntelligenceModal({
  isOpen,
  onClose,
  profile,
  customQuestions = [],
  onAddCustomQuestion,
  onRemoveCustomQuestion,
}: PortfolioIntelligenceModalProps) {
  const [draftQuestion, setDraftQuestion] = useState('');

  if (!isOpen || !profile) return null;

  const handleAddQuestion = () => {
    const trimmed = draftQuestion.trim();
    if (trimmed && onAddCustomQuestion) {
      onAddCustomQuestion(trimmed);
      setDraftQuestion('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <div className="detail-header-entity">
              <Sparkles size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
              {profile.primaryDomain.replace(/_/g, ' ').toUpperCase()}
            </div>
            <h2 className="detail-header-title">Portfolio Intelligence Profile</h2>
            <p className="modal-subtitle" style={{ marginTop: 4 }}>
              3-level domain taxonomy · exposure graph · custom monitoring rules
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="detail-section" style={{ borderTop: 'none' }}>
          <div className="detail-section-title">
            <Compass size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            Domain Taxonomy &amp; Subdomains
          </div>
          <p className="detail-section-body" style={{ marginBottom: 10 }}>{humanizeEntityTokens(profile.level1DomainKnowledge)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.subdomains.map((sub, i) => (
              <span key={i} className="suggestion-chip">{humanizeEntityTokens(sub)}</span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <Activity size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            Domain Surveillance Metrics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {profile.keyMetricsToMonitor.map((metric, i) => (
              <div key={i} className="detail-fact-item" style={{ marginBottom: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', flexShrink: 0, marginTop: 6 }} />
                <span>{humanizeEntityTokens(metric)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <Layers size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            Exposure Mapping &amp; Risk Propagation
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>
            Direct Portfolio Holdings
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: profile.level2PortfolioExposure.riskPropagationPaths.length > 0 ? 12 : 0 }}>
            {profile.level2PortfolioExposure.directExposure.map((d, i) => (
              <span key={i} className="suggestion-chip active">{humanizeEntityTokens(d)}</span>
            ))}
          </div>

          {profile.level2PortfolioExposure.riskPropagationPaths.length > 0 && (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>
                Indirect Risk Propagation Links
              </p>
              {profile.level2PortfolioExposure.riskPropagationPaths.map((path, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5 }}>
                  {humanizeEntityTokens(path.fromEntity)} → {humanizeEntityTokens(path.mechanism)} → {humanizeEntityTokens(path.toEntity)}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <HelpCircle size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            Active Research Questions
          </div>
          {profile.level3ActiveContext.activeResearchQuestions.map((q, i) => (
            <div key={i} className="detail-question-item">
              <span className="tone-amber" style={{ fontWeight: 800, flexShrink: 0 }}>Q{i + 1}</span>
              <span>{humanizeEntityTokens(q)}</span>
            </div>
          ))}

          {customQuestions.length > 0 && (
            <div style={{ marginTop: profile.level3ActiveContext.activeResearchQuestions.length > 0 ? 10 : 0 }}>
              {customQuestions.map((q, i) => (
                <div key={i} className="detail-question-item" style={{ alignItems: 'center' }}>
                  <User size={13} className="tone-cyan" style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{q}</span>
                  {onRemoveCustomQuestion && (
                    <button
                      onClick={() => onRemoveCustomQuestion(q)}
                      className="chip-remove-btn"
                      title="Remove question"
                      aria-label="Remove question"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {onAddCustomQuestion && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                type="text"
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                placeholder="Ask your own research question..."
                className="search-input"
                style={{ height: 34, fontSize: '0.82rem', textTransform: 'none' }}
              />
              <button onClick={handleAddQuestion} className="btn-portfolio-action" style={{ flexShrink: 0 }}>
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          )}
          <p className="form-field-hint" style={{ marginTop: 6 }}>
            Questions you add here are included as research priorities the next time analysis runs.
          </p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <FileText size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
            Dynamic Analyst Prompt Specification
          </div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {profile.dynamicAnalystPrompt}
          </pre>
        </div>

        <div className="detail-footer-actions">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Continuous portfolio intelligence · profile v{profile.version}</span>
          <button className="ib-link-btn" onClick={onClose}>
            Close Profile <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
