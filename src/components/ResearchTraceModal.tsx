'use client';

import React, { useState } from 'react';
import { X, Search, ShieldCheck, AlertTriangle, Layers, Database, ArrowRight, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { ResearchTrace } from '@/lib/types';

interface ResearchTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace: ResearchTrace | null;
}

export default function ResearchTraceModal({ isOpen, onClose, trace }: ResearchTraceModalProps) {
  const [activeTab, setActiveTab] = useState<'evidence_chain' | 'why_included_excluded' | 'adversarial_qa' | 'blackboard'>('evidence_chain');

  if (!isOpen || !trace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">RESEARCH TRACE & EVIDENCE BLACKBOARD</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  RUN {trace.runId.slice(0, 12)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full Epistemic Lineage • {trace.budget.queriesExecuted} Queries Executed • Depth {trace.budget.depthReached}/{trace.budget.maxDepth} • {trace.durationMs}ms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('evidence_chain')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'evidence_chain'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            EVIDENCE CHAIN & PROVENANCE
          </button>
          <button
            onClick={() => setActiveTab('why_included_excluded')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'why_included_excluded'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            WHY INCLUDED / WHY EXCLUDED
          </button>
          <button
            onClick={() => setActiveTab('adversarial_qa')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'adversarial_qa'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ADVERSARIAL QA CHALLENGE
          </button>
          <button
            onClick={() => setActiveTab('blackboard')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'blackboard'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            BLACKBOARD STATE
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Tab 1: Evidence Chain */}
          {activeTab === 'evidence_chain' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Search size={14} className="text-cyan-400" />
                  RECURSIVE RESEARCH EXECUTION PATH
                </h3>
                {trace.iterations.map((iter, i) => (
                  <div key={i} className="space-y-3">
                    <div className="text-xs font-semibold text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/50">
                      Iteration {iter.iteration}: {iter.branchName}
                    </div>

                    <div className="pl-3 border-l-2 border-slate-800 space-y-2">
                      <div className="text-xs text-slate-300 font-medium">Executed Search Queries:</div>
                      {iter.queries.map((q, idx) => (
                        <div key={idx} className="text-xs font-mono bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 flex items-center gap-2">
                          <span className="text-cyan-400">→</span> {q}
                        </div>
                      ))}
                    </div>

                    {iter.evidenceExtracted.length > 0 && (
                      <div className="pl-3 border-l-2 border-slate-800 space-y-2 pt-2">
                        <div className="text-xs text-slate-300 font-medium">Extracted Epistemic Facts:</div>
                        {iter.evidenceExtracted.map((fact, idx) => (
                          <div key={idx} className="text-xs p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Why Included / Excluded */}
          {activeTab === 'why_included_excluded' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Included */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  INCLUDED IN FINAL BRIEFING ({trace.whyIncluded.length})
                </h3>
                <div className="space-y-2">
                  {trace.whyIncluded.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900 border border-emerald-950/60 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span>Event: {item.eventId}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                          SCORE {item.materiality}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.reason}</p>
                    </div>
                  ))}
                  {trace.whyIncluded.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No events met the high-materiality threshold for inclusion.</p>
                  )}
                </div>
              </div>

              {/* Excluded */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <XCircle size={14} />
                  EXCLUDED / FILTERED OUT ({trace.whyExcluded.length})
                </h3>
                <div className="space-y-2">
                  {trace.whyExcluded.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900 border border-rose-950/60 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span className="truncate">{item.itemTitle}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                          {item.reason}
                        </span>
                      </div>
                      {item.score !== undefined && (
                        <p className="text-[11px] text-slate-500">Materiality score {item.score} &lt; threshold</p>
                      )}
                    </div>
                  ))}
                  {trace.whyExcluded.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No low-value stories were rejected during this cycle.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Adversarial QA Challenge */}
          {activeTab === 'adversarial_qa' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldCheck size={16} />
                  ADVERSARIAL CHALLENGE PASS ("WHAT COULD MAKE THIS WRONG?")
                </h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  trace.adversarialCheckResults?.finalValidationPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {trace.adversarialCheckResults?.finalValidationPassed ? 'VALIDATION PASSED' : 'VULNERABILITIES FLAGGED'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-300 font-medium">Challenged Analytical Conclusions:</div>
                {trace.conclusions.map((conc, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
                    {conc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Blackboard Summary */}
          {activeTab === 'blackboard' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-cyan-400">{trace.blackboardSummary?.factsCount || 0}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase">Epistemic Claims</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-emerald-400">{trace.blackboardSummary?.evidenceCount || 0}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase">Evidence Items</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-amber-400">{trace.blackboardSummary?.hypothesesCount || 0}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase">Hypotheses Tested</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-rose-400">{trace.blackboardSummary?.conflictsCount || 0}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase">Conflicts Resolved</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <div>Stateful Research Blackboard • Institutional Provenance Active</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors font-semibold"
          >
            CLOSE TRACE
          </button>
        </div>

      </div>
    </div>
  );
}
