/**
 * Comprehensive Ticker, Sector & Alias Directory
 * Every entity carries: ticker, full name, aliases for search, industry sector,
 * and contextual keywords for Boolean search operator enhancement.
 */

export interface TickerMetadata {
  symbol: string;
  name: string;
  aliases: string[];
  industry: string;
  keywords: string[];
  isSector?: boolean;
}

// ============================================================================
//  SECTOR TRACKERS (ETFs and sector-level intelligence feeds)
// ============================================================================
export const SECTOR_DIRECTORY: Record<string, TickerMetadata> = {
  // Technology
  XLK: {
    symbol: 'XLK',
    name: 'Technology Sector (SPDR)',
    aliases: ['Tech sector', 'technology stocks', 'SPDR Technology', 'S&P 500 Technology'],
    industry: 'Technology',
    keywords: ['tech sector ETF', 'software', 'semiconductors', 'cloud computing', 'hardware'],
    isSector: true,
  },
  // Semiconductors
  SMH: {
    symbol: 'SMH',
    name: 'Semiconductor ETF (VanEck)',
    aliases: ['Semiconductor sector', 'chip stocks', 'VanEck Semiconductor', 'chips ETF'],
    industry: 'Semiconductors',
    keywords: ['chip demand', 'AI chips', 'fab capacity', 'semiconductor supply chain', 'wafer'],
    isSector: true,
  },
  SOXX: {
    symbol: 'SOXX',
    name: 'iShares Semiconductor ETF',
    aliases: ['SOXX ETF', 'semiconductor index', 'chip sector'],
    industry: 'Semiconductors',
    keywords: ['foundry', 'chip equipment', 'AI accelerator demand', 'TSMC'],
    isSector: true,
  },
  // Financials
  XLF: {
    symbol: 'XLF',
    name: 'Financial Sector (SPDR)',
    aliases: ['Financial sector', 'bank stocks', 'banking ETF', 'financials'],
    industry: 'Financials',
    keywords: ['interest rates', 'bank earnings', 'Fed policy', 'credit', 'loan growth'],
    isSector: true,
  },
  // Healthcare & Biotech
  XLV: {
    symbol: 'XLV',
    name: 'Healthcare Sector (SPDR)',
    aliases: ['Healthcare sector', 'pharma stocks', 'health ETF', 'biotech sector'],
    industry: 'Healthcare',
    keywords: ['FDA approval', 'clinical trials', 'drug pipeline', 'Medicare', 'pharma revenue'],
    isSector: true,
  },
  XBI: {
    symbol: 'XBI',
    name: 'Biotech ETF (SPDR)',
    aliases: ['Biotech sector', 'biotech stocks', 'gene therapy', 'clinical stage'],
    industry: 'Biotech',
    keywords: ['FDA Phase 3', 'drug approval', 'gene editing', 'oncology', 'pipeline catalyst'],
    isSector: true,
  },
  // Energy
  XLE: {
    symbol: 'XLE',
    name: 'Energy Sector (SPDR)',
    aliases: ['Energy sector', 'oil stocks', 'oil gas ETF', 'crude oil sector'],
    industry: 'Energy',
    keywords: ['crude oil price', 'OPEC', 'natural gas', 'refining margins', 'drilling'],
    isSector: true,
  },
  // Clean Energy & EV
  QCLN: {
    symbol: 'QCLN',
    name: 'Clean Energy ETF',
    aliases: ['Clean energy sector', 'renewable energy stocks', 'solar wind EV ETF'],
    industry: 'Clean Energy',
    keywords: ['solar power', 'wind energy', 'EV charging', 'battery technology', 'green hydrogen'],
    isSector: true,
  },
  // Consumer Discretionary
  XLY: {
    symbol: 'XLY',
    name: 'Consumer Discretionary (SPDR)',
    aliases: ['Consumer discretionary', 'retail stocks', 'consumer ETF'],
    industry: 'Consumer',
    keywords: ['retail sales', 'consumer spending', 'luxury brands', 'e-commerce'],
    isSector: true,
  },
  // Cybersecurity
  CIBR: {
    symbol: 'CIBR',
    name: 'Cybersecurity ETF',
    aliases: ['Cybersecurity sector', 'cyber defense stocks', 'infosec ETF'],
    industry: 'Cybersecurity',
    keywords: ['data breach', 'ransomware', 'zero trust', 'cloud security', 'threat detection'],
    isSector: true,
  },
  // AI & Robotics
  BOTZ: {
    symbol: 'BOTZ',
    name: 'Robotics & AI ETF',
    aliases: ['AI sector', 'robotics stocks', 'artificial intelligence ETF'],
    industry: 'AI & Robotics',
    keywords: ['AI models', 'autonomous systems', 'machine learning', 'industrial automation'],
    isSector: true,
  },
  // Defense
  ITA: {
    symbol: 'ITA',
    name: 'Aerospace & Defense ETF',
    aliases: ['Defense sector', 'defense stocks', 'aerospace ETF', 'military contractors'],
    industry: 'Defense',
    keywords: ['defense budget', 'military contract', 'fighter jet', 'missile defense', 'Pentagon'],
    isSector: true,
  },
};

// ============================================================================
//  INDIVIDUAL STOCK TICKER DIRECTORY (Mega-caps, popular names)
// ============================================================================
export const TICKER_DIRECTORY: Record<string, TickerMetadata> = {
  // ----- Mega-Cap Technology -----
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA',
    aliases: ['Nvidia', 'Jensen Huang', 'GeForce', 'Blackwell', 'Hopper GPU', 'CUDA'],
    industry: 'Semiconductors',
    keywords: ['AI chips', 'datacenter GPU', 'GPU demand', 'earnings', 'quarterly revenue'],
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple',
    aliases: ['Apple Inc', 'Tim Cook', 'iPhone', 'iOS', 'Apple Intelligence', 'Vision Pro', 'MacBook'],
    industry: 'Consumer Tech',
    keywords: ['iPhone sales', 'services revenue', 'App Store', 'earnings', 'hardware'],
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft',
    aliases: ['Microsoft', 'Satya Nadella', 'Azure Cloud', 'Copilot', 'Windows', 'Office 365', 'GitHub'],
    industry: 'Cloud & AI Software',
    keywords: ['Azure growth', 'cloud computing', 'OpenAI investment', 'enterprise revenue'],
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet / Google',
    aliases: ['Google', 'Alphabet', 'Sundar Pichai', 'Gemini AI', 'YouTube', 'Google Cloud', 'Waymo', 'DeepMind'],
    industry: 'Search & Cloud',
    keywords: ['search ad revenue', 'YouTube ads', 'Google Cloud profit', 'antitrust'],
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon',
    aliases: ['Amazon.com', 'Andy Jassy', 'AWS', 'Amazon Web Services', 'Prime', 'Alexa'],
    industry: 'E-commerce & Cloud',
    keywords: ['AWS cloud revenue', 'e-commerce retail', 'logistics', 'cloud margins'],
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms',
    aliases: ['Meta', 'Mark Zuckerberg', 'Facebook', 'Instagram', 'WhatsApp', 'Llama AI', 'Reality Labs', 'Threads'],
    industry: 'Social & AI',
    keywords: ['ad revenue', 'daily active users', 'open source AI', 'metaverse spending'],
  },

  // ----- Semiconductors -----
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    aliases: ['AMD', 'Lisa Su', 'Ryzen', 'Radeon', 'Instinct MI300', 'EPYC'],
    industry: 'Semiconductors',
    keywords: ['AI accelerator', 'datacenter chips', 'CPU market share', 'datacenter revenue'],
  },
  AVGO: {
    symbol: 'AVGO',
    name: 'Broadcom',
    aliases: ['Broadcom Inc', 'Hock Tan', 'VMware', 'networking chips'],
    industry: 'Semiconductors',
    keywords: ['AI networking', 'custom silicon', 'VMware integration', 'infrastructure software'],
  },
  TSM: {
    symbol: 'TSM',
    name: 'Taiwan Semiconductor (TSMC)',
    aliases: ['TSMC', 'Taiwan Semi', 'C.C. Wei', 'foundry', 'chip fabrication'],
    industry: 'Semiconductors',
    keywords: ['advanced node', '3nm', '5nm', 'wafer revenue', 'fab capacity'],
  },
  INTC: {
    symbol: 'INTC',
    name: 'Intel',
    aliases: ['Intel Corporation', 'Pat Gelsinger', 'Core Ultra', 'Gaudi', 'Intel Foundry'],
    industry: 'Semiconductors',
    keywords: ['process node', 'foundry services', 'PC chip market', 'turnaround'],
  },
  QCOM: {
    symbol: 'QCOM',
    name: 'Qualcomm',
    aliases: ['Qualcomm', 'Snapdragon', 'Cristiano Amon', '5G modem'],
    industry: 'Semiconductors',
    keywords: ['5G chips', 'mobile SoC', 'licensing revenue', 'automotive chips'],
  },
  ARM: {
    symbol: 'ARM',
    name: 'Arm Holdings',
    aliases: ['ARM', 'Arm Ltd', 'Rene Haas', 'ARM architecture', 'RISC'],
    industry: 'Semiconductors',
    keywords: ['chip architecture', 'royalty revenue', 'mobile processors', 'AI edge computing'],
  },

  // ----- EV & Automotive -----
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla',
    aliases: ['Tesla Inc', 'Elon Musk', 'Cybertruck', 'Model Y', 'Model 3', 'FSD', 'Optimus', 'Megapack'],
    industry: 'EV & Robotics',
    keywords: ['EV deliveries', 'automotive margins', 'energy storage', 'Gigafactory'],
  },
  RIVN: {
    symbol: 'RIVN',
    name: 'Rivian',
    aliases: ['Rivian Automotive', 'RJ Scaringe', 'R1T', 'R1S', 'electric pickup'],
    industry: 'EV',
    keywords: ['EV delivery volume', 'production ramp', 'gross margin', 'VW partnership'],
  },
  LCID: {
    symbol: 'LCID',
    name: 'Lucid Motors',
    aliases: ['Lucid Group', 'Lucid Air', 'Lucid Gravity'],
    industry: 'EV',
    keywords: ['luxury EV', 'production numbers', 'Saudi investment', 'range record'],
  },

  // ----- Fintech & Finance -----
  COIN: {
    symbol: 'COIN',
    name: 'Coinbase',
    aliases: ['Coinbase Global', 'Brian Armstrong', 'Base L2', 'crypto exchange'],
    industry: 'Fintech & Crypto',
    keywords: ['trading volume', 'crypto custody', 'spot Bitcoin ETF', 'transaction fees'],
  },
  SQ: {
    symbol: 'SQ',
    name: 'Block (Square)',
    aliases: ['Block Inc', 'Jack Dorsey', 'Square', 'Cash App', 'Afterpay'],
    industry: 'Fintech',
    keywords: ['payment volume', 'Cash App users', 'Bitcoin revenue', 'seller ecosystem'],
  },
  PYPL: {
    symbol: 'PYPL',
    name: 'PayPal',
    aliases: ['PayPal Holdings', 'Alex Chriss', 'Venmo', 'Braintree'],
    industry: 'Fintech',
    keywords: ['payment volume', 'active accounts', 'checkout conversion', 'Venmo revenue'],
  },

  // ----- Enterprise Software & AI -----
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir',
    aliases: ['Palantir Technologies', 'Alex Karp', 'AIP', 'Foundry', 'Gotham', 'Warp Speed'],
    industry: 'Enterprise Software & Defense',
    keywords: ['defense contracts', 'commercial customer count', 'AIP bootcamp', 'government software'],
  },
  CRM: {
    symbol: 'CRM',
    name: 'Salesforce',
    aliases: ['Salesforce', 'Marc Benioff', 'Agentforce', 'Slack', 'Tableau'],
    industry: 'Enterprise Software',
    keywords: ['CRM revenue', 'subscription growth', 'AI agents', 'enterprise cloud'],
  },
  SNOW: {
    symbol: 'SNOW',
    name: 'Snowflake',
    aliases: ['Snowflake Inc', 'Sridhar Ramaswamy', 'data cloud', 'data warehouse'],
    industry: 'Data & AI',
    keywords: ['product revenue', 'data cloud', 'consumption model', 'AI workloads'],
  },
  NOW: {
    symbol: 'NOW',
    name: 'ServiceNow',
    aliases: ['ServiceNow', 'Bill McDermott', 'IT workflow', 'ITSM'],
    industry: 'Enterprise Software',
    keywords: ['subscription revenue', 'workflow automation', 'AI agent', 'digital transformation'],
  },

  // ----- Cybersecurity -----
  CRWD: {
    symbol: 'CRWD',
    name: 'CrowdStrike',
    aliases: ['CrowdStrike', 'George Kurtz', 'Falcon platform', 'endpoint security'],
    industry: 'Cybersecurity',
    keywords: ['ARR', 'endpoint protection', 'cloud security', 'threat intelligence'],
  },
  PANW: {
    symbol: 'PANW',
    name: 'Palo Alto Networks',
    aliases: ['Palo Alto Networks', 'Nikesh Arora', 'Prisma Cloud', 'firewall'],
    industry: 'Cybersecurity',
    keywords: ['NGS ARR', 'zero trust', 'SASE', 'network security'],
  },

  // ----- Streaming & Entertainment -----
  NFLX: {
    symbol: 'NFLX',
    name: 'Netflix',
    aliases: ['Netflix Inc', 'Ted Sarandos', 'streaming wars'],
    industry: 'Streaming',
    keywords: ['subscriber growth', 'ad tier', 'content spend', 'password sharing crackdown'],
  },
  DIS: {
    symbol: 'DIS',
    name: 'Walt Disney',
    aliases: ['Disney', 'Bob Iger', 'Disney+', 'Marvel', 'ESPN'],
    industry: 'Entertainment',
    keywords: ['streaming subscribers', 'park revenue', 'box office', 'ESPN betting'],
  },

  // ----- Crypto -----
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    aliases: ['Bitcoin', 'BTC', 'spot Bitcoin ETF', 'digital gold', 'Satoshi'],
    industry: 'Digital Assets',
    keywords: ['cryptocurrency rally', 'halving', 'institutional inflows', 'hashrate', 'mining'],
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'Ethereum',
    aliases: ['Ethereum', 'ETH', 'Ether', 'Ethereum ETF', 'Vitalik Buterin'],
    industry: 'Digital Assets',
    keywords: ['smart contracts', 'DeFi staking', 'gas fees', 'layer 2', 'restaking'],
  },
  'SOL-USD': {
    symbol: 'SOL-USD',
    name: 'Solana',
    aliases: ['Solana', 'SOL', 'Solana blockchain'],
    industry: 'Digital Assets',
    keywords: ['Solana DeFi', 'transaction speed', 'validator', 'meme coins', 'NFTs'],
  },

  // ----- ETFs & Indices -----
  SPY: {
    symbol: 'SPY',
    name: 'S&P 500 ETF (SPDR)',
    aliases: ['S&P 500', 'SPX', 'SP500', 'market index'],
    industry: 'Broad Market Index',
    keywords: ['stock market', 'bull run', 'correction', 'all-time high'],
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Nasdaq 100 ETF (Invesco)',
    aliases: ['Nasdaq 100', 'QQQ', 'tech-heavy index', 'Nasdaq Composite'],
    industry: 'Tech Index',
    keywords: ['tech rally', 'growth stocks', 'mega-cap tech', 'Nasdaq record'],
  },

  // ----- Other Blue Chips -----
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    aliases: ['JPMorgan', 'Jamie Dimon', 'Chase Bank', 'JP Morgan'],
    industry: 'Banking',
    keywords: ['net interest income', 'investment banking', 'trading revenue', 'credit quality'],
  },
  V: {
    symbol: 'V',
    name: 'Visa',
    aliases: ['Visa Inc', 'payment network', 'card transactions'],
    industry: 'Payments',
    keywords: ['payment volume', 'cross-border transactions', 'fintech partnership'],
  },
  UNH: {
    symbol: 'UNH',
    name: 'UnitedHealth Group',
    aliases: ['UnitedHealth', 'Optum', 'health insurer'],
    industry: 'Healthcare',
    keywords: ['medical costs', 'enrollment', 'Optum revenue', 'Medicare Advantage'],
  },
  LLY: {
    symbol: 'LLY',
    name: 'Eli Lilly',
    aliases: ['Eli Lilly', 'Mounjaro', 'Zepbound', 'tirzepatide', 'GLP-1'],
    industry: 'Pharma',
    keywords: ['GLP-1 revenue', 'obesity drug', 'diabetes treatment', 'FDA approval'],
  },
  NVO: {
    symbol: 'NVO',
    name: 'Novo Nordisk',
    aliases: ['Novo Nordisk', 'Ozempic', 'Wegovy', 'semaglutide'],
    industry: 'Pharma',
    keywords: ['weight loss drug', 'GLP-1 agonist', 'clinical trial', 'obesity market'],
  },
};

// Merged full directory (stocks + sectors)
export const FULL_DIRECTORY: Record<string, TickerMetadata> = {
  ...TICKER_DIRECTORY,
  ...SECTOR_DIRECTORY,
};

// Known sector and ETF symbol set for automatic classification
export const KNOWN_SECTOR_SYMBOLS = new Set([
  'XLK', 'SMH', 'SOXX', 'XLF', 'XLV', 'XBI', 'XLE', 'QCLN', 'CIBR', 'BOTZ', 'ITA', 'XLY',
  'XLC', 'XLI', 'XLU', 'XLRE', 'GDX', 'VNQ', 'VTI', 'QQQ', 'SPY', 'IWM', 'DIA', 'ARKK', 'VGT'
]);

/**
 * Save user custom metadata to localStorage
 */
export function saveCustomMetadata(symbol: string, meta: Partial<TickerMetadata>) {
  if (typeof window === 'undefined') return;
  try {
    const clean = symbol.trim().toUpperCase();
    const stored = localStorage.getItem('pulse_custom_metadata');
    const map: Record<string, TickerMetadata> = stored ? JSON.parse(stored) : {};
    
    const existing = FULL_DIRECTORY[clean] || {};
    map[clean] = {
      symbol: clean,
      name: meta.name || existing.name || clean,
      aliases: meta.aliases || existing.aliases || [],
      industry: meta.industry || existing.industry || (meta.isSector ? 'Sector ETF' : 'Custom Asset'),
      keywords: meta.keywords || existing.keywords || ['stock', 'earnings', 'market'],
      isSector: meta.isSector ?? (existing.isSector || KNOWN_SECTOR_SYMBOLS.has(clean)),
    };
    
    localStorage.setItem('pulse_custom_metadata', JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving custom metadata:', e);
  }
}

/**
 * Get custom metadata from localStorage
 */
export function getCustomMetadataMap(): Record<string, TickerMetadata> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('pulse_custom_metadata');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get metadata for any symbol (stock or sector), checking user custom map first
 */
export function getTickerMeta(symbol: string): TickerMetadata | null {
  const clean = symbol.trim().toUpperCase();
  
  // 1. Check user custom defined metadata
  const customMap = getCustomMetadataMap();
  if (customMap[clean]) {
    return customMap[clean];
  }

  // 2. Check full static directory
  if (FULL_DIRECTORY[clean]) {
    return FULL_DIRECTORY[clean];
  }

  // 3. Fallback auto-detection for sector symbols
  if (KNOWN_SECTOR_SYMBOLS.has(clean)) {
    return {
      symbol: clean,
      name: `${clean} Sector ETF`,
      aliases: [clean, `${clean} ETF`],
      industry: 'Sector / ETF',
      keywords: ['sector', 'ETF', 'index', 'market'],
      isSector: true,
    };
  }

  return null;
}

/**
 * Builds an optimized Boolean search operator query for any stock or sector symbol
 */
export function buildEnhancedSearchQuery(symbol: string): string {
  const clean = symbol.trim().toUpperCase();
  const meta = getTickerMeta(clean) || FULL_DIRECTORY[clean];

  if (meta) {
    const aliasGroup = [meta.symbol, meta.name, ...meta.aliases]
      .filter(Boolean)
      .map(a => (a.includes(' ') ? `"${a}"` : a))
      .join(' OR ');

    const contextTerms = meta.isSector
      ? ['sector', 'industry', 'outlook', ...(meta.keywords || []).slice(0, 3)]
      : ['stock', 'shares', 'earnings', 'revenue', ...(meta.keywords || []).slice(0, 2)];

    const contextGroup = contextTerms
      .filter(Boolean)
      .map(k => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ');

    return `(${aliasGroup}) AND (${contextGroup})`;
  }

  // Generic fallback for any arbitrary ticker
  return `("${clean}" OR "${clean} stock") AND (shares OR earnings OR revenue OR market)`;
}

/**
 * Builds combined Boolean query for an entire portfolio watchlist (stocks + sectors)
 */
export function buildPortfolioCombinedQuery(symbols: string[]): string {
  if (!symbols || symbols.length === 0) return 'stock market earnings revenue';

  const parts = symbols.slice(0, 10).map(sym => {
    const clean = sym.trim().toUpperCase();
    const meta = getTickerMeta(clean) || FULL_DIRECTORY[clean];
    if (meta) {
      return `"${meta.name}" OR ${clean}`;
    }
    return `"${clean}"`;
  });

  return `(${parts.join(' OR ')}) AND (stock OR shares OR earnings OR quarterly OR business OR sector)`;
}

/**
 * Get all available sectors for the portfolio sector picker
 */
export function getAvailableSectors(): TickerMetadata[] {
  return Object.values(SECTOR_DIRECTORY);
}

/**
 * Get search-friendly display label with aliases for any symbol
 */
export function getSymbolDisplayInfo(symbol: string): {
  name: string;
  industry: string;
  aliases: string[];
  isSector: boolean;
} {
  const meta = getTickerMeta(symbol) || FULL_DIRECTORY[symbol.toUpperCase()];
  if (meta) {
    return {
      name: meta.name,
      industry: meta.industry,
      aliases: meta.aliases,
      isSector: !!meta.isSector,
    };
  }
  return {
    name: symbol,
    industry: 'Unknown',
    aliases: [],
    isSector: false,
  };
}
