'use client';

import React, { useState } from 'react';
import { NewsArticle } from '@/lib/types';
import { Bookmark, ExternalLink, Sparkles, BookOpen, Clock, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onToggleSave: (article: NewsArticle) => void;
  onOpenReader: (article: NewsArticle) => void;
  onPlayAudio: (text: string) => void;
}

export default function NewsCard({
  article,
  isSaved,
  onToggleSave,
  onOpenReader,
  onPlayAudio,
}: NewsCardProps) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(article.imageUrl || null);
  const [copied, setCopied] = useState(false);

  // Time format helper
  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.link,
        });
      } catch {
        // ignore cancel
      }
    } else {
      navigator.clipboard.writeText(article.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="news-card">
      {/* Thumbnail */}
      {imgSrc && (
        <div className="card-image-wrap">
          <img
            src={imgSrc}
            alt={article.title}
            className="card-image"
            loading="lazy"
            onError={() => setImgSrc(null)}
          />
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              gap: 6,
            }}
          >
            {article.sentiment && (
              <span className={`badge-sentiment badge-${article.sentiment}`}>
                {article.sentiment}
              </span>
            )}
            {article.stockTicker && (
              <span
                style={{
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                }}
              >
                ${article.stockTicker.symbol}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="card-body">
        {/* Source & Metadata */}
        <div className="card-meta">
          <span className="card-source">
            <span>{article.sourceIcon || '📰'}</span>
            <span>{article.source}</span>
          </span>
          <span className="card-time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} />
            {getTimeAgo(article.timestamp)}
          </span>
        </div>

        {/* Title */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="card-title"
          title={article.title}
        >
          {article.title}
        </a>

        {/* Description */}
        <p className="card-desc">{article.description}</p>

        {/* AI Quick Takeaway Accordion */}
        {showAiSummary && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: 14,
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#a5b4fc',
                fontWeight: 700,
                fontSize: '0.75rem',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={13} />
              <span>AI Takeaway</span>
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.4 }}>
              <li>Core event: {article.title}</li>
              <li>Source reporting from {article.source} in {article.category} channel.</li>
              <li>Estimated read time: ~2 minutes.</li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="card-footer">
          <div className="card-actions">
            {/* AI Summary Toggle */}
            <button
              onClick={() => setShowAiSummary(!showAiSummary)}
              className="btn-read"
              title="Toggle AI Quick Summary"
            >
              <Sparkles size={13} />
              <span>{showAiSummary ? 'Hide AI Take' : 'AI Take'}</span>
            </button>

            {/* Reader Mode */}
            <button
              onClick={() => onOpenReader(article)}
              className="btn-read"
              style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#38bdf8' }}
              title="Open distraction-free reader"
            >
              <BookOpen size={13} />
              <span>Reader</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Share */}
            <button
              onClick={handleShare}
              className="btn-icon"
              title={copied ? 'Link copied!' : 'Share article'}
            >
              <Share2 size={15} />
            </button>

            {/* Bookmark */}
            <button
              onClick={() => onToggleSave(article)}
              className={`btn-icon ${isSaved ? 'active' : ''}`}
              title={isSaved ? 'Remove Bookmark' : 'Save for later'}
            >
              <Bookmark size={15} />
            </button>

            {/* Original Link */}
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Visit source website"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
