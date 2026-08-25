'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, RefreshCw, Bookmark, Bell } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  savedCount: number;
  onShowSaved: () => void;
  onOpenNotifications: () => void;
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
  onOpenNotifications,
  activeCategory,
}: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>('dark');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('pulse_theme') as any) || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const now = new Date();
    setCurrentDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }, []);

  const cycleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'oled' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pulse_theme', nextTheme);
  };

  return (
    <header className="masthead-container">
      {/* Top Editorial Sub-bar (WSJ/FT Style) */}
      <div className="masthead-topbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {currentDateStr || 'Today'}
            </span>
            <span className="edition-badge">GLOBAL EDITION</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>PWA & FCM Protocol Live</span>
          </div>
        </div>
      </div>

      {/* Primary Masthead & Logo */}
      <div className="container masthead-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
          {/* Masthead Title */}
          <a href="/" className="masthead-brand">
            <h1 className="masthead-title">FINANCIAL PULSE</h1>
            <span className="masthead-tagline">Real-Time Market Intelligence & Portfolio Wire</span>
          </a>

          {/* Search Bar */}
          <form onSubmit={onSearchSubmit} className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search companies, ticker symbols, executives (e.g. NVDA, TSLA, AI)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </form>

          {/* Actions & Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notification Bell (FCM) */}
            <button
              onClick={onOpenNotifications}
              className="btn-icon"
              title="Push Notification Settings"
            >
              <Bell size={17} />
            </button>

            {/* Bookmarks */}
            <button
              onClick={onShowSaved}
              className={`btn-icon ${activeCategory === 'saved' ? 'active' : ''}`}
              title="Saved Reading List"
              style={{ position: 'relative' }}
            >
              <Bookmark size={17} />
              {savedCount > 0 && (
                <span className="header-badge-counter">{savedCount}</span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-icon"
              title="Sync Live Feeds"
            >
              <RefreshCw
                size={17}
                style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="btn-icon"
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
            >
              {theme === 'dark' ? (
                <Moon size={17} />
              ) : theme === 'light' ? (
                <Sun size={17} />
              ) : (
                <Sparkles size={17} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
