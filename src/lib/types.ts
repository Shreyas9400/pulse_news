export interface StockQuote {
  symbol: string;
  shortName: string;
  price: number;
  formattedPrice: string;
  change: number;
  changePercent: number;
  formattedChange: string;
  isPositive: boolean;
  currency: string;
  high?: number;
  low?: number;
  volume?: string;
  sparkline?: number[];
}

export type StockTickerItem = StockQuote;

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  contentSnippet?: string;
  content?: string;
  source: string;
  sourceIcon?: string;
  publishedAt: string;
  timestamp: number;
  category: string;
  imageUrl?: string;
  author?: string;
  isSaved?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summaryBullets?: string[];
  stockTicker?: {
    symbol: string;
    change?: string;
  };
}

export interface DailyBriefing {
  date: string;
  greeting: string;
  overview: string;
  marketMood: string;
  topStories: NewsArticle[];
  keyBulletPoints: string[];
  generatedAt: string;
}

export type CategoryId =
  | 'portfolio'
  | 'all'
  | 'markets'
  | 'tech'
  | 'ai'
  | 'world'
  | 'business'
  | 'science'
  | 'saved';

export interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: string;
  badge?: string;
}
