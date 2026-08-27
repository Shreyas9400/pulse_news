'use client';

import React from 'react';
import { X, CheckCircle2, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { CanonicalIntelligenceEvent, DeltaStoryItem } from '@/lib/types';
import { humanizeEntityTokens } from '@/lib/risk-presentation';
import { ChangeItem } from './IntelligenceBriefing';

interface EntityDetailModalProps {
  item: ChangeItem | null;
  onClose: () => void;
  onOpenResearchTrace: () => void;
}

export default function EntityDetailModal({ item, onClose, onOpenResearchTrace }: EntityDetailModalProps) {
  if (!item) return null;

  const isEvent = item.kind === 'event';
  const eventRaw = isEvent ? (item.raw as CanonicalIntelligenceEvent) : null;
  const deltaRaw = !isEvent ? (item.raw as DeltaStoryItem) : null;

  const facts = eventRaw?.facts || deltaRaw?.facts || [];
  const openQuestions = eventRaw?.openQuestions || [];
  const adversarialPassed = eventRaw?.adversarialCheck?.passed;

  const primarySources = deltaRaw?.primarySourcesCount;
  const totalSources = deltaRaw?.totalSourcesCount ?? eventRaw?.evidenceIds.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <div className="detail-header-entity">{item.entityLabel}</div>
            <h2 className="detail-header-title">{item.headline}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div
          className={`detail-risk-state-row tone-bg-${item.riskState.tone}`}
        >
          <span className={`detail-risk-state-label tone-${item.riskState.tone}`}>
            {item.riskState.label} {item.riskState.arrow}
          </span>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">What Changed</div>
          <p className="detail-section-body">{item.whatChanged}</p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Why It Matters</div>
          <p className="detail-section-body">{item.whyItMatters}</p>
        </div>

        {item.changeFrom && item.changeTo && (
          <div className="detail-section">
            <div className="detail-section-title">Change In View</div>
            <p className={`detail-section-body tone-${item.riskState.tone}`} style={{ fontWeight: 700 }}>
              {item.changeFrom} → {item.changeTo}
            </p>
          </div>
        )}

        {facts.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">What We Know</div>
            {facts.slice(0, 6).map((fact, i) => (
              <div key={i} className="detail-fact-item">
                <CheckCircle2 size={14} className="tone-green" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{humanizeEntityTokens(fact.statement)}</span>
              </div>
            ))}
          </div>
        )}

        {openQuestions.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">What We Don't Know</div>
            {openQuestions.slice(0, 5).map((q, i) => (
              <div key={i} className="detail-question-item">
                <HelpCircle size={14} className="tone-amber" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{humanizeEntityTokens(q)}</span>
              </div>
            ))}
          </div>
        )}

        {item.nextTrigger && (
          <div className="detail-section">
            <div className="detail-section-title">What Could Change Our View</div>
            <p className="detail-section-body">{item.nextTrigger}</p>
          </div>
        )}

        <div className="detail-section">
          <div className="detail-section-title">Evidence</div>
          <div className="detail-evidence-row">
            {primarySources !== undefined && (
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num">{primarySources}</span>
                <span className="detail-evidence-label">Primary Sources</span>
              </div>
            )}
            <div className="detail-evidence-stat">
              <span className="detail-evidence-num">{totalSources ?? 0}</span>
              <span className="detail-evidence-label">Independent Sources</span>
            </div>
            {adversarialPassed !== undefined && (
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num" style={{ color: adversarialPassed ? '#10b981' : '#d4af37' }}>
                  {adversarialPassed ? <ShieldCheck size={20} /> : '—'}
                </span>
                <span className="detail-evidence-label">Adversarial QA</span>
              </div>
            )}
            <div className="detail-evidence-stat">
              <span className="detail-evidence-num">{item.confidenceText}</span>
              <span className="detail-evidence-label">Confidence</span>
            </div>
          </div>
        </div>

        <div className="detail-footer-actions">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.materialityText}</span>
          <button className="ib-link-btn" onClick={onOpenResearchTrace}>
            View Full Research Trace <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
