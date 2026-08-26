export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  icon: string;
  isFinancialTicker?: boolean;
}

export const RSS_SOURCES: RssSource[] = [
  // US Fixed Income, Credit Markets & Macro
  {
    id: 'us-fixed-income-wire',
    name: 'US Fixed Income & Credit Wire',
    url: 'https://news.google.com/rss/search?q=(Corporate+Bonds+OR+"Treasury+Yields"+OR+"Credit+Spreads"+OR+"Private+Credit"+OR+"High+Yield+Debt"+OR+"Bond+Issuance")&hl=en-US&gl=US&ceid=US:en',
    category: 'markets',
    icon: '📊',
    isFinancialTicker: true,
  },
  {
    id: 'private-credit-bdc-wire',
    name: 'Private Credit & BDC Wire',
    url: 'https://news.google.com/rss/search?q=("Private+Credit"+OR+"Direct+Lending"+OR+"BDC"+OR+"Tender+Offer"+OR+"Repurchase+Offer"+OR+"Non-Accrual"+OR+"Cliffwater"+OR+"Bain+Capital+Specialty")&hl=en-US&gl=US&ceid=US:en',
    category: 'markets',
    icon: '🏛️',
    isFinancialTicker: true,
  },
  {
    id: 'yahoo-finance-credit-etfs',
    name: 'Fixed Income & Bond Markets',
    url: 'https://finance.yahoo.com/rss/headline?s=HYG,LQD,BND,JNK,^TNX,^TYX',
    category: 'markets',
    icon: '📈',
    isFinancialTicker: true,
  },
  {
    id: 'marketwatch-macro',
    name: 'MarketWatch Economy & Markets',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    category: 'business',
    icon: '🏛️',
  },

  // INDUSTRY 1: Semiconductors & Hardware
  {
    id: 'industry-chips',
    name: 'Semiconductors & Foundries',
    url: 'https://news.google.com/rss/search?q=(Semiconductor+OR+TSMC+OR+ASML+OR+Foundry)+AND+(fabrication+OR+wafer+OR+earnings+OR+capacity)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-chips',
    icon: '⚡',
  },

  // INDUSTRY 2: AI, Cloud & Datacenters
  {
    id: 'industry-ai-cloud',
    name: 'AI & Cloud Infrastructure',
    url: 'https://news.google.com/rss/search?q=(Datacenter+OR+"Cloud+Infrastructure"+OR+"AI+Compute"+OR+Hyperscaler)+AND+(earnings+OR+capex+OR+debt)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-ai-cloud',
    icon: '🧠',
  },

  // INDUSTRY 3: EV, Automotive & Clean Energy
  {
    id: 'industry-ev',
    name: 'Clean Energy & Automotive',
    url: 'https://news.google.com/rss/search?q=("Clean+Energy"+OR+Renewable+OR+"Grid+Storage"+OR+Automotive)+AND+(debt+OR+earnings+OR+deliveries)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-ev',
    icon: '🚗',
  },

  // INDUSTRY 4: Fintech, Banking & Lending
  {
    id: 'industry-fintech',
    name: 'Banking & Financial Services',
    url: 'https://news.google.com/rss/search?q=(Banking+OR+"Federal+Reserve"+OR+"Commercial+Lending"+OR+"Credit+Risk")+AND+(interest+rates+OR+deposits+OR+liquidity)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-fintech',
    icon: '💳',
  },

  // INDUSTRY 5: Biotech & Healthcare
  {
    id: 'industry-biotech',
    name: 'Biotech & Pharma',
    url: 'https://news.google.com/rss/search?q=(Biotech+OR+Pharmaceuticals)+AND+(FDA+approval+OR+clinical+trial+OR+revenue)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-biotech',
    icon: '🧬',
  },

  // INDUSTRY 6: Cybersecurity & Defense Tech
  {
    id: 'industry-cyber',
    name: 'Defense & Aerospace',
    url: 'https://news.google.com/rss/search?q=("Defense+Contractor"+OR+Aerospace+OR+Cybersecurity)+AND+(contract+OR+procurement+OR+revenue)&hl=en-US&gl=US&ceid=US:en',
    category: 'industry-cyber',
    icon: '🛡️',
  },

  // Global Macro & Economy
  {
    id: 'bbc-business',
    name: 'BBC Global Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'world',
    icon: '🌐',
  },
  {
    id: 'reuters-macro',
    name: 'Macro Economy News',
    url: 'https://news.google.com/rss/search?q=(Federal+Reserve+OR+"Treasury+Department"+OR+Inflation+CPI+OR+GDP)+AND+(United+States)&hl=en-US&gl=US&ceid=US:en',
    category: 'business',
    icon: '🌍',
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
  const clean = symbols.map((s) => encodeURIComponent(s.trim().toUpperCase())).join(',');
  return `https://finance.yahoo.com/rss/headline?s=${clean}`;
}
