'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Header from '@/components/Header';
import BreakingTicker from '@/components/BreakingTicker';
import ChannelFilter from '@/components/ChannelFilter';
import IntelligenceBriefing, { ChangeItem } from '@/components/IntelligenceBriefing';
import EntityDetailModal from '@/components/EntityDetailModal';
import NewsFilterBar from '@/components/NewsFilterBar';
import NewsCard from '@/components/NewsCard';
import ReaderModal from '@/components/ReaderModal';
import PortfolioModal from '@/components/PortfolioModal';
import NotificationModal from '@/components/NotificationModal';
import SettingsModal, { AppSettings, DEFAULT_SETTINGS } from '@/components/SettingsModal';
import EntityDossierModal from '@/components/EntityDossierModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import ResearchTraceModal from '@/components/ResearchTraceModal';
import PortfolioIntelligenceModal from '@/components/PortfolioIntelligenceModal';
import PortfolioDeepDiveModal from '@/components/PortfolioDeepDiveModal';
import { NewsArticle, StockQuote, DailyBriefing, CategoryId, ResearchTrace, PortfolioIntelligenceProfile, CanonicalIntelligenceEvent } from '@/lib/types';
import type { PortfolioDeepDiveReport } from '@/lib/gemini';
import { getTickerMeta, isSectorEntity, TickerMetadata } from '@/lib/stock-aliases';
import { humanizeEntityTokens, humanizeEntityId, riskStateFromMateriality, confidenceLabel } from '@/lib/risk-presentation';
import { RefreshCw, VolumeX } from 'lucide-react';
import { listenForFCMForegroundMessages } from '@/lib/firebase';
import { syncPortfolioToFirebase, loadPortfolioFromFirebase } from '@/lib/firestore-sync';

const DEFAULT_PORTFOLIO = ['BCSF', 'US_FIXED_INCOME', 'PRIVATE_CREDIT', 'HIGH_YIELD_BONDS'];
const DEFAULT_INDICES = ['^GSPC', '^IXIC', '^DJI'];

export default function HomePage() {
  // isMounted guard: prevents SSR/client hydration mismatch (#425/#418/#423)
  // All localStorage-dependent state is deferred until after first client render
  const [isMounted, setIsMounted] = useState(false);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('brief');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

  // App Settings state (Default 60 min news refresh, 45s stock price refresh)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // News Board Filter Bar state
  const [newsEntityFilter, setNewsEntityFilter] = useState<string>('ALL');
  const [newsSentimentFilter, setNewsSentimentFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');
  const [newsSortBy, setNewsSortBy] = useState<'newest' | 'sentiment' | 'relevance'>('newest');
  
  // Pagination state (Page numbers & Page size)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  
  // Local storage state
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>(DEFAULT_PORTFOLIO);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Reader Modal state
  const [readerArticle, setReaderArticle] = useState<NewsArticle | null>(null);

  // Entity Dossier AI Dashboard state
  const [dossierSymbol, setDossierSymbol] = useState<string | null>(null);

  // Research Control Plane & Intelligence states
  const [isResearchTraceModalOpen, setIsResearchTraceModalOpen] = useState(false);
  const [isPortfolioProfileModalOpen, setIsPortfolioProfileModalOpen] = useState(false);
  const [researchTrace, setResearchTrace] = useState<ResearchTrace | null>(null);
  const [portfolioProfile, setPortfolioProfile] = useState<PortfolioIntelligenceProfile | null>(null);
  const [canonicalEvents, setCanonicalEvents] = useState<CanonicalIntelligenceEvent[]>([]);
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [selectedChangeItem, setSelectedChangeItem] = useState<ChangeItem | null>(null);
  const lastResearchedPortfolioKeyRef = useRef<string>('');

  // User-submitted research questions, fed into the next research cycle
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);

  // Holistic Portfolio Deep Dive report state
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [deepDiveReport, setDeepDiveReport] = useState<PortfolioDeepDiveReport | null>(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track last news refresh timestamp to prevent duplicate calls
  const lastNewsRefreshRef = useRef<number>(0);

  // Client-only mount: set isMounted to true after first render, load localStorage
  // This is the canonical fix for React hydration mismatches in Next.js App Router
  useEffect(() => {
    // Mark as mounted — this is the gate that prevents hydration mismatch
    setIsMounted(true);

    try {
      const storedSettings = localStorage.getItem('pulse_app_settings');
      // Merge over defaults so settings saved before a new option existed still resolve
      if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });

      const storedArticles = localStorage.getItem('pulse_saved_articles');
      if (storedArticles) setSavedArticles(JSON.parse(storedArticles));

      const storedPortfolio = localStorage.getItem('pulse_user_portfolio');
      if (storedPortfolio) {
        const parsed = JSON.parse(storedPortfolio);
        if (Array.isArray(parsed) && parsed.length > 0) setPortfolio(parsed);
      }

      const storedQuestions = localStorage.getItem('pulse_custom_research_questions');
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions);
        if (Array.isArray(parsedQuestions)) setCustomQuestions(parsedQuestions);
      }

      // Load cloud portfolio from Firebase Firestore database 'pulsenews'
      loadPortfolioFromFirebase().then((cloudData) => {
        if (cloudData && Array.isArray(cloudData.portfolio) && cloudData.portfolio.length > 0) {
          setPortfolio(cloudData.portfolio);
          localStorage.setItem('pulse_user_portfolio', JSON.stringify(cloudData.portfolio));
        }
      }).catch(() => {});
    } catch {
      // ignore localStorage errors
    }

    // Listen for FCM foreground push notifications — only if messaging is configured
    let unsubscribe: any = null;
    listenForFCMForegroundMessages((payload) => {
      if (payload?.notification?.title) {
        console.log('[FCM] Foreground alert received:', payload.notification.title);
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch(() => {/* FCM not configured, skip silently */});

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('pulse_app_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Fetch Live Stock Quotes from Yahoo Finance API (Only for actual ticker symbols, excluding pure sectors)
  const fetchLiveQuotes = useCallback(async (customSymbols?: string[]) => {
    setIsLoadingQuotes(true);
    const activeList = customSymbols || portfolio;
    const stockOnlySymbols = activeList.filter((s) => !isSectorEntity(s));
    const symbolsToQuery = [...DEFAULT_INDICES, ...stockOnlySymbols];

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
    lastNewsRefreshRef.current = Date.now();

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
          // Never clobber the richer stateful research briefing (deltaStories/crossEntitySynthesis)
          // with this generic fallback — the deep research cycle supersedes it once it lands,
          // regardless of which fetch happens to resolve last.
          setBriefing((prev) => (prev?.deltaStories ? prev : data.briefing));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Dynamic Portfolio Profile
  const fetchPortfolioProfile = useCallback(async (customPortfolio?: string[]) => {
    try {
      const activeList = customPortfolio || portfolio;
      const res = await fetch('/api/research/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: 'user_portfolio', entities: activeList }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setPortfolioProfile(data.profile);
      }
    } catch {}
  }, [portfolio]);

  // Trigger Deep Stateful Research Cycle across the Blackboard
  const triggerDeepResearchRun = useCallback(async (customPortfolio?: string[]) => {
    setIsDeepResearching(true);
    try {
      const activeList = customPortfolio || portfolio;
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: 'user_portfolio',
          entities: activeList,
          customQuestions,
          preferredModel: settings.analysisModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setResearchTrace(data.result.trace);
          setCanonicalEvents(data.result.events || []);

          // Synthesize delta briefing into state
          if (data.result.deltaStories) {
            const materialCount = (data.result.events || data.result.deltaStories).length;
            setBriefing({
              date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
              greeting: `STATEFUL DELTA RESEARCH BRIEFING • ${(portfolioProfile?.primaryDomain || 'PORTFOLIO').toUpperCase()}`,
              overview: `Stateful Research Cycle: ${materialCount} material incremental development${materialCount === 1 ? '' : 's'} identified. ${data.result.synthesisSummary}`,
              marketMood: data.result.synthesisSummary,
              topStories: [],
              keyBulletPoints: data.result.deltaStories.map((d: any) => `${d.entityName}: ${d.whatChanged} — ${d.portfolioImpact}`),
              generatedAt: new Date().toISOString(),
              deltaStories: data.result.deltaStories,
              quietEntities: data.result.quietEntities,
              portfolioDomain: portfolioProfile?.primaryDomain,
              stateTransitionsCount: data.result.deltaStories.length,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Deep research run failed:', e);
    } finally {
      setIsDeepResearching(false);
    }
  }, [portfolio, portfolioProfile, customQuestions, settings.analysisModel]);

  // Auto-run the senior analyst research cycle whenever the mounted portfolio
  // composition actually changes (covers initial default portfolio, then the
  // real portfolio once localStorage/Firebase resolve) so the homepage always
  // opens with a completed analysis instead of requiring a manual click.
  useEffect(() => {
    if (!isMounted || portfolio.length === 0) return;
    const key = [...portfolio].sort().join(',');
    if (key === lastResearchedPortfolioKeyRef.current) return;
    lastResearchedPortfolioKeyRef.current = key;
    triggerDeepResearchRun(portfolio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, portfolio]);

  // Initial load + Dynamic auto-refresh intervals based on Settings (Default 60 min)
  useEffect(() => {
    fetchLiveQuotes();
    fetchNews('portfolio', '', null);
    fetchBriefing();
    fetchPortfolioProfile();

    // Auto-refresh live stock quotes (default 45s)
    const quoteIntervalMs = (settings.quotesRefreshIntervalSeconds || 45) * 1000;
    const quoteInterval = setInterval(() => fetchLiveQuotes(), quoteIntervalMs);

    // Auto-refresh portfolio news (default 60 min, or 0 for manual)
    let newsInterval: any = null;
    if (settings.newsRefreshIntervalMinutes > 0) {
      const newsIntervalMs = settings.newsRefreshIntervalMinutes * 60_000;
      newsInterval = setInterval(() => {
        if (!searchQuery && !selectedStockFilter) {
          fetchNews('portfolio', '', null);
        }
      }, newsIntervalMs);
    }

    return () => {
      clearInterval(quoteInterval);
      if (newsInterval) clearInterval(newsInterval);
    };
  }, [fetchLiveQuotes, fetchNews, fetchBriefing, fetchPortfolioProfile, searchQuery, selectedStockFilter, settings]);

  // Handle Category selection
  const handleSelectCategory = (cat: CategoryId) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSelectedStockFilter(null);
    setNewsEntityFilter('ALL');
    setNewsSentimentFilter('ALL');
    if (cat !== 'saved' && cat !== 'brief') {
      fetchNews(cat, '', null);
    }
  };

  // Filter news for a specific clicked stock/sector
  const handleSelectStockFilter = (symbol: string) => {
    if (!symbol) {
      setSelectedStockFilter(null);
      setNewsEntityFilter('ALL');
      fetchNews(activeCategory, searchQuery, null);
    } else {
      setSelectedStockFilter(symbol);
      setNewsEntityFilter(symbol);
      fetchNews('markets', '', symbol);
    }
  };

  // Dynamic sector pill click (portfolio-derived sectors shown in the top nav)
  const handleSelectSectorPill = (symbol: string) => {
    setSearchQuery('');
    setActiveCategory('portfolio');
    handleSelectStockFilter(symbol);
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedStockFilter(null);
    setNewsEntityFilter('ALL');
    if (searchQuery.trim()) {
      fetchNews(activeCategory, searchQuery.toUpperCase(), null);
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
  const handleAddSymbol = (sym: string, _meta?: Partial<TickerMetadata>) => {
    const clean = sym.toUpperCase();
    const updated = [...new Set([...portfolio, clean])];
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}

    // Synchronize to custom named Firebase Firestore database 'pulsenews'
    syncPortfolioToFirebase({ portfolio: updated });

    // Immediately sync live quotes AND news for the new portfolio
    fetchLiveQuotes(updated);
    fetchNews('portfolio', '', null, updated);
  };

  const handleRemoveSymbol = (sym: string) => {
    const updated = portfolio.filter((s) => s !== sym);
    setPortfolio(updated);
    try {
      localStorage.setItem('pulse_user_portfolio', JSON.stringify(updated));
    } catch {}

    // Synchronize to custom named Firebase Firestore database 'pulsenews'
    syncPortfolioToFirebase({ portfolio: updated });

    fetchLiveQuotes(updated);
    fetchNews('portfolio', '', null, updated);
  };

  // Custom Research Questions — persisted locally, fed into the next research cycle
  const handleAddCustomQuestion = (question: string) => {
    const updated = [...new Set([...customQuestions, question])];
    setCustomQuestions(updated);
    try {
      localStorage.setItem('pulse_custom_research_questions', JSON.stringify(updated));
    } catch {}
  };

  const handleRemoveCustomQuestion = (question: string) => {
    const updated = customQuestions.filter((q) => q !== question);
    setCustomQuestions(updated);
    try {
      localStorage.setItem('pulse_custom_research_questions', JSON.stringify(updated));
    } catch {}
  };

  // Holistic Portfolio Deep Dive — a brief long-form read synthesized from the
  // current research cycle's findings (no new scraping)
  const fetchDeepDiveReport = useCallback(async () => {
    setIsLoadingDeepDive(true);
    try {
      const materialChanges = (canonicalEvents.length > 0 ? canonicalEvents : []).map((e) => {
        const riskState = riskStateFromMateriality(e.materiality);
        const symbol = e.canonicalEntityId.replace(/^(?:ENT_)+/, '');
        return {
          symbol,
          entity: getTickerMeta(symbol)?.name || humanizeEntityId(e.canonicalEntityId),
          headline: humanizeEntityTokens(e.title),
          whatChanged: humanizeEntityTokens(e.summary),
          whyItMatters: humanizeEntityTokens(e.implications?.[0] || e.materiality.reasoning),
          riskState: riskState.label,
          tone: riskState.tone,
          confidence: confidenceLabel(e.confidenceScore),
          facts: e.facts.map((f) => humanizeEntityTokens(f.statement)),
          metrics: e.metrics.map((m) => ({
            label: m.metricName,
            from: m.previousValue !== undefined ? String(m.previousValue) : undefined,
            to: String(m.currentValue),
          })),
        };
      });
      const quietList = (briefing?.quietEntities || []).map((q) => ({
        entity: humanizeEntityTokens(q.entityName),
        status: q.lastKnownState,
      }));

      const res = await fetch('/api/research/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: portfolioProfile?.primaryDomain || 'portfolio',
          entities: portfolio.map((sym) => ({ symbol: sym, name: getTickerMeta(sym)?.name || sym })),
          materialChanges,
          quietEntities: quietList,
          crossSynthesisSummary: briefing?.crossEntitySynthesis?.summary
            ? humanizeEntityTokens(briefing.crossEntitySynthesis.summary)
            : undefined,
          preferredModel: settings.analysisModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) setDeepDiveReport(data.report);
      }
    } catch (e) {
      console.warn('Portfolio deep dive failed:', e);
    } finally {
      setIsLoadingDeepDive(false);
    }
  }, [canonicalEvents, briefing, portfolioProfile, portfolio, settings.analysisModel]);

  const handleOpenDeepDive = useCallback(() => {
    setIsDeepDiveOpen(true);
    if (!deepDiveReport && !isLoadingDeepDive) {
      fetchDeepDiveReport();
    }
  }, [deepDiveReport, isLoadingDeepDive, fetchDeepDiveReport]);

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

  const sectorSymbols = useMemo(() => portfolio.filter((s) => isSectorEntity(s)), [portfolio]);
  const showWire = activeCategory !== 'brief' || !!searchQuery;
  const rawDisplayedArticles = activeCategory === 'saved' ? savedArticles : articles;

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    let list = [...rawDisplayedArticles];

    // 1. Filter by Entity (if selected)
    if (newsEntityFilter !== 'ALL') {
      const meta = getTickerMeta(newsEntityFilter);
      const searchTerms = [
        newsEntityFilter.toLowerCase(),
        (meta?.name || '').toLowerCase(),
        ...(meta?.aliases || []).map((a) => a.toLowerCase()),
      ].filter((t) => t.length > 1);

      list = list.filter((article) => {
        const text = `${article.title} ${article.description} ${article.source}`.toLowerCase();
        return searchTerms.some((t) => text.includes(t));
      });
    }

    // 2. Filter by Sentiment (if selected)
    if (newsSentimentFilter !== 'ALL') {
      list = list.filter((article) => {
        const s = (article.sentiment || 'neutral').toUpperCase();
        return s === newsSentimentFilter;
      });
    }

    // 3. Sorting
    if (newsSortBy === 'sentiment') {
      const priority: Record<string, number> = { negative: 1, positive: 2, neutral: 3 };
      list.sort((a, b) => (priority[a.sentiment || 'neutral'] || 3) - (priority[b.sentiment || 'neutral'] || 3));
    } else if (newsSortBy === 'relevance') {
      list.sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0));
    } else {
      list.sort((a, b) => b.timestamp - a.timestamp);
    }

    return list;
  }, [rawDisplayedArticles, newsEntityFilter, newsSentimentFilter, newsSortBy]);

  // Reset pagination on filter or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedStockFilter, searchQuery, newsEntityFilter, newsSentimentFilter, newsSortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  const handleResetFilters = () => {
    setNewsEntityFilter('ALL');
    setNewsSentimentFilter('ALL');
    setNewsSortBy('newest');
    setSelectedStockFilter(null);
    setCurrentPage(1);
  };

  // Header title generator
  const getChannelHeading = () => {
    if (activeCategory === 'saved') return 'SAVED READING LIST';
    if (selectedStockFilter) return `INTELLIGENCE WIRE: ${selectedStockFilter}`;
    if (searchQuery) return `SEARCH RESULTS: "${searchQuery.toUpperCase()}"`;
    if (activeCategory === 'portfolio') return '💼 CURATED PORTFOLIO & SECTOR INTELLIGENCE';
    return 'FRONT PAGE TOP STORIES';
  };

  // SSR skeleton — renders server-side with no dynamic state to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <div style={{ height: 40, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }} />
        <div style={{ height: 80, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }} />
        <main className="container" style={{ flex: 1, paddingTop: 14 }}>
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.08em', fontFamily: 'var(--font-mono, monospace)' }}>
            INITIALIZING MARKET INTELLIGENCE TERMINAL...
          </div>
        </main>
      </div>
    );
  }

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
        onSearchChange={(q) => setSearchQuery(q.toUpperCase())}
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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeCategory={activeCategory}
      />

      <main className="container" style={{ flex: 1, paddingTop: 14 }}>
        {/* Underlined Section Channels */}
        <ChannelFilter
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          savedCount={savedArticles.length}
          portfolioCount={portfolio.length}
          sectorSymbols={sectorSymbols}
          activeSectorFilter={selectedStockFilter}
          onSelectSector={handleSelectSectorPill}
        />

        {/* Front Page: Analyst-First Portfolio Analytics Brief */}
        {activeCategory === 'brief' && !searchQuery && (
          <IntelligenceBriefing
            briefing={briefing}
            canonicalEvents={canonicalEvents}
            portfolioProfile={portfolioProfile}
            portfolioSymbols={portfolio}
            isResearching={isDeepResearching}
            onRefreshAnalysis={() => triggerDeepResearchRun()}
            onOpenChangeDetail={(item) => setSelectedChangeItem(item)}
            onOpenEntityDossier={(sym) => setDossierSymbol(sym)}
            onOpenResearchTrace={() => setIsResearchTraceModalOpen(true)}
            onOpenPortfolioProfile={() => setIsPortfolioProfileModalOpen(true)}
            onOpenManagePortfolio={() => setIsPortfolioModalOpen(true)}
            onOpenDeepDive={handleOpenDeepDive}
          />
        )}

        {/* Section Headline Banner */}
        {showWire && (
        <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '18px 0 12px 0',
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
                ? `BOOLEAN QUERY FEEDS & NEWS FOR ${selectedStockFilter}`
                : activeCategory === 'portfolio'
                ? `AUTO-SYNCED ACROSS ${portfolio.length} ASSETS & SECTORS • SYNC INTERVAL: ${settings.newsRefreshIntervalMinutes > 0 ? `${settings.newsRefreshIntervalMinutes} MIN` : 'MANUAL'}`
                : `${filteredArticles.length} STORIES REPORTED • CONTINUOUS MONITORING`}
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
                CLEAR {selectedStockFilter} FILTER
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
                CLEAR SEARCH
              </button>
            )}
          </div>
        </div>

        {/* Top News Filter Bar (Filter by Entity, Sentiment, Sort) */}
        <NewsFilterBar
          portfolioSymbols={portfolio}
          selectedEntityFilter={newsEntityFilter}
          onSelectEntityFilter={setNewsEntityFilter}
          selectedSentimentFilter={newsSentimentFilter}
          onSelectSentimentFilter={setNewsSentimentFilter}
          sortBy={newsSortBy}
          onSelectSortBy={setNewsSortBy}
          totalCount={rawDisplayedArticles.length}
          filteredCount={filteredArticles.length}
          onResetFilters={handleResetFilters}
        />

        {/* Empty / Loading State */}
        {isRefreshingNews && filteredArticles.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: 'var(--accent-gold)' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>FETCHING LIVE INTELLIGENCE WIRE...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', margin: '20px 0 60px' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
              {activeCategory === 'saved'
                ? 'NO SAVED ARTICLES YET. BOOKMARK ARTICLES TO READ THEM ANYTIME.'
                : 'NO RECENT HEADLINES MATCHING YOUR FILTER CRITERIA.'}
            </p>
            {(newsEntityFilter !== 'ALL' || newsSentimentFilter !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="btn-portfolio-action"
                style={{ marginTop: 12 }}
              >
                RESET FILTERS TO VIEW ALL
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Newspaper Style Editorial Grid */}
            <div className="news-grid">
              {paginatedArticles.map((article) => (
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

            {/* Pagination Controls Bar */}
            {filteredArticles.length > pageSize && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  SHOWING <strong>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredArticles.length)}</strong> OF <strong>{filteredArticles.length}</strong> DISPATCHES
                </div>

                <div className="pagination-controls">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="btn-page-nav"
                  >
                    ← PREV
                  </button>

                  <div className="pagination-pills">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((pageNum, idx, arr) => (
                        <React.Fragment key={pageNum}>
                          {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                            <span className="pagination-ellipsis">...</span>
                          )}
                          <button
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            className={`btn-page-num ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="btn-page-nav"
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </>
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

      {/* Terminal & Sync Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Portfolio Intelligence Profile Modal */}
      <PortfolioIntelligenceModal
        isOpen={isPortfolioProfileModalOpen}
        onClose={() => setIsPortfolioProfileModalOpen(false)}
        profile={portfolioProfile}
        customQuestions={customQuestions}
        onAddCustomQuestion={handleAddCustomQuestion}
        onRemoveCustomQuestion={handleRemoveCustomQuestion}
      />

      {/* Holistic Portfolio Deep Dive — brief long-form analytical read */}
      <PortfolioDeepDiveModal
        isOpen={isDeepDiveOpen}
        report={deepDiveReport}
        isLoading={isLoadingDeepDive}
        onClose={() => setIsDeepDiveOpen(false)}
        onRegenerate={() => {
          setDeepDiveReport(null);
          fetchDeepDiveReport();
        }}
      />

      {/* Research Trace & Blackboard Inspector Modal */}
      <ResearchTraceModal
        isOpen={isResearchTraceModalOpen}
        onClose={() => setIsResearchTraceModalOpen(false)}
        trace={researchTrace}
      />

      {/* Analyst Detail View — progressive disclosure for a single "What Changed" item */}
      {selectedChangeItem && (
        <EntityDetailModal
          item={selectedChangeItem}
          onClose={() => setSelectedChangeItem(null)}
          onOpenResearchTrace={() => {
            setSelectedChangeItem(null);
            setIsResearchTraceModalOpen(true);
          }}
        />
      )}

      {/* AI-Generated Entity & Sector Intelligence Dossier Dashboard */}
      <EntityDossierModal
        symbol={dossierSymbol}
        quote={stockQuotes.find((q) => q.symbol === dossierSymbol)}
        articles={articles}
        isOpen={!!dossierSymbol}
        onClose={() => setDossierSymbol(null)}
        onSelectArticle={setReaderArticle}
        onFilterHomeFeed={(sym) => handleSelectStockFilter(sym)}
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
            <strong>FINANCIAL PULSE</strong> • GLOBAL MARKET & PORTFOLIO INTELLIGENCE EDITION
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            PWA ENABLED • FCM PUSH PROTOCOL • YAHOO FINANCE LIVE STREAM
          </div>
        </div>
      </footer>
    </div>
  );
}
