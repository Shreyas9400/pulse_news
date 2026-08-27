'use client';

import React from 'react';
import { CanonicalIntelligenceEvent } from '@/lib/types';
import { ShieldCheck, AlertTriangle, ArrowRight, Layers, FileText, CheckCircle2, Clock } from 'lucide-react';

interface EventTimelineCardProps {
  event: CanonicalIntelligenceEvent;
  onOpenTrace?: () => void;
}

export default function EventTimelineCard({ event, onOpenTrace }: EventTimelineCardProps) {
  const isHighMateriality = event.materiality.materialityScore >= 75;
  const isNegative = event.materiality.riskDirection === 'NEGATIVE';

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono ${
              isHighMateriality ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {event.eventType}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Clock size={11} />
              {new Date(event.firstSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">{event.title}</h4>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-mono font-bold text-cyan-400">
            MAT {event.materiality.materialityScore}/100
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            CONF {event.confidenceScore}%
          </div>
        </div>
      </div>

      {/* Summary / What Changed */}
      <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div className="text-[11px] font-bold text-cyan-300 mb-1 flex items-center gap-1">
          <span>WHAT CHANGED:</span>
        </div>
        <p>{event.summary}</p>
      </div>

      {/* Extracted Metrics Delta */}
      {event.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {event.metrics.map((m, i) => (
            <div key={i} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
              <span className="text-slate-400">{m.metricName}: </span>
              {m.previousValue && <span className="text-slate-400 line-through mr-1">{m.previousValue}</span>}
              <span className="text-emerald-400 font-bold">{m.currentValue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Facts & Inferences breakdown */}
      {event.facts.length > 0 && (
        <div className="space-y-1 text-xs text-slate-300">
          {event.facts.slice(0, 2).map((fact, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px]">
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{fact.statement}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
            {event.evidenceIds.length} Independent Sources
          </span>
          {event.adversarialCheck?.passed && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Adversarial QA Passed
            </span>
          )}
        </div>

        {onOpenTrace && (
          <button
            onClick={onOpenTrace}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Inspect Evidence Trace <ArrowRight size={12} />
          </button>
        )}
      </div>

    </div>
  );
}
