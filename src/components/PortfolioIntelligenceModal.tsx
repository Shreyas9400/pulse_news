'use client';

import React from 'react';
import { X, Sparkles, Shield, Activity, Target, Layers, Compass, HelpCircle, FileText } from 'lucide-react';
import { PortfolioIntelligenceProfile } from '@/lib/types';

interface PortfolioIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PortfolioIntelligenceProfile | null;
}

export default function PortfolioIntelligenceModal({ isOpen, onClose, profile }: PortfolioIntelligenceModalProps) {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">PORTFOLIO INTELLIGENCE PROFILE</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                  {profile.primaryDomain.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                3-Level Dynamic Domain Taxonomy • Portfolio Exposure Graph • Custom Monitoring Rules
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

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Level 1: Domain Knowledge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Compass size={15} />
              LEVEL 1: DOMAIN TAXONOMY & SUBDOMAINS
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {profile.level1DomainKnowledge}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.subdomains.map((sub, i) => (
                <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Key Metrics to Monitor */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Activity size={15} />
              DOMAIN SURVEILLANCE METRICS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {profile.keyMetricsToMonitor.map((metric, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level 2: Exposure Mapping & Risk Propagation */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Layers size={15} />
              LEVEL 2: EXPOSURE MAPPING & RISK PROPAGATION PATHS
            </h3>
            <div className="space-y-2">
              <div className="text-xs text-slate-300 font-medium">Direct Portfolio Holdings:</div>
              <div className="flex flex-wrap gap-2">
                {profile.level2PortfolioExposure.directExposure.map((d, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-900">
                    {d}
                  </span>
                ))}
              </div>

              {profile.level2PortfolioExposure.riskPropagationPaths.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="text-xs text-slate-300 font-medium">Indirect Risk Propagation Links:</div>
                  {profile.level2PortfolioExposure.riskPropagationPaths.map((path, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                      {path.fromEntity} → {path.mechanism} → {path.toEntity}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Level 3: Active Research Questions */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <HelpCircle size={15} />
              LEVEL 3: ACTIVE RESEARCH QUESTIONS
            </h3>
            <div className="space-y-2">
              {profile.level3ActiveContext.activeResearchQuestions.map((q, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">Q{i + 1}:</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Analyst System Prompt */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText size={15} />
              DYNAMIC ANALYST PROMPT SPECIFICATION
            </h3>
            <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
              {profile.dynamicAnalystPrompt}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <div>Continuous Portfolio Intelligence • Profile Version {profile.version}</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors font-semibold"
          >
            CLOSE PROFILE
          </button>
        </div>

      </div>
    </div>
  );
}
