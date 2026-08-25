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
    const readText = `${article.title}. Reported by ${article.source}. ${article.description}`;
    onPlayAudio(readText);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reader-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-source-meta">
            <span className="modal-source-icon">{article.sourceIcon || '📰'}</span>
            <div>
              <div className="modal-source-name">{article.source}</div>
              <div className="modal-source-time">
                {new Date(article.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <div className="modal-actions-right">
            <button
              onClick={handleAudio}
              className="btn-icon"
              title={isSpeaking ? 'Stop reading' : 'Listen to article'}
              aria-label="Listen audio"
            >
              {isSpeaking ? <VolumeX size={16} color="var(--accent-rose)" /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={() => onToggleSave(article)}
              className={`btn-icon ${isSaved ? 'active' : ''}`}
              title="Bookmark article"
              aria-label="Bookmark"
            >
              <Bookmark size={16} />
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Open in publisher website"
              aria-label="Open link"
            >
              <ExternalLink size={16} />
            </a>
            <button onClick={onClose} className="btn-icon" title="Close reader" aria-label="Close">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="modal-featured-img-wrap">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="modal-featured-img"
            />
          </div>
        )}

        {/* Title */}
        <h2 className="modal-article-title">
          {article.title}
        </h2>

        {/* Tags */}
        <div className="modal-tags-row">
          {article.sentiment && (
            <span className={`badge-sentiment badge-${article.sentiment}`}>
              Sentiment: {article.sentiment}
            </span>
          )}
          <span className="modal-tag-pill">
            Section: {article.category}
          </span>
          {article.stockTicker && (
            <span className="modal-tag-ticker">
              ${article.stockTicker.symbol}
            </span>
          )}
        </div>

        {/* Article Body Content */}
        <div className="modal-article-body">
          <p>{article.description}</p>
          
          <div className="modal-source-callout">
            <h4 className="callout-title">Source Attribution & Full Coverage</h4>
            <p className="callout-desc">
              This intelligence dispatch was synthesized from {article.source}. For in-depth investigative commentary, financial models, and full reporting, access the original publication.
            </p>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="callout-action-btn"
            >
              <span>Read Full Report on {article.source}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
