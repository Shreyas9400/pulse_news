/**
 * Comprehensive Ticker, Sector & Alias Directory
 * - Stocks & Crypto carry: ticker, name, aliases, industry, keywords
 * - Sectors are pure industry domains (NO TICKERS required) with names, aliases, and Boolean search keywords
 */

export interface TickerMetadata {
  symbol: string; // Ticker (for stocks) or Sector ID (e.g. SEMICONDUCTORS)
  name: string;
  aliases: string[];
  industry: string;
  keywords: string[];
  isSector?: boolean;
}

// ============================================================================
//  SECTORS (PURE INDUSTRY DOMAINS — NO TICKERS)
// ============================================================================
export const SECTOR_DIRECTORY: Record<string, TickerMetadata> = {
  SEMICONDUCTORS: {
    symbol: 'SEMICONDUCTORS',
    name: 'SEMICONDUCTORS & CHIPS',
    aliases: ['SEMICONDUCTOR', 'CHIPS', 'FOUNDRY', 'WAFER', 'FAB CAPACITY', 'CHIP MANUFACTURING', 'SILICON'],
    industry: 'SEMICONDUCTORS',
    keywords: ['CHIP DEMAND', 'AI ACCELERATOR', 'FAB CAPACITY', 'FOUNDRY', 'LITHOGRAPHY', 'SUPPLY CHAIN'],
    isSector: true,
  },
  AI_CLOUD: {
    symbol: 'AI_CLOUD',
    name: 'ARTIFICIAL INTELLIGENCE & CLOUD',
    aliases: ['ARTIFICIAL INTELLIGENCE', 'GENERATIVE AI', 'LLM', 'CLOUD INFRASTRUCTURE', 'DATACENTER AI'],
    industry: 'AI & SOFTWARE',
    keywords: ['AI MODELS', 'DATACENTER CAPACITY', 'CLOUD COMPUTING', 'GPU CLUSTERS', 'ENTERPRISE AI'],
    isSector: true,
  },
  EV_CLEAN_ENERGY: {
    symbol: 'EV_CLEAN_ENERGY',
    name: 'EV, BATTERIES & CLEAN ENERGY',
    aliases: ['ELECTRIC VEHICLES', 'CLEAN ENERGY', 'RENEWABLE ENERGY', 'SOLAR', 'BATTERY TECH'],
    industry: 'CLEAN ENERGY',
    keywords: ['EV DELIVERIES', 'BATTERY SUPPLY', 'CHARGING NETWORK', 'GRID STORAGE', 'SOLAR CAPACITY'],
    isSector: true,
  },
  FINTECH_BANKING: {
    symbol: 'FINTECH_BANKING',
    name: 'FINTECH, PAYMENTS & BANKING',
    aliases: ['FINTECH', 'BANKING', 'DIGITAL PAYMENTS', 'NEOBANKS', 'CREDIT MARKETS'],
    industry: 'FINANCIALS',
    keywords: ['INTEREST RATES', 'PAYMENT VOLUME', 'BANK EARNINGS', 'CREDIT QUALITY', 'LOAN GROWTH'],
    isSector: true,
  },
  BIOTECH_PHARMA: {
    symbol: 'BIOTECH_PHARMA',
    name: 'BIOTECH, PHARMA & HEALTHCARE',
    aliases: ['BIOTECH', 'PHARMACEUTICALS', 'DRUG PIPELINE', 'CLINICAL TRIALS', 'HEALTHCARE'],
    industry: 'HEALTHCARE',
    keywords: ['FDA APPROVAL', 'PHASE 3 TRIALS', 'GLP-1 DRUGS', 'GENE EDITING', 'ONCOLOGY'],
    isSector: true,
  },
  CYBERSECURITY: {
    symbol: 'CYBERSECURITY',
    name: 'CYBERSECURITY & DEFENSE TECH',
    aliases: ['CYBERSECURITY', 'INFOSEC', 'NETWORK SECURITY', 'DEFENSE TECH', 'ZERO TRUST'],
    industry: 'CYBERSECURITY',
    keywords: ['DATA BREACH', 'RANSOMWARE', 'CLOUD SECURITY', 'THREAT DETECTION', 'DEFENSE CONTRACTS'],
    isSector: true,
  },
  MACRO_FED: {
    symbol: 'MACRO_FED',
    name: 'MACROECONOMICS & CENTRAL BANKS',
    aliases: ['FEDERAL RESERVE', 'CENTRAL BANKS', 'INFLATION', 'INTEREST RATES', 'TREASURY YIELDS'],
    industry: 'MACROECONOMICS',
    keywords: ['FED RATE CUT', 'INFLATION CPI', 'TREASURY YIELDS', 'GDP GROWTH', 'LABOR MARKET'],
    isSector: true,
  },
  AEROSPACE_DEFENSE: {
    symbol: 'AEROSPACE_DEFENSE',
    name: 'AEROSPACE & MILITARY DEFENSE',
    aliases: ['AEROSPACE', 'DEFENSE CONTRACTORS', 'MILITARY HARDWARE', 'PENTAGON BUDGET'],
    industry: 'DEFENSE',
    keywords: ['DEFENSE BUDGET', 'MISSILE SYSTEMS', 'MILITARY PROCUREMENT', 'FIGHTER JETS'],
    isSector: true,
  },
  ENERGY_OIL: {
    symbol: 'ENERGY_OIL',
    name: 'ENERGY, OIL & NATURAL GAS',
    aliases: ['CRUDE OIL', 'NATURAL GAS', 'OPEC', 'ENERGY STOCKS', 'PETROLEUM'],
    industry: 'ENERGY',
    keywords: ['BRENT CRUDE', 'OPEC PRODUCTION', 'REFINING MARGINS', 'DRILLING', 'NATURAL GAS'],
    isSector: true,
  },
  CONSUMER_RETAIL: {
    symbol: 'CONSUMER_RETAIL',
    name: 'CONSUMER DISCRETIONARY & RETAIL',
    aliases: ['RETAIL SALES', 'CONSUMER SPENDING', 'E-COMMERCE', 'LUXURY GOODS'],
    industry: 'CONSUMER',
    keywords: ['RETAIL SALES', 'CONSUMER CONFIDENCE', 'SAME STORE SALES', 'DISCRETIONARY SPEND'],
    isSector: true,
  },
};

// ============================================================================
//  STOCKS & CRYPTO (WITH TICKERS)
// ============================================================================
export const TICKER_DIRECTORY: Record<string, TickerMetadata> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA',
    aliases: ['NVIDIA', 'JENSEN HUANG', 'GEFORCE', 'BLACKWELL', 'HOPPER GPU', 'CUDA'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI CHIPS', 'DATACENTER GPU', 'GPU DEMAND', 'EARNINGS', 'QUARTERLY REVENUE'],
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'APPLE',
    aliases: ['APPLE INC', 'TIM COOK', 'IPHONE', 'IOS', 'APPLE INTELLIGENCE', 'VISION PRO'],
    industry: 'CONSUMER TECH',
    keywords: ['IPHONE SALES', 'SERVICES REVENUE', 'APP STORE', 'EARNINGS', 'HARDWARE'],
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'MICROSOFT',
    aliases: ['MICROSOFT', 'SATYA NADELLA', 'AZURE CLOUD', 'COPILOT', 'WINDOWS', 'OFFICE 365'],
    industry: 'CLOUD & SOFTWARE',
    keywords: ['AZURE GROWTH', 'CLOUD COMPUTING', 'OPENAI INVESTMENT', 'ENTERPRISE REVENUE'],
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'ALPHABET / GOOGLE',
    aliases: ['GOOGLE', 'ALPHABET', 'SUNDAR PICHAI', 'GEMINI AI', 'YOUTUBE', 'GOOGLE CLOUD'],
    industry: 'SEARCH & CLOUD',
    keywords: ['SEARCH AD REVENUE', 'YOUTUBE ADS', 'GOOGLE CLOUD PROFIT', 'ANTITRUST'],
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'AMAZON',
    aliases: ['AMAZON.COM', 'ANDY JASSY', 'AWS', 'AMAZON WEB SERVICES', 'PRIME'],
    industry: 'E-COMMERCE & CLOUD',
    keywords: ['AWS CLOUD REVENUE', 'E-COMMERCE RETAIL', 'LOGISTICS', 'CLOUD MARGINS'],
  },
  META: {
    symbol: 'META',
    name: 'META PLATFORMS',
    aliases: ['META', 'MARK ZUCKERBERG', 'FACEBOOK', 'INSTAGRAM', 'LLAMA AI', 'REALITY LABS'],
    industry: 'SOCIAL & AI',
    keywords: ['AD REVENUE', 'DAILY ACTIVE USERS', 'OPEN SOURCE AI', 'METAVERSE SPENDING'],
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'TESLA',
    aliases: ['TESLA INC', 'ELON MUSK', 'CYBERTRUCK', 'MODEL Y', 'MODEL 3', 'FSD', 'OPTIMUS'],
    industry: 'EV & ROBOTICS',
    keywords: ['EV DELIVERIES', 'AUTOMOTIVE MARGINS', 'ENERGY STORAGE', 'GIGAFACTORY'],
  },
  AMD: {
    symbol: 'AMD',
    name: 'ADVANCED MICRO DEVICES',
    aliases: ['AMD', 'LISA SU', 'RYZEN', 'RADEON', 'INSTINCT MI300', 'EPYC'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI ACCELERATOR', 'DATACENTER CHIPS', 'CPU MARKET SHARE', 'DATACENTER REVENUE'],
  },
  AVGO: {
    symbol: 'AVGO',
    name: 'BROADCOM',
    aliases: ['BROADCOM INC', 'HOCK TAN', 'VMWARE', 'NETWORKING CHIPS'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI NETWORKING', 'CUSTOM SILICON', 'VMWARE INTEGRATION', 'INFRASTRUCTURE SOFTWARE'],
  },
  TSM: {
    symbol: 'TSM',
    name: 'TAIWAN SEMICONDUCTOR (TSMC)',
    aliases: ['TSMC', 'TAIWAN SEMI', 'C.C. WEI', 'FOUNDRY', 'CHIP FABRICATION'],
    industry: 'SEMICONDUCTORS',
    keywords: ['ADVANCED NODE', '3NM', '5NM', 'WAFER REVENUE', 'FAB CAPACITY'],
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'PALANTIR',
    aliases: ['PALANTIR TECHNOLOGIES', 'ALEX KARP', 'AIP', 'FOUNDRY', 'GOTHAM'],
    industry: 'SOFTWARE & DEFENSE',
    keywords: ['DEFENSE CONTRACTS', 'COMMERCIAL CUSTOMER COUNT', 'AIP BOOTCAMP', 'GOVERNMENT SOFTWARE'],
  },
  COIN: {
    symbol: 'COIN',
    name: 'COINBASE',
    aliases: ['COINBASE GLOBAL', 'BRIAN ARMSTRONG', 'BASE L2', 'CRYPTO EXCHANGE'],
    industry: 'FINTECH & CRYPTO',
    keywords: ['TRADING VOLUME', 'CRYPTO CUSTODY', 'SPOT BITCOIN ETF', 'TRANSACTION FEES'],
  },
  CRWD: {
    symbol: 'CRWD',
    name: 'CROWDSTRIKE',
    aliases: ['CROWDSTRIKE', 'GEORGE KURTZ', 'FALCON PLATFORM', 'ENDPOINT SECURITY'],
    industry: 'CYBERSECURITY',
    keywords: ['ARR', 'ENDPOINT PROTECTION', 'CLOUD SECURITY', 'THREAT INTELLIGENCE'],
  },
  NFLX: {
    symbol: 'NFLX',
    name: 'NETFLIX',
    aliases: ['NETFLIX INC', 'TED SARANDOS', 'STREAMING WARS'],
    industry: 'STREAMING',
    keywords: ['SUBSCRIBER GROWTH', 'AD TIER', 'CONTENT SPEND', 'PASSWORD SHARING CRACKDOWN'],
  },
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'BITCOIN',
    aliases: ['BITCOIN', 'BTC', 'SPOT BITCOIN ETF', 'DIGITAL GOLD'],
    industry: 'DIGITAL ASSETS',
    keywords: ['CRYPTOCURRENCY RALLY', 'HALVING', 'INSTITUTIONAL INFLOWS', 'MINING'],
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'ETHEREUM',
    aliases: ['ETHEREUM', 'ETH', 'ETHER', 'ETHEREUM ETF'],
    industry: 'DIGITAL ASSETS',
    keywords: ['SMART CONTRACTS', 'DEFI STAKING', 'GAS FEES', 'LAYER 2'],
  },
  'SOL-USD': {
    symbol: 'SOL-USD',
    name: 'SOLANA',
    aliases: ['SOLANA', 'SOL', 'SOLANA BLOCKCHAIN'],
    industry: 'DIGITAL ASSETS',
    keywords: ['SOLANA DEFI', 'TRANSACTION SPEED', 'VALIDATOR', 'MEME COINS'],
  },
};

export const FULL_DIRECTORY: Record<string, TickerMetadata> = {
  ...TICKER_DIRECTORY,
  ...SECTOR_DIRECTORY,
};

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
      name: (meta.name || existing.name || clean).toUpperCase(),
      aliases: (meta.aliases || existing.aliases || []).map((a) => a.toUpperCase()),
      industry: (meta.industry || existing.industry || (meta.isSector ? 'SECTOR' : 'EQUITIES')).toUpperCase(),
      keywords: meta.keywords || existing.keywords || ['STOCK', 'MARKET', 'BUSINESS'],
      isSector: meta.isSector ?? (existing.isSector || isSectorEntity(clean)),
    };

    localStorage.setItem('pulse_custom_metadata', JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving custom metadata:', e);
  }
}

/**
 * Check if a symbol or name is a Sector
 */
export function isSectorEntity(id: string): boolean {
  const clean = id.trim().toUpperCase();
  if (SECTOR_DIRECTORY[clean]) return true;

  // Check stored custom metadata
  const customMap = getCustomMetadataMap();
  if (customMap[clean]?.isSector) return true;

  // Any non-ticker sector name containing keywords
  const sectorKeywords = ['SECTOR', 'INDUSTRY', 'CHIPS', 'CLOUD', 'ENERGY', 'BANKING', 'PHARMA', 'DEFENSE', 'MACRO'];
  return sectorKeywords.some((k) => clean.includes(k));
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

  // 3. If it looks like a sector name without ticker
  if (isSectorEntity(clean)) {
    return {
      symbol: clean,
      name: clean,
      aliases: [clean],
      industry: 'SECTOR INTELLIGENCE',
      keywords: ['INDUSTRY', 'MARKET', 'OUTLOOK', 'SECTOR'],
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
      .map((a) => (a.includes(' ') ? `"${a}"` : a))
      .join(' OR ');

    const contextTerms = meta.isSector
      ? ['SECTOR', 'INDUSTRY', 'OUTLOOK', ...(meta.keywords || []).slice(0, 3)]
      : ['STOCK', 'SHARES', 'EARNINGS', 'REVENUE', ...(meta.keywords || []).slice(0, 2)];

    const contextGroup = contextTerms
      .filter(Boolean)
      .map((k) => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ');

    return `(${aliasGroup}) AND (${contextGroup})`;
  }

  // Generic fallback
  return `("${clean}" OR "${clean} stock") AND (shares OR earnings OR revenue OR market)`;
}

/**
 * Builds combined Boolean query for an entire portfolio watchlist (stocks + sectors)
 */
export function buildPortfolioCombinedQuery(symbols: string[]): string {
  if (!symbols || symbols.length === 0) return 'stock market earnings revenue';

  const parts = symbols.slice(0, 10).map((sym) => {
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
      name: meta.name.toUpperCase(),
      industry: meta.industry.toUpperCase(),
      aliases: meta.aliases.map((a) => a.toUpperCase()),
      isSector: !!meta.isSector,
    };
  }
  return {
    name: symbol.toUpperCase(),
    industry: isSectorEntity(symbol) ? 'SECTOR' : 'UNKNOWN',
    aliases: [],
    isSector: isSectorEntity(symbol),
  };
}
