'use client';

import React, { useState } from 'react';
import { X, Search, ShieldCheck, Database, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { ResearchTrace } from '@/lib/types';
import { humanizeEntityTokens } from '@/lib/risk-presentation';

interface ResearchTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: ResearchTrace | null;
}

export default function ResearchTraceModal({ isOpen, onClose, trace }: ResearchTraceModalProps) {
  const [activeTab, setActiveTab] = useState<'evidence_chain' | 'why_included_excluded' | 'adversarial_qa' | 'blackboard'>('evidence_chain');

  if (!isOpen || !trace) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <div className="detail-header-entity">
              <Database size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
              RUN {trace.runId.slice(0, 16)}
            </div>
            <h2 className="detail-header-title">Research Trace &amp; Evidence Blackboard</h2>
            <p className="modal-subtitle" style={{ marginTop: 4 }}>
              {trace.budget.queriesExecuted} queries executed · depth {trace.budget.depthReached}/{trace.budget.maxDepth} · {(trace.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="portfolio-tabs" style={{ flexWrap: 'wrap' }}>
          <button className={`portfolio-tab ${activeTab === 'evidence_chain' ? 'active' : ''}`} onClick={() => setActiveTab('evidence_chain')}>
            Evidence Chain
          </button>
          <button className={`portfolio-tab ${activeTab === 'why_included_excluded' ? 'active' : ''}`} onClick={() => setActiveTab('why_included_excluded')}>
            Why Included / Excluded
          </button>
          <button className={`portfolio-tab ${activeTab === 'adversarial_qa' ? 'active' : ''}`} onClick={() => setActiveTab('adversarial_qa')}>
            Adversarial QA
          </button>
          <button className={`portfolio-tab ${activeTab === 'blackboard' ? 'active' : ''}`} onClick={() => setActiveTab('blackboard')}>
            Blackboard State
          </button>
        </div>

        {/* Tab 1: Evidence Chain */}
        {activeTab === 'evidence_chain' && (
          <div className="detail-section" style={{ borderTop: 'none' }}>
            <div className="detail-section-title">
              <Search size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
              Recursive Research Execution Path
            </div>
            {trace.iterations.map((iter, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                  Iteration {iter.iteration}: {humanizeEntityTokens(iter.branchName)}
                </div>

                {iter.queries.length > 0 && (
                  <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border-subtle)', marginBottom: 8 }}>
                    {iter.queries.map((q, idx) => (
                      <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5 }}>
                        → {q}
                      </div>
                    ))}
                  </div>
                )}

                {iter.evidenceExtracted.length > 0 && (
                  <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--border-subtle)' }}>
                    {iter.evidenceExtracted.map((fact, idx) => (
                      <div key={idx} className="detail-fact-item">
                        <CheckCircle2 size={13} className="tone-green" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{humanizeEntityTokens(fact)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {trace.iterations.length === 0 && <p className="ib-empty-state">No iteration data recorded for this run.</p>}
          </div>
        )}

        {/* Tab 2: Why Included / Excluded */}
        {activeTab === 'why_included_excluded' && (
          <div className="detail-section" style={{ borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div>
              <div className="detail-section-title tone-green">
                <CheckCircle2 size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
                Included In Final Briefing ({trace.whyIncluded.length})
              </div>
              {trace.whyIncluded.map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>Event {item.eventId.slice(0, 10)}</span>
                    <span className="tone-green" style={{ fontFamily: 'var(--font-mono)' }}>SCORE {item.materiality}</span>
                  </div>
                  <p className="detail-section-body" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{humanizeEntityTokens(item.reason)}</p>
                </div>
              ))}
              {trace.whyIncluded.length === 0 && <p className="ib-empty-state">No events met the high-materiality threshold for inclusion.</p>}
            </div>

            <div>
              <div className="detail-section-title tone-red">
                <XCircle size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
                Excluded / Filtered Out ({trace.whyExcluded.length})
              </div>
              {trace.whyExcluded.map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{humanizeEntityTokens(item.itemTitle)}</span>
                    <span className="tone-red" style={{ fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{item.reason}</span>
                  </div>
                  {item.score !== undefined && (
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Materiality score {item.score} below threshold</p>
                  )}
                </div>
              ))}
              {trace.whyExcluded.length === 0 && <p className="ib-empty-state">No low-value stories were rejected during this cycle.</p>}
            </div>
          </div>
        )}

        {/* Tab 3: Adversarial QA */}
        {activeTab === 'adversarial_qa' && (
          <div className="detail-section" style={{ borderTop: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="detail-section-title tone-amber" style={{ marginBottom: 0 }}>
                <ShieldCheck size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                Adversarial Challenge — &quot;What Could Make This Wrong?&quot;
              </div>
              <span className={trace.adversarialCheckResults?.finalValidationPassed ? 'tone-green' : 'tone-amber'} style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                {trace.adversarialCheckResults?.finalValidationPassed ? 'VALIDATION PASSED' : 'VULNERABILITIES FLAGGED'}
              </span>
            </div>
            {trace.conclusions.map((conc, i) => (
              <p key={i} className="detail-section-body" style={{ marginBottom: 8 }}>
                {humanizeEntityTokens(conc)}
              </p>
            ))}
            {trace.conclusions.length === 0 && <p className="ib-empty-state">No adversarial conclusions recorded.</p>}
          </div>
        )}

        {/* Tab 4: Blackboard Summary */}
        {activeTab === 'blackboard' && (
          <div className="detail-section" style={{ borderTop: 'none' }}>
            <div className="detail-evidence-row">
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num tone-cyan" style={{ color: 'var(--accent-cyan)' }}>{trace.blackboardSummary?.factsCount || 0}</span>
                <span className="detail-evidence-label">Epistemic Claims</span>
              </div>
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num tone-green">{trace.blackboardSummary?.evidenceCount || 0}</span>
                <span className="detail-evidence-label">Evidence Items</span>
              </div>
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num tone-amber">{trace.blackboardSummary?.hypothesesCount || 0}</span>
                <span className="detail-evidence-label">Hypotheses Tested</span>
              </div>
              <div className="detail-evidence-stat">
                <span className="detail-evidence-num tone-red">{trace.blackboardSummary?.conflictsCount || 0}</span>
                <span className="detail-evidence-label">Conflicts Resolved</span>
              </div>
            </div>
          </div>
        )}

        <div className="detail-footer-actions">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Stateful research blackboard · full provenance</span>
          <button className="ib-link-btn" onClick={onClose}>
            Close Trace <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
