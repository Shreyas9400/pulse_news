/**
 * Ticker Aliases and Smart Search Operator Generator
 */

export interface TickerMetadata {
  symbol: string;
  name: string;
  aliases: string[];
  industry: string;
  keywords: string[];
}

export const TICKER_DIRECTORY: Record<string, TickerMetadata> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA',
    aliases: ['Nvidia', 'Jensen Huang', 'GeForce', 'Blackwell', 'Hopper GPU'],
    industry: 'Semiconductors',
    keywords: ['AI chips', 'datacenter', 'GPU demand', 'earnings', 'quarterly revenue'],
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple',
    aliases: ['Apple Inc', 'Tim Cook', 'iPhone', 'iOS', 'Apple Intelligence', 'Vision Pro'],
    industry: 'Consumer Tech',
    keywords: ['iPhone sales', 'services revenue', 'App Store', 'earnings', 'hardware'],
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft',
    aliases: ['Microsoft', 'Satya Nadella', 'Azure Cloud', 'Copilot', 'Windows'],
    industry: 'Cloud & AI Software',
    keywords: ['Azure growth', 'cloud computing', 'OpenAI investment', 'enterprise revenue'],
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla',
    aliases: ['Tesla Inc', 'Elon Musk', 'Cybertruck', 'Model Y', 'FSD', 'Optimus'],
    industry: 'EV & Robotics',
    keywords: ['EV deliveries', 'automotive margins', 'energy storage', 'Gigafactory'],
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon',
    aliases: ['Amazon.com', 'Andy Jassy', 'AWS', 'Amazon Web Services', 'Prime'],
    industry: 'E-commerce & Cloud',
    keywords: ['AWS cloud revenue', 'e-commerce retail', 'logistics', 'cloud margins'],
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet / Google',
    aliases: ['Google', 'Alphabet', 'Sundar Pichai', 'Gemini AI', 'YouTube', 'Google Cloud'],
    industry: 'Search & Cloud',
    keywords: ['search ad revenue', 'YouTube ads', 'Google Cloud profit', 'antitrust'],
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms',
    aliases: ['Meta', 'Mark Zuckerberg', 'Facebook', 'Instagram', 'Llama AI', 'Reality Labs'],
    industry: 'Social & AI',
    keywords: ['ad revenue', 'daily active users', 'open source AI', 'metaverse spending'],
  },
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    aliases: ['AMD', 'Lisa Su', 'Ryzen', 'Radeon', 'Instinct MI300'],
    industry: 'Semiconductors',
    keywords: ['AI accelerator', 'datacenter chips', 'CPU market share', 'datacenter revenue'],
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir',
    aliases: ['Palantir Technologies', 'Alex Karp', 'AIP', 'Foundry', 'Gotham'],
    industry: 'Enterprise Software & Defense',
    keywords: ['defense contracts', 'commercial customer count', 'AIP bootcamp', 'government software'],
  },
  COIN: {
    symbol: 'COIN',
    name: 'Coinbase',
    aliases: ['Coinbase Global', 'Brian Armstrong', 'Base L2'],
    industry: 'Fintech & Crypto',
    keywords: ['trading volume', 'crypto custody', 'spot Bitcoin ETF', 'transaction fees'],
  },
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    aliases: ['Bitcoin', 'BTC', 'spot Bitcoin ETF'],
    industry: 'Digital Assets',
    keywords: ['cryptocurrency rally', 'halving', 'institutional inflows', 'hashrate'],
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'Ethereum',
    aliases: ['Ethereum', 'ETH', 'Ether', 'Ethereum ETF'],
    industry: 'Digital Assets',
    keywords: ['smart contracts', 'DeFi staking', 'gas fees', 'layer 2'],
  },
};

/**
 * Builds an optimized Boolean search operator query for any stock symbol
 */
export function buildEnhancedSearchQuery(symbol: string): string {
  const clean = symbol.trim().toUpperCase();
  const meta = TICKER_DIRECTORY[clean];

  if (meta) {
    const aliasGroup = [meta.symbol, ...meta.aliases]
      .map(a => (a.includes(' ') ? `"${a}"` : a))
      .join(' OR ');
    
    const contextGroup = ['stock', 'shares', 'earnings', 'revenue', ...meta.keywords.slice(0, 2)]
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ');

    return `(${aliasGroup}) AND (${contextGroup})`;
  }

  // Generic fallback for any arbitrary ticker (e.g. RELIANCE.NS, BABA, SOFI)
  return `("${clean}" OR "${clean} stock") AND (shares OR earnings OR revenue OR market)`;
}

/**
 * Builds combined Boolean query for an entire portfolio watchlist
 */
export function buildPortfolioCombinedQuery(symbols: string[]): string {
  if (!symbols || symbols.length === 0) return 'stock market earnings revenue';

  const parts = symbols.slice(0, 8).map(sym => {
    const clean = sym.trim().toUpperCase();
    const meta = TICKER_DIRECTORY[clean];
    if (meta) {
      return `"${meta.name}" OR ${clean}`;
    }
    return `"${clean}"`;
  });

  return `(${parts.join(' OR ')}) AND (stock OR shares OR earnings OR quarterly OR business)`;
}
