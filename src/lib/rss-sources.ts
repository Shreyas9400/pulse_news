export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: 'markets' | 'tech' | 'ai' | 'world' | 'business' | 'science';
  icon: string;
  isFinancialTicker?: boolean;
}

export const RSS_SOURCES: RssSource[] = [
  // Yahoo Finance & Markets (Requested by user)
  {
    id: 'yahoo-finance-top',
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'markets',
    icon: '📈',
    isFinancialTicker: true,
  },
  {
    id: 'yahoo-finance-stocks',
    name: 'Yahoo Finance Stocks',
    url: 'https://finance.yahoo.com/rss/headline?s=^GSPC,^DJI,^IXIC,AAPL,MSFT,NVDA,GOOGL,AMZN,TSLA',
    category: 'markets',
    icon: '📊',
    isFinancialTicker: true,
  },
  {
    id: 'cnbc-markets',
    name: 'CNBC Markets',
    url: 'https://search.cnbc.com/rs/search/combinedlist.view?partnerId=wrss01&id=15839069',
    category: 'markets',
    icon: '💹',
  },
  {
    id: 'marketwatch-top',
    name: 'MarketWatch',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    category: 'business',
    icon: '🏛️',
  },

  // Tech & AI
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    icon: '⚡',
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    icon: '📱',
  },
  {
    id: 'hackernews',
    name: 'Hacker News Frontpage',
    url: 'https://hnrss.org/frontpage',
    category: 'tech',
    icon: '💻',
  },
  {
    id: 'arstechnica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'tech',
    icon: '🤖',
  },
  {
    id: 'google-ai-news',
    name: 'AI & Machine Learning',
    url: 'https://news.google.com/rss/search?q=Artificial+Intelligence+OR+LLM+OR+OpenAI+OR+NVIDIA&hl=en-US&gl=US&ceid=US:en',
    category: 'ai',
    icon: '🧠',
  },

  // World News
  {
    id: 'bbc-world',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    icon: '🌐',
  },
  {
    id: 'google-world',
    name: 'Google World News',
    url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en',
    category: 'world',
    icon: '🌍',
  },
  {
    id: 'npr-news',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'world',
    icon: '🎙️',
  },

  // Science
  {
    id: 'phys-org',
    name: 'Phys.org Science',
    url: 'https://phys.org/rss-feed/',
    category: 'science',
    icon: '🔬',
  },
  {
    id: 'nasa-breaking',
    name: 'NASA Breaking News',
    url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    category: 'science',
    icon: '🚀',
  },
];

/**
 * Returns a Google News RSS feed URL for dynamic keyword searches
 */
export function getCustomSearchRssUrl(query: string): string {
  const clean = encodeURIComponent(query.trim());
  return `https://news.google.com/rss/search?q=${clean}&hl=en-US&gl=US&ceid=US:en`;
}

/**
 * Returns Yahoo Finance RSS feed URL for specific stock ticker symbol(s)
 */
export function getYahooStockRssUrl(symbols: string[]): string {
  const clean = symbols.map(s => s.trim().toUpperCase()).join(',');
  return `https://finance.yahoo.com/rss/headline?s=${clean}`;
}
