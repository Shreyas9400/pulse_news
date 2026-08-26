'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, RefreshCw, Bookmark, Bell, X, Sliders } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  savedCount: number;
  onShowSaved: () => void;
  onOpenNotifications: () => void;
  onOpenSettings?: () => void;
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
  onOpenSettings,
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
        weekday: 'short',
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
      {/* Top Editorial Sub-bar */}
      <div className="masthead-topbar">
        <div className="container masthead-topbar-inner">
          <div className="topbar-left">
            <span className="topbar-date" suppressHydrationWarning>{currentDateStr || 'Today'}</span>
            <span className="edition-badge">GLOBAL EDITION</span>
          </div>

          <div className="topbar-right">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="topbar-link-btn"
                title="Terminal Settings & Sync Frequency"
              >
                <Sliders size={13} />
                <span className="hide-on-mobile-sm">Settings</span>
              </button>
            )}
            <span className="topbar-separator">•</span>
            <button
              onClick={onOpenNotifications}
              className="topbar-link-btn"
              title="Push Notification Settings"
            >
              <Bell size={13} />
              <span className="hide-on-mobile-sm">Alerts</span>
            </button>
            <span className="topbar-separator">•</span>
            <span className="topbar-protocol">PWA Live</span>
          </div>
        </div>
      </div>

      {/* Primary Masthead */}
      <div className="container masthead-main-layout">
        {/* Brand & Action Controls Row */}
        <div className="masthead-row-top">
          <a href="/" className="masthead-brand">
            <h1 className="masthead-title">FINANCIAL PULSE</h1>
            <span className="masthead-tagline">Real-Time Market & Portfolio Intelligence</span>
          </a>

          {/* Desktop & Mobile Top Actions */}
          <div className="masthead-actions">
            {/* Settings Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="btn-icon"
                title="Settings & Refresh Interval"
                aria-label="Settings"
              >
                <Sliders size={17} />
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="btn-icon"
              title="Push Notifications"
              aria-label="Push Notifications"
            >
              <Bell size={17} />
            </button>

            {/* Bookmarks */}
            <button
              onClick={onShowSaved}
              className={`btn-icon ${activeCategory === 'saved' ? 'active' : ''}`}
              title="Saved Articles"
              aria-label="Saved Articles"
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
              aria-label="Sync Live Feeds"
            >
              <RefreshCw
                size={17}
                style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="btn-icon"
              title={`Theme: ${theme.toUpperCase()}`}
              aria-label="Toggle Theme"
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

        {/* Search Bar Form */}
        <form onSubmit={onSearchSubmit} className="masthead-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search stocks, companies, topics (e.g. NVDA, TSLA, AI)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="search-clear-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>
    </header>
  );
}
