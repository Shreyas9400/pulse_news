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

const CATEGORIES: { id: CategoryId; label: string; icon: any; isFeatured?: boolean; group?: string }[] = [
  { id: 'portfolio', label: '💼 My Portfolio', icon: Wallet, isFeatured: true },
  { id: 'all', label: 'Top Headlines', icon: Layers },
  // Industry Channels
  { id: 'industry-chips', label: '⚡ Semiconductors & Chips', icon: Zap },
  { id: 'industry-ai-cloud', label: '🧠 AI & Cloud Infra', icon: Sparkles },
  { id: 'industry-ev', label: '🚗 EV & Clean Energy', icon: Car },
  { id: 'industry-fintech', label: '💳 Fintech & Banking', icon: CreditCard },
  { id: 'industry-biotech', label: '🧬 Biotech & Pharma', icon: Dna },
  { id: 'industry-cyber', label: '🛡️ Cyber & Defense', icon: ShieldAlert },
  // General Channels
  { id: 'markets', label: 'Yahoo Finance & Markets', icon: TrendingUp },
  { id: 'tech', label: 'Tech Trends', icon: Cpu },
  { id: 'world', label: 'World News', icon: Globe },
  { id: 'business', label: 'Economy & Business', icon: Briefcase },
  { id: 'science', label: 'Science & Space', icon: Atom },
  { id: 'saved', label: 'Saved Articles', icon: Bookmark },
];

export default function ChannelFilter({
  activeCategory,
  onSelectCategory,
  savedCount,
  portfolioCount = 0,
}: ChannelFilterProps) {
  return (
    <nav className="channels-nav" aria-label="News and Industry Channels">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`channel-pill ${isActive ? 'active' : ''} ${cat.isFeatured ? 'featured-pill' : ''}`}
          >
            <Icon size={15} />
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
  );
}
