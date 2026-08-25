'use client';

import React from 'react';
import { DailyBriefing } from '@/lib/types';
import { Sparkles, Volume2, VolumeX, Activity, ArrowRight } from 'lucide-react';

interface BriefingHeroProps {
  briefing: DailyBriefing | null;
  onPlayBriefingAudio: (text: string) => void;
  isSpeaking: boolean;
  onSelectArticle: (article: any) => void;
}

export default function BriefingHero({
  briefing,
  onPlayBriefingAudio,
  isSpeaking,
  onSelectArticle,
}: BriefingHeroProps) {
  if (!briefing) return null;

  const handleSpeechToggle = () => {
    const speechText = `${briefing.greeting}. Here is your Pulse News briefing for ${briefing.date}. Market sentiment: ${briefing.marketMood}. Overview: ${briefing.overview}. Key developments today: ${briefing.keyBulletPoints.join('. ')}`;
    onPlayBriefingAudio(speechText);
  };

  return (
    <section className="briefing-card" aria-label="Daily AI Executive Briefing">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="briefing-badge">
          <Sparkles size={13} />
          <span>AI Executive Briefing • {briefing.date}</span>
        </div>

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
          <span>{isSpeaking ? 'Stop Audio' : 'Listen to Daily Briefing'}</span>
        </button>
      </div>

      <h1 className="briefing-title">
        {briefing.greeting}, Here Is Your Intelligence Digest
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 14px 0', fontSize: '0.85rem' }}>
        <Activity size={15} color="var(--accent-emerald)" />
        <span style={{ color: 'var(--text-muted)' }}>Market & Global Sentiment:</span>
        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{briefing.marketMood}</span>
      </div>

      <p className="briefing-overview">{briefing.overview}</p>

      <ul className="briefing-bullets">
        {briefing.keyBulletPoints.map((bullet, idx) => (
          <li key={idx} className="briefing-bullet-item">
            <span className="bullet-dot" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
