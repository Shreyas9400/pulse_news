'use client';

import React, { useEffect } from 'react';
import { NewsArticle } from '@/lib/types';
import { X, Volume2, VolumeX, ExternalLink, Bookmark, Share2 } from 'lucide-react';

interface ReaderModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (article: NewsArticle) => void;
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
}

export default function ReaderModal({
  article,
  onClose,
  isSaved,
  onToggleSave,
  onPlayAudio,
  isSpeaking,
}: ReaderModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const handleAudio = () => {
    const readText = `${article.title}. Published by ${article.source}. ${article.description}`;
    onPlayAudio(readText);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>{article.sourceIcon || '📰'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                {article.source}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(article.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleAudio}
              className="btn-icon"
              title={isSpeaking ? 'Stop reading' : 'Listen to article'}
            >
              {isSpeaking ? <VolumeX size={17} color="var(--accent-rose)" /> : <Volume2 size={17} />}
            </button>
            <button
              onClick={() => onToggleSave(article)}
              className={`btn-icon ${isSaved ? 'active' : ''}`}
              title="Bookmark article"
            >
              <Bookmark size={17} />
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Open in publisher website"
            >
              <ExternalLink size={17} />
            </a>
            <button onClick={onClose} className="btn-icon" title="Close reader (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div
            style={{
              width: '100%',
              height: 280,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 16,
            color: 'var(--text-primary)',
          }}
        >
          {article.title}
        </h2>

        {/* Sentiment & Categories */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {article.sentiment && (
            <span className={`badge-sentiment badge-${article.sentiment}`}>
              Sentiment: {article.sentiment}
            </span>
          )}
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 10px',
              borderRadius: 20,
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Channel: {article.category}
          </span>
          {article.stockTicker && (
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              Ticker: ${article.stockTicker.symbol}
            </span>
          )}
        </div>

        {/* Article Body Content */}
        <div
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.75,
            color: 'var(--text-primary)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 20,
          }}
        >
          <p style={{ marginBottom: 20 }}>{article.description}</p>
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginTop: 24,
            }}
          >
            <h4 style={{ fontSize: '0.9rem', color: '#a5b4fc', marginBottom: 8 }}>
              Continuous News Monitoring Note
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              This article was aggregated from {article.source}. For the full in-depth investigation, multimedia, and author commentaries, click the button below to read on the official source website.
            </p>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                background: 'var(--accent-primary)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <span>Read Full Story on {article.source}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
