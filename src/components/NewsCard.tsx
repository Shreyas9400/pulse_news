'use client';

import React, { useState } from 'react';
import { NewsArticle } from '@/lib/types';
import { Bookmark, ExternalLink, Sparkles, BookOpen, Clock, Calendar, Share2, ShieldAlert, AlertTriangle } from 'lucide-react';

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
  const materiality = article.materiality;

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'JUST NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  const getFormattedDate = (timestamp: number) => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
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
            {materiality === 'HIGH' && (
              <span className="materiality-badge high" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                HIGH MATERIALITY
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
        {/* Source, Sentiment, Materiality & Exact Date */}
        <div className="card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="card-source">
              <span>{article.sourceIcon || '📰'}</span>
              <span>{article.source}</span>
            </span>

            {/* Sentiment Badge */}
            <span
              className={`badge-sentiment badge-${sentiment}`}
              style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}
            >
              {sentiment === 'positive' ? '🟢 POSITIVE' : sentiment === 'negative' ? '🔴 NEGATIVE' : '⚪ NEUTRAL'}
            </span>

            {/* Materiality Tag */}
            {materiality === 'HIGH' && (
              <span className="materiality-badge high" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                HIGH IMPACT
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Explicit Calendar Date Tag */}
            <span className="card-date-tag" title={article.publishedAt} suppressHydrationWarning>
              <Calendar size={10} />
              <span suppressHydrationWarning>{getFormattedDate(article.timestamp)}</span>
            </span>

            <span className="card-time" suppressHydrationWarning>
              <Clock size={10} />
              <span suppressHydrationWarning>{getTimeAgo(article.timestamp)}</span>
            </span>
          </div>
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

        {/* AI Credit Risk Context Takeaway */}
        {article.creditContext && (
          <div className="card-credit-context-bar">
            <Sparkles size={12} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
            <span><strong>CREDIT IMPACT:</strong> {article.creditContext}</span>
          </div>
        )}

        {/* AI Quick Takeaway Accordion */}
        {showAiSummary && (
          <div className="card-ai-box">
            <div className="card-ai-title">
              <Sparkles size={13} />
              <span>SENIOR CREDIT ANALYST TAKE</span>
            </div>
            <ul className="card-ai-list">
              <li><strong>EVENT:</strong> {article.title}</li>
              <li><strong>CREDIT EFFECT:</strong> {article.creditContext || (article.sentiment === 'positive' ? 'Constructive liquidity & debt coverage' : article.sentiment === 'negative' ? 'Elevated spread or headline risk' : 'Baseline operational monitoring')}</li>
              <li><strong>SOURCE:</strong> {article.source} • Surveillance Date: {getFormattedDate(article.timestamp)}</li>
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="card-footer">
          <div className="card-actions-left">
            <button
              onClick={() => setShowAiSummary(!showAiSummary)}
              className={`btn-card-action ${showAiSummary ? 'active' : ''}`}
              title="AI Credit Takeaway"
            >
              <Sparkles size={12} />
              <span>AI TAKE</span>
            </button>

            <button
              onClick={() => onOpenReader(article)}
              className="btn-card-action btn-reader"
              title="Clean Reader View"
            >
              <BookOpen size={12} />
              <span>READ</span>
            </button>
          </div>

          <div className="card-actions-right">
            <button
              onClick={handleShare}
              className="btn-card-icon"
              title={copied ? 'Link Copied!' : 'Share Article'}
            >
              <Share2 size={13} />
            </button>

            <button
              onClick={() => onToggleSave(article)}
              className={`btn-card-icon ${isSaved ? 'saved' : ''}`}
              title={isSaved ? 'Remove from Saved' : 'Save Article'}
            >
              <Bookmark size={13} fill={isSaved ? 'var(--accent-gold)' : 'none'} />
            </button>

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card-icon"
              title="Open Original Link"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
