'use client';

import React from 'react';
import { DailyBriefing } from '@/lib/types';
import { Sparkles, Volume2, VolumeX, Activity, ArrowRight, ShieldCheck, Database, CheckCircle2, Clock } from 'lucide-react';

interface BriefingHeroProps {
  briefing: DailyBriefing | null;
  onPlayBriefingAudio: (text: string) => void;
  isSpeaking: boolean;
  onSelectArticle?: (article: any) => void;
  onOpenResearchTrace?: () => void;
  onOpenPortfolioProfile?: () => void;
}

export default function BriefingHero({
  briefing,
  onPlayBriefingAudio,
  isSpeaking,
  onOpenResearchTrace,
  onOpenPortfolioProfile,
}: BriefingHeroProps) {
  if (!briefing) return null;

  const handleSpeechToggle = () => {
    const speechText = `${briefing.greeting}. Here is your Pulse News delta intelligence briefing for ${briefing.date}. Regime: ${briefing.marketMood}. Overview: ${briefing.overview}. Key developments: ${briefing.keyBulletPoints.join('. ')}`;
    onPlayBriefingAudio(speechText);
  };

  return (
    <section className="briefing-card" aria-label="Daily AI Executive Briefing">
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="briefing-badge">
            <Sparkles size={13} />
            <span>Stateful Delta Briefing • {briefing.date}</span>
          </div>

          {briefing.portfolioDomain && (
            <span
              onClick={onOpenPortfolioProfile}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Domain: {briefing.portfolioDomain.replace('_', ' ')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenResearchTrace && (
            <button
              onClick={onOpenResearchTrace}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#22d3ee',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Database size={14} />
              <span>Research Trace & Blackboard</span>
            </button>
          )}

          <button
            onClick={handleSpeechToggle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: isSpeaking ? 'var(--accent-rose)' : 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? 'Stop Audio' : 'Listen to Briefing'}</span>
          </button>
        </div>
      </div>

      <h1 className="briefing-title">
        {briefing.greeting}
      </h1>

      {/* Synthesis regime banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 14px 0', fontSize: '0.85rem' }}>
        <Activity size={15} color="var(--accent-emerald)" />
        <span style={{ color: 'var(--text-muted)' }}>Portfolio Synthesis Regime:</span>
        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{briefing.marketMood}</span>
      </div>

      <p className="briefing-overview">{briefing.overview}</p>

      {/* Incremental Delta Stories ("What Changed?") */}
      {briefing.deltaStories && briefing.deltaStories.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Material Incremental Developments ({briefing.deltaStories.length})
          </div>

          {briefing.deltaStories.map((story) => (
            <div
              key={story.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>{story.entityName}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: story.riskDirection === 'NEGATIVE' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: story.riskDirection === 'NEGATIVE' ? '#fb7185' : '#34d399',
                      border: story.riskDirection === 'NEGATIVE' ? '1px solid rgba(225, 29, 72, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {story.riskDirection} IMPACT
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8' }}>
                  MAT: {story.materialityScore}/100 • CONF: {story.confidenceScore}%
                </div>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#38bdf8' }}>What Changed: </strong>
                {story.whatChanged}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                <strong>Analyst Takeaway: </strong>
                {story.portfolioImpact}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiet Entities ("No Material Change") */}
      {briefing.quietEntities && briefing.quietEntities.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>BASELINE CONFIRMED — NO MATERIAL INCREMENTAL DEVELOPMENT:</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 4 }}>
            {briefing.quietEntities.map((q) => q.entityName).join(' • ')}
          </div>
        </div>
      )}

      {/* Key Bullets fallback */}
      {(!briefing.deltaStories || briefing.deltaStories.length === 0) && (
        <ul className="briefing-bullets">
          {briefing.keyBulletPoints.map((bullet, idx) => (
            <li key={idx} className="briefing-bullet-item">
              <span className="bullet-dot" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
