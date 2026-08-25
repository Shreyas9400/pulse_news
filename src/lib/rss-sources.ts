export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  icon: string;
  isFinancialTicker?: boolean;
}

export const RSS_SOURCES: RssSource[] = [
  // Yahoo Finance & General Markets
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
    id: 'marketwatch-top',
    name: 'MarketWatch',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    category: 'business',
    icon: '🏛️',
  },

  // INDUSTRY 1: Semiconductors & Chips (Requested by user)
  {
    id: 'industry-chips',
    name: 'Semiconductors & Chips',
    url: 'https://news.google.com/rss/search?q=(Semiconductor+OR+NVIDIA+OR+TSMC+OR+ASML+OR+Intel+OR+AMD+OR+Qualcomm)+AND+(chips+OR+fabrication+OR+wafer+OR+earnings)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-chips',
    icon: '⚡',
  },

  // INDUSTRY 2: AI, Cloud & Datacenters
  {
    id: 'industry-ai-cloud',
    name: 'AI & Cloud Infrastructure',
    url: 'https://news.google.com/rss/search?q=(OpenAI+OR+Anthropic+OR+Azure+OR+AWS+OR+"Google+Cloud"+OR+Datacenter)+AND+(AI+OR+LLM+OR+cloud+OR+infrastructure)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-ai-cloud',
    icon: '🧠',
  },

  // INDUSTRY 3: EV, Automotive & Clean Energy
  {
    id: 'industry-ev',
    name: 'EV & Clean Energy',
    url: 'https://news.google.com/rss/search?q=(Tesla+OR+Rivian+OR+BYD+OR+"Clean+Energy"+OR+Lithium+OR+Battery)+AND+(EV+OR+automotive+OR+deliveries+OR+solar)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-ev',
    icon: '🚗',
  },

  // INDUSTRY 4: Fintech, Crypto & Banking
  {
    id: 'industry-fintech',
    name: 'Fintech & Banking',
    url: 'https://news.google.com/rss/search?q=(Fintech+OR+Banking+OR+"JPMorgan"+OR+"Goldman+Sachs"+OR+Coinbase+OR+Stripe)+AND+(Federal+Reserve+OR+interest+rates+OR+credit)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-fintech',
    icon: '💳',
  },

  // INDUSTRY 5: Biotech & Healthcare
  {
    id: 'industry-biotech',
    name: 'Biotech & Pharma',
    url: 'https://news.google.com/rss/search?q=(Biotech+OR+Pharmaceuticals+OR+"Eli+Lilly"+OR+"Novo+Nordisk"+OR+Pfizer)+AND+(FDA+approval+OR+clinical+trial+OR+drug)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-biotech',
    icon: '🧬',
  },

  // INDUSTRY 6: Cybersecurity & Defense Tech
  {
    id: 'industry-cyber',
    name: 'Cybersecurity & Defense',
    url: 'https://news.google.com/rss/search?q=(Cybersecurity+OR+CrowdStrike+OR+"Palo+Alto+Networks"+OR+Defense+OR+Lockheed)+AND+(ransomware+OR+zero-day+OR+contract)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-cyber',
    icon: '🛡️',
  },

  // General Tech
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

  // Science
  {
    id: 'phys-org',
    name: 'Phys.org Science',
    url: 'https://phys.org/rss-feed/',
    category: 'science',
    icon: '🔬',
  },
];

/**
 * Returns a Google News RSS feed URL for dynamic keyword searches with search operators
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
