'use client';

import React, { useState } from 'react';
import { NewsArticle } from '@/lib/types';
import { Bookmark, ExternalLink, Sparkles, BookOpen, Clock, Share2, ShieldAlert } from 'lucide-react';

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
}: NewsCardProps) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(article.imageUrl || null);
  const [copied, setCopied] = useState(false);

  const sentiment = article.sentiment || 'neutral';

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'JUST NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
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
      } catch {}
    } else {
      navigator.clipboard.writeText(article.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSentimentColor = (s: string) => {
    if (s === 'positive') return '#10b981';
    if (s === 'negative') return '#f43f5e';
    return '#94a3b8';
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
          <div className="card-image-badges">
            <span className={`badge-sentiment badge-${sentiment}`}>
              {sentiment.toUpperCase()}
            </span>
            {article.stockTicker && (
              <span className="card-ticker-pill">
                ${article.stockTicker.symbol}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="card-body">
        {/* Source & Metadata (Always carries a clear sentiment badge) */}
        <div className="card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="card-source">
              <span>{article.sourceIcon || '📰'}</span>
              <span>{article.source}</span>
            </span>

            {/* Guaranteed Sentiment Badge on every news card */}
            <span
              className={`badge-sentiment badge-${sentiment}`}
              style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}
            >
              {sentiment === 'positive' ? '🟢 POSITIVE' : sentiment === 'negative' ? '🔴 NEGATIVE' : '⚪ NEUTRAL'}
            </span>
          </div>

          <span className="card-time">
            <Clock size={11} />
            <span>{getTimeAgo(article.timestamp)}</span>
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
          <div className="card-ai-box">
            <div className="card-ai-title">
              <Sparkles size={13} />
              <span>SENIOR CREDIT ANALYST TAKE</span>
            </div>
            <ul className="card-ai-list">
              <li><strong>EVENT:</strong> {article.title}</li>
              <li><strong>IMPACT:</strong> {article.sentiment === 'positive' ? 'Favorable liquidity & credit trajectory' : article.sentiment === 'negative' ? 'Elevated spread or headline risk' : 'Baseline operational monitoring'}</li>
              <li><strong>SOURCE:</strong> {article.source} • Surveillance Category: {article.category}</li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="card-footer">
          <div className="card-actions-left">
            <button
              onClick={() => setShowAiSummary(!showAiSummary)}
              className={`btn-read ${showAiSummary ? 'active' : ''}`}
              title="Toggle AI Brief"
            >
              <Sparkles size={12} />
              <span>{showAiSummary ? 'HIDE TAKE' : 'AI TAKE'}</span>
            </button>

            <button
              onClick={() => onOpenReader(article)}
              className="btn-read btn-read-primary"
              title="Open full reader mode"
            >
              <BookOpen size={12} />
              <span>READER</span>
            </button>
          </div>

          <div className="card-actions-right">
            <button
              onClick={handleShare}
              className="btn-icon-card"
              title={copied ? 'Copied Link!' : 'Share Article'}
              aria-label="Share article"
            >
              <Share2 size={13} color={copied ? '#10b981' : 'currentColor'} />
            </button>

            <button
              onClick={() => onToggleSave(article)}
              className={`btn-icon-card ${isSaved ? 'saved' : ''}`}
              title={isSaved ? 'Remove from Saved' : 'Save for later'}
              aria-label="Bookmark article"
            >
              <Bookmark size={13} fill={isSaved ? 'var(--accent-gold)' : 'none'} color={isSaved ? 'var(--accent-gold)' : 'currentColor'} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
