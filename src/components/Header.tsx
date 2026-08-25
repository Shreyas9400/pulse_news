'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, RefreshCw, Bookmark, Newspaper } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  savedCount: number;
  onShowSaved: () => void;
  activeCategory: string;
}

export default function Header({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  isRefreshing,
  savedCount,
  onShowSaved,
  activeCategory,
}: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>('dark');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Read saved theme
    const savedTheme = (localStorage.getItem('pulse_theme') as any) || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const cycleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'oled' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pulse_theme', nextTheme);
  };

  return (
    <header className="header-glass">
      <div className="container header-content">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/" className="brand-logo">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Newspaper size={20} color="#fff" />
            </div>
            <span>PULSE<span style={{ color: 'var(--accent-cyan)' }}>NEWS</span></span>
          </a>
          <span className="brand-badge">AI Briefing</span>
        </div>

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="search-wrapper">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search keywords, companies, tickers (e.g. NVDA, AI, SpaceX)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </form>

        {/* Actions & Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live Clock */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
            className="desktop-clock"
          >
            {currentTime}
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={onShowSaved}
            className={`btn-icon ${activeCategory === 'saved' ? 'active' : ''}`}
            title="Saved Articles"
            style={{ position: 'relative' }}
          >
            <Bookmark size={18} />
            {savedCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'var(--accent-amber)',
                  color: '#000',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {savedCount}
              </span>
            )}
          </button>

          {/* Refresh Feeds */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-icon"
            title="Refresh Feeds"
          >
            <RefreshCw
              size={18}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            className="btn-icon"
            title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          >
            {theme === 'dark' ? (
              <Moon size={18} />
            ) : theme === 'light' ? (
              <Sun size={18} />
            ) : (
              <Sparkles size={18} />
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        @media (min-width: 900px) {
          .desktop-clock {
            display: block !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
