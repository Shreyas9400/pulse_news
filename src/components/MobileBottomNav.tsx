'use client';

import React from 'react';
import { CategoryId } from '@/lib/types';
import { Wallet, Newspaper, Zap, Bookmark, Bell } from 'lucide-react';

interface MobileBottomNavProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  savedCount: number;
  onOpenNotifications: () => void;
}

export default function MobileBottomNav({
  activeCategory,
  onSelectCategory,
  savedCount,
  onOpenNotifications,
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Portfolio */}
      <button
        onClick={() => onSelectCategory('portfolio')}
        className={`mobile-nav-item ${activeCategory === 'portfolio' ? 'active' : ''}`}
      >
        <Wallet size={20} />
        <span>Portfolio</span>
      </button>

      {/* 2. Top Headlines */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`mobile-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
      >
        <Newspaper size={20} />
        <span>Headlines</span>
      </button>

      {/* 3. Industry Sectors */}
      <button
        onClick={() => onSelectCategory('industry-chips')}
        className={`mobile-nav-item ${activeCategory.startsWith('industry-') ? 'active' : ''}`}
      >
        <Zap size={20} />
        <span>Sectors</span>
      </button>

      {/* 4. Saved Bookmarks */}
      <button
        onClick={() => onSelectCategory('saved')}
        className={`mobile-nav-item ${activeCategory === 'saved' ? 'active' : ''}`}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Bookmark size={20} />
          {savedCount > 0 && (
            <span className="mobile-nav-badge">{savedCount}</span>
          )}
        </div>
        <span>Saved</span>
      </button>

      {/* 5. Notifications */}
      <button
        onClick={onOpenNotifications}
        className="mobile-nav-item"
      >
        <Bell size={20} />
        <span>Alerts</span>
      </button>
    </nav>
  );
}
