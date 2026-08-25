'use client';

import React, { useState } from 'react';
import { NewsArticle } from '@/lib/types';
import { Bookmark, ExternalLink, Sparkles, BookOpen, Clock, Share2 } from 'lucide-react';

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
        // user cancelled share
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
          <div className="card-image-badges">
            {article.sentiment && (
              <span className={`badge-sentiment badge-${article.sentiment}`}>
                {article.sentiment}
              </span>
            )}
            {article.stockTicker && (
              <span className="card-ticker-pill">
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
              <span>AI Intelligence Take</span>
            </div>
            <ul className="card-ai-list">
              <li>Core event: {article.title}</li>
              <li>Source reporting: {article.source} ({article.category})</li>
              <li>Estimated read time: ~2 minutes</li>
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
              <span>{showAiSummary ? 'Hide Take' : 'AI Take'}</span>
            </button>

            <button
              onClick={() => onOpenReader(article)}
              className="btn-read btn-read-primary"
              title="Open full reader mode"
            >
              <BookOpen size={12} />
              <span>Reader</span>
            </button>
          </div>

          <div className="card-actions-right">
            <button
              onClick={handleShare}
              className="btn-icon-sm"
              title={copied ? 'Link copied!' : 'Share article'}
              aria-label="Share article"
            >
              <Share2 size={14} />
            </button>

            <button
              onClick={() => onToggleSave(article)}
              className={`btn-icon-sm ${isSaved ? 'active' : ''}`}
              title={isSaved ? 'Remove Bookmark' : 'Save article'}
              aria-label="Bookmark article"
            >
              <Bookmark size={14} />
            </button>

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon-sm"
              title="Open original publisher"
              aria-label="Open source link"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
