'use client';

import React from 'react';
import { CategoryId, CategoryTab } from '@/lib/types';
import { Sparkles, TrendingUp, Cpu, Globe, Briefcase, Atom, Bookmark, Layers } from 'lucide-react';

interface ChannelFilterProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  savedCount: number;
}

const CATEGORIES: { id: CategoryId; label: string; icon: any }[] = [
  { id: 'all', label: 'Top Headlines', icon: Layers },
  { id: 'markets', label: 'Yahoo Finance & Markets', icon: TrendingUp },
  { id: 'ai', label: 'AI & Frontier Tech', icon: Sparkles },
  { id: 'tech', label: 'Tech & Startups', icon: Cpu },
  { id: 'world', label: 'World News', icon: Globe },
  { id: 'business', label: 'Business & Economy', icon: Briefcase },
  { id: 'science', label: 'Science & Space', icon: Atom },
  { id: 'saved', label: 'Saved Articles', icon: Bookmark },
];

export default function ChannelFilter({
  activeCategory,
  onSelectCategory,
  savedCount,
}: ChannelFilterProps) {
  return (
    <nav className="channels-nav" aria-label="News Channels">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`channel-pill ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span>{cat.label}</span>
            {cat.id === 'saved' && savedCount > 0 && (
              <span
                style={{
                  background: isActive ? '#ffffff' : 'var(--accent-amber)',
                  color: isActive ? '#000' : '#000',
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                {savedCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
