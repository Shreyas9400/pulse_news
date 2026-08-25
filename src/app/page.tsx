'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BreakingTicker from '@/components/BreakingTicker';
import ChannelFilter from '@/components/ChannelFilter';
import BriefingHero from '@/components/BriefingHero';
import PortfolioOverview from '@/components/PortfolioOverview';
import NewsCard from '@/components/NewsCard';
import ReaderModal from '@/components/ReaderModal';
import PortfolioModal from '@/components/PortfolioModal';
import NotificationModal from '@/components/NotificationModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import { NewsArticle, StockQuote, DailyBriefing, CategoryId } from '@/lib/types';
import { Sparkles, AlertCircle, RefreshCw, VolumeX, Plus, Wallet, Bell } from 'lucide-react';
import { listenForFCMForegroundMessages } from '@/lib/firebase';

const DEFAULT_PORTFOLIO = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'BTC-USD'];
const DEFAULT_INDICES = ['^GSPC', '^IXIC', '^DJI'];

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('portfolio');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  
  // Local storage state
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>(DEFAULT_PORTFOLIO);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

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

    // Listen for FCM foreground push notifications
    const unsubscribeFCM = listenForFCMForegroundMessages((payload) => {
      console.log('Foreground FCM received:', payload);
      alert(`[Market Alert] ${payload.notification?.title}: ${payload.notification?.body}`);
    });

    return () => {
      if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
    };
  }, []);

  // Fetch Live Stock Quotes from Yahoo Finance API
  const fetchLiveQuotes = useCallback(async (customSymbols?: string[]) => {
    setIsLoadingQuotes(true);
    const symbolsToQuery = [...DEFAULT_INDICES, ...(customSymbols || portfolio)];
    try {
      const res = await fetch(`/api/stocks?symbols=${encodeURIComponent(symbolsToQuery.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          setStockQuotes(data.quotes);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live quotes:', e);
    } finally {
      setIsLoadingQuotes(false);
    }
  }, [portfolio]);

  // Fetch News with Enhanced Boolean Operator Support
  const fetchNews = useCallback(async (
    cat: CategoryId = 'portfolio',
    query: string = '',
    stockFilter?: string | null,
    targetPortfolio?: string[]
  ) => {
    setIsRefreshingNews(true);

    try {
      let url = `/api/news?category=${cat}`;

      if (stockFilter) {
        url = `/api/news?category=markets&symbols=${encodeURIComponent(stockFilter)}`;
      } else if (cat === 'portfolio') {
        const activeSymbols = targetPortfolio || (portfolio.length > 0 ? portfolio : DEFAULT_PORTFOLIO);
        url = `/api/news?category=portfolio&symbols=${encodeURIComponent(activeSymbols.join(','))}`;
      } else if (query.trim()) {
        url = `/api/news?q=${encodeURIComponent(query.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
    } finally {
      setIsRefreshingNews(false);
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

  // Initial load
  useEffect(() => {
    fetchLiveQuotes();
    fetchNews('portfolio', '', null);
    fetchBriefing();

    // Auto-refresh live stock quotes every 45 seconds
    const quoteInterval = setInterval(() => fetchLiveQuotes(), 45000);
    return () => clearInterval(quoteInterval);
  }, [fetchLiveQuotes, fetchNews, fetchBriefing]);

  // Handle Category selection
  const handleSelectCategory = (cat: CategoryId) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSelectedStockFilter(null);
    if (cat !== 'saved') {
      fetchNews(cat, '', null);
    }
  };

  // Filter news for a specific clicked stock
  const handleSelectStockFilter = (symbol: string) => {
    if (!symbol) {
      setSelectedStockFilter(null);
      fetchNews(activeCategory, searchQuery, null);
    } else {
      setSelectedStockFilter(symbol);
      fetchNews('markets', '', symbol);
    }
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedStockFilter(null);
    if (searchQuery.trim()) {
      fetchNews('all', searchQuery, null);
    } else {
      fetchNews(activeCategory, '', null);
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

  // Portfolio Management with Immediate Live Auto-Sync
  const handleAddSymbol = (sym: string) => {
    const clean = sym.toUpperCase();
    const updated = [...new Set([...portfolio, clean])];
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}
    
    fetchLiveQuotes(updated);
    fetchNews('portfolio', '', null, updated);
  };

  const handleRemoveSymbol = (sym: string) => {
    const updated = portfolio.filter((s) => s !== sym);
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}
    
    fetchLiveQuotes(updated);
    fetchNews('portfolio', '', null, updated);
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

  const userPortfolioQuotes = stockQuotes.filter(q => portfolio.includes(q.symbol));
  const displayedArticles = activeCategory === 'saved' ? savedArticles : articles;

  // Header title generator
  const getChannelHeading = () => {
    if (activeCategory === 'saved') return 'Saved Reading List';
    if (selectedStockFilter) return `Intelligence Wire: $${selectedStockFilter}`;
    if (searchQuery) return `Search Results: "${searchQuery}"`;
    if (activeCategory === 'portfolio') return '💼 Curated Portfolio Intelligence';
    if (activeCategory === 'industry-chips') return '⚡ Semiconductor & Chip Industry Wire';
    if (activeCategory === 'industry-ai-cloud') return '🧠 AI & Cloud Infrastructure Intelligence';
    if (activeCategory === 'industry-ev') return '🚗 EV, Clean Energy & Mobility';
    if (activeCategory === 'industry-fintech') return '💳 Fintech, Banking & Macro Radar';
    if (activeCategory === 'industry-biotech') return '🧬 Biotech, Pharma & Clinical Trials';
    if (activeCategory === 'industry-cyber') return '🛡️ Cybersecurity & Defense Technology';
    if (activeCategory === 'markets') return '📈 Financial Markets & Stock Indices';
    if (activeCategory === 'tech') return '💻 Technology & Silicon Valley';
    if (activeCategory === 'world') return '🌐 Global Affairs & World News';
    if (activeCategory === 'business') return '🏛️ Business, Trade & Commerce';
    if (activeCategory === 'science') return '🔬 Science & Space Breakthroughs';
    return 'Front Page Top Stories';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Real-time Authentic Market Ticker (Yahoo Finance) */}
      <BreakingTicker
        quotes={stockQuotes}
        onOpenPortfolio={() => setIsPortfolioModalOpen(true)}
      />

      {/* FT/WSJ Style Masthead Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={() => {
          fetchLiveQuotes();
          fetchNews(activeCategory, searchQuery, selectedStockFilter);
          fetchBriefing();
        }}
        isRefreshing={isRefreshingNews || isLoadingQuotes}
        savedCount={savedArticles.length}
        onShowSaved={() => handleSelectCategory('saved')}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        activeCategory={activeCategory}
      />

      <main className="container" style={{ flex: 1, paddingTop: 14 }}>
        {/* Underlined Section Channels */}
        <ChannelFilter
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          savedCount={savedArticles.length}
          portfolioCount={portfolio.length}
        />

        {/* Executive Portfolio Dashboard Panel */}
        {(activeCategory === 'portfolio' || activeCategory === 'all') && !searchQuery && (
          <PortfolioOverview
            quotes={userPortfolioQuotes.length > 0 ? userPortfolioQuotes : stockQuotes.filter(q => !DEFAULT_INDICES.includes(q.symbol))}
            onOpenManageModal={() => setIsPortfolioModalOpen(true)}
            onSelectSymbolFilter={handleSelectStockFilter}
            selectedSymbolFilter={selectedStockFilter}
            onRefreshQuotes={() => fetchLiveQuotes()}
            isLoadingQuotes={isLoadingQuotes}
            onRemoveSymbol={handleRemoveSymbol}
          />
        )}

        {/* AI Morning Briefing Section */}
        {activeCategory === 'all' && !searchQuery && (
          <BriefingHero
            briefing={briefing}
            onPlayBriefingAudio={handlePlayAudio}
            isSpeaking={isSpeaking}
            onSelectArticle={setReaderArticle}
          />
        )}

        {/* Section Headline Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '18px 0 20px 0',
            flexWrap: 'wrap',
            gap: 10,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 10,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.45rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
              {getChannelHeading()}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              {selectedStockFilter
                ? `Boolean query feeds & Yahoo Finance articles for ${selectedStockFilter}`
                : activeCategory === 'portfolio'
                ? `Auto-synced across ${portfolio.join(', ')} via Yahoo Finance & Boolean query wires`
                : `${displayedArticles.length} stories reported • Continuous monitoring`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {selectedStockFilter && (
              <button
                onClick={() => handleSelectStockFilter('')}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear ${selectedStockFilter} Filter
              </button>
            )}

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchNews(activeCategory, '', null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Empty / Loading State */}
        {isRefreshingNews && displayedArticles.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: 'var(--accent-gold)' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>Fetching live intelligence wire...</p>
          </div>
        ) : displayedArticles.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', margin: '20px 0 60px' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
              {activeCategory === 'saved'
                ? 'No saved articles yet. Bookmark articles with the bookmark icon to read them anytime.'
                : 'No recent headlines found for this sector or portfolio.'}
            </p>
          </div>
        ) : (
          /* Newspaper Style Editorial Grid */
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

      {/* Push Notification FCM Settings Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
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

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        savedCount={savedArticles.length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
      />

      {/* Floating Audio Narrator */}
      {isSpeaking && (
        <div className="audio-bar">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
            Reading Article...
          </span>
          <button
            onClick={stopAudio}
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fb7185',
              padding: '3px 8px',
              borderRadius: 3,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <VolumeX size={12} />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Editorial Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 0',
          background: 'rgba(0, 0, 0, 0.25)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-serif)' }}>
            <strong>Financial Pulse</strong> • Global Market & Portfolio Intelligence Edition
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            PWA Enabled • FCM Push Protocol • Yahoo Finance Live Stream
          </div>
        </div>
      </footer>
    </div>
  );
}
