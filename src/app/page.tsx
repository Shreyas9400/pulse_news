'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BreakingTicker from '@/components/BreakingTicker';
import ChannelFilter from '@/components/ChannelFilter';
import BriefingHero from '@/components/BriefingHero';
import NewsCard from '@/components/NewsCard';
import ReaderModal from '@/components/ReaderModal';
import PortfolioModal from '@/components/PortfolioModal';
import { NewsArticle, StockTickerItem, DailyBriefing, CategoryId } from '@/lib/types';
import { Sparkles, AlertCircle, RefreshCw, VolumeX, Plus, Wallet } from 'lucide-react';

const DEFAULT_PORTFOLIO = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'BTC-USD'];

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [marketTickers, setMarketTickers] = useState<StockTickerItem[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local storage state
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>(DEFAULT_PORTFOLIO);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  // Reader Modal state
  const [readerArticle, setReaderArticle] = useState<NewsArticle | null>(null);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load bookmarks and portfolio from local storage on mount
  useEffect(() => {
    try {
      const storedArticles = localStorage.getItem('pulse_saved_articles');
      if (storedArticles) {
        setSavedArticles(JSON.parse(storedArticles));
      }

      const storedPortfolio = localStorage.getItem('pulse_user_portfolio');
      if (storedPortfolio) {
        const parsed = JSON.parse(storedPortfolio);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPortfolio(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch News and Briefing
  const fetchNews = useCallback(async (cat: CategoryId = 'all', query: string = '', userPortfolio?: string[]) => {
    setIsRefreshing(true);
    setError(null);

    try {
      let url = `/api/news?category=${cat}`;
      
      if (cat === 'portfolio') {
        const activeSymbols = userPortfolio || portfolio;
        url = `/api/news?category=markets&symbols=${encodeURIComponent(activeSymbols.join(','))}`;
      } else if (query.trim()) {
        url = `/api/news?q=${encodeURIComponent(query.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.articles) {
        setArticles(data.articles);
      }
      if (data.marketTickers) {
        setMarketTickers(data.marketTickers);
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError('Unable to reach feed server. Loaded cached offline news.');
    } finally {
      setIsRefreshing(false);
    }
  }, [portfolio]);

  // Fetch AI Daily Briefing
  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch('/api/summarize');
      if (res.ok) {
        const data = await res.json();
        if (data.briefing) {
          setBriefing(data.briefing);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNews('all', '');
    fetchBriefing();
  }, [fetchNews, fetchBriefing]);

  // Handle Category selection
  const handleSelectCategory = (cat: CategoryId) => {
    setActiveCategory(cat);
    setSearchQuery('');
    if (cat !== 'saved') {
      fetchNews(cat, '', portfolio);
    }
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchNews('all', searchQuery);
    } else {
      fetchNews(activeCategory, '', portfolio);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleSave = (article: NewsArticle) => {
    const isAlreadySaved = savedArticles.some((a) => a.id === article.id || a.title === article.title);
    let updated: NewsArticle[];
    if (isAlreadySaved) {
      updated = savedArticles.filter((a) => a.id !== article.id && a.title !== article.title);
    } else {
      updated = [{ ...article, isSaved: true }, ...savedArticles];
    }
    setSavedArticles(updated);
    try {
      localStorage.setItem('pulse_saved_articles', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Portfolio Management
  const handleAddSymbol = (sym: string) => {
    const updated = [...new Set([...portfolio, sym.toUpperCase()])];
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}
    if (activeCategory === 'portfolio') {
      fetchNews('portfolio', '', updated);
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    const updated = portfolio.filter((s) => s !== sym);
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}
    if (activeCategory === 'portfolio') {
      fetchNews('portfolio', '', updated);
    }
  };

  // Audio Speech Synthesis Handler
  const handlePlayAudio = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Current list to display
  const displayedArticles = activeCategory === 'saved' ? savedArticles : articles;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Real-time Market Ticker (Yahoo Finance) */}
      <BreakingTicker
        tickers={marketTickers}
        onOpenPortfolio={() => setIsPortfolioModalOpen(true)}
      />

      {/* Main Navigation Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={() => {
          fetchNews(activeCategory, searchQuery, portfolio);
          fetchBriefing();
        }}
        isRefreshing={isRefreshing}
        savedCount={savedArticles.length}
        onShowSaved={() => handleSelectCategory('saved')}
        activeCategory={activeCategory}
      />

      <main className="container" style={{ flex: 1, paddingTop: 20 }}>
        {/* Channel Navigation Pills */}
        <ChannelFilter
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          savedCount={savedArticles.length}
          portfolioCount={portfolio.length}
        />

        {/* AI Morning/Executive Briefing Section (Visible on Top Headlines tab) */}
        {activeCategory === 'all' && !searchQuery && (
          <BriefingHero
            briefing={briefing}
            onPlayBriefingAudio={handlePlayAudio}
            isSpeaking={isSpeaking}
            onSelectArticle={setReaderArticle}
          />
        )}

        {/* Search / Channel Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '20px 0 24px 0',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {activeCategory === 'saved'
                ? 'Saved Articles & Reading List'
                : activeCategory === 'portfolio'
                ? '💼 My Tracked Portfolio News (Yahoo Finance)'
                : searchQuery
                ? `Search Results for "${searchQuery}"`
                : activeCategory === 'markets'
                ? 'Yahoo Finance & Market Movers'
                : activeCategory === 'ai'
                ? 'Frontier AI & Machine Learning'
                : activeCategory === 'tech'
                ? 'Tech Trends & Silicon Valley'
                : activeCategory === 'world'
                ? 'Global Geopolitics & World News'
                : activeCategory === 'business'
                ? 'Business, Trade & Economy'
                : activeCategory === 'science'
                ? 'Science, Space & Innovation'
                : 'Real-Time Top Stories'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              {activeCategory === 'portfolio'
                ? `Tracking ${portfolio.length} symbols (${portfolio.join(', ')})`
                : `${displayedArticles.length} stories synced • Stale-While-Revalidate active`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {activeCategory === 'portfolio' && (
              <button
                onClick={() => setIsPortfolioModalOpen(true)}
                style={{
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} />
                <span>Manage Portfolio Tickers</span>
              </button>
            )}

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchNews(activeCategory, '', portfolio);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Empty State / Loading State */}
        {isRefreshing && displayedArticles.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw
              size={32}
              style={{
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
                color: 'var(--accent-primary)',
              }}
            />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aggregating fresh feeds from multi-source RSS network...</p>
          </div>
        ) : displayedArticles.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              margin: '20px 0 60px',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {activeCategory === 'saved'
                ? 'You have no saved articles yet. Bookmark stories using the bookmark icon to read them anytime.'
                : activeCategory === 'portfolio'
                ? 'No recent headlines found for your portfolio symbols. Click "Manage Portfolio Tickers" to add more symbols.'
                : 'No matching articles found for this topic.'}
            </p>
          </div>
        ) : (
          /* News Grid */
          <div className="news-grid">
            {displayedArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isSaved={savedArticles.some((a) => a.id === article.id || a.title === article.title)}
                onToggleSave={handleToggleSave}
                onOpenReader={setReaderArticle}
                onPlayAudio={handlePlayAudio}
              />
            ))}
          </div>
        )}
      </main>

      {/* Portfolio Customization Modal */}
      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        portfolio={portfolio}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
      />

      {/* Distraction-Free Reader Modal */}
      {readerArticle && (
        <ReaderModal
          article={readerArticle}
          onClose={() => setReaderArticle(null)}
          isSaved={savedArticles.some((a) => a.id === readerArticle.id || a.title === readerArticle.title)}
          onToggleSave={handleToggleSave}
          onPlayAudio={handlePlayAudio}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Floating Audio Narrator Player when speaking */}
      {isSpeaking && (
        <div className="audio-bar">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              boxShadow: '0 0 10px var(--accent-emerald)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Voice Narrator Playing...
          </span>
          <button
            onClick={stopAudio}
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fb7185',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <VolumeX size={13} />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 0',
          background: 'rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>PulseNews</strong> • Continuous AI-Powered Intelligence Platform
          </div>
          <div>
            Zero-Maintenance Architecture • Deployable to Vercel with ISR & GitHub Actions Cron
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
