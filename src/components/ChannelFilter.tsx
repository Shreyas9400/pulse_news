'use client';

import React from 'react';
import { CategoryId } from '@/lib/types';
import {
  Sparkles,
  TrendingUp,
  Cpu,
  Globe,
  Briefcase,
  Atom,
  Bookmark,
  Layers,
  Wallet,
  Zap,
  Car,
  CreditCard,
  Dna,
  ShieldAlert,
} from 'lucide-react';

interface ChannelFilterProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  savedCount: number;
  portfolioCount?: number;
}

const CATEGORIES: { id: CategoryId; label: string; icon: any; isFeatured?: boolean }[] = [
  { id: 'portfolio', label: 'My Portfolio', icon: Wallet, isFeatured: true },
  { id: 'all', label: 'Headlines', icon: Layers },
  // Industry Channels
  { id: 'industry-chips', label: 'Chips & Semi', icon: Zap },
  { id: 'industry-ai-cloud', label: 'AI & Cloud', icon: Sparkles },
  { id: 'industry-ev', label: 'EV & Energy', icon: Car },
  { id: 'industry-fintech', label: 'Fintech', icon: CreditCard },
  { id: 'industry-biotech', label: 'Biotech', icon: Dna },
  { id: 'industry-cyber', label: 'Defense & Cyber', icon: ShieldAlert },
  // Core Channels
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'tech', label: 'Tech', icon: Cpu },
  { id: 'world', label: 'World', icon: Globe },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'science', label: 'Science', icon: Atom },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export default function ChannelFilter({
  activeCategory,
  onSelectCategory,
  savedCount,
  portfolioCount = 0,
}: ChannelFilterProps) {
  return (
    <div className="channels-nav-wrapper">
      <nav className="channels-nav" aria-label="News Sections">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`channel-pill ${isActive ? 'active' : ''} ${cat.isFeatured ? 'featured-pill' : ''}`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              {cat.id === 'portfolio' && portfolioCount > 0 && (
                <span className="pill-badge-count">{portfolioCount}</span>
              )}
              {cat.id === 'saved' && savedCount > 0 && (
                <span className="pill-badge-count">{savedCount}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
