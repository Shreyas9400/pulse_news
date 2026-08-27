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
  cik?: string;
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
  US_FIXED_INCOME: {
    symbol: 'US_FIXED_INCOME',
    name: 'US FIXED INCOME & CREDIT MARKETS',
    aliases: ['TREASURY YIELDS', 'CORPORATE BONDS', 'CREDIT SPREADS', 'HIGH YIELD', 'INVESTMENT GRADE', 'DEBT ISSUANCE'],
    industry: 'FIXED INCOME',
    keywords: ['CREDIT SPREADS', 'TREASURY YIELD CURVE', 'BOND MATURITY', 'DEFAULT RATES', 'DEBT ISSUANCE', 'IG HY SPREADS'],
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
  CCLFX: {
    symbol: 'CCLFX',
    name: 'CLIFFWATER CORPORATE LENDING FUND',
    aliases: ['CLIFFWATER', 'CCLFX', 'CLIFFWATER INTERVAL FUND', 'CLIFFWATER DIRECT LENDING', 'CLIFFWATER CORPORATE LENDING'],
    industry: 'PRIVATE CREDIT & INTERVAL FUND',
    keywords: ['TENDER OFFER', 'REDEMPTION', 'REPURCHASE OFFER', 'INTERVAL FUND', 'DIRECT LENDING', 'MIDDLE MARKET', 'NET ASSET VALUE', 'NAV', 'DISTRIBUTION RATE', 'NON-ACCRUAL'],
    cik: '0001735964',
  },
  BCSF: {
    symbol: 'BCSF',
    name: 'BAIN CAPITAL SPECIALTY FINANCE',
    aliases: ['BAIN CAPITAL SPECIALTY FINANCE', 'BCSF', 'BAIN CAPITAL CREDIT', 'BAIN BDC'],
    industry: 'PRIVATE CREDIT & BDC',
    keywords: ['TENDER OFFER', 'REDEMPTION', 'REPURCHASE', 'NON-ACCRUAL', 'NET INVESTMENT INCOME', 'NII', 'DIRECT LENDING', 'MIDDLE MARKET', 'DIVIDEND COVERAGE', 'LEVERAGE'],
    cik: '0001655505',
  },
  ARCC: {
    symbol: 'ARCC',
    name: 'ARES CAPITAL CORPORATION',
    aliases: ['ARES CAPITAL', 'ARES BDC', 'ARCC'],
    industry: 'PRIVATE CREDIT & BDC',
    keywords: ['DIRECT LENDING', 'NON-ACCRUAL', 'NET INVESTMENT INCOME', 'DIVIDEND', 'PORTFOLIO YIELD'],
    cik: '0001287750',
  },
  OBDC: {
    symbol: 'OBDC',
    name: 'BLUE OWL CAPITAL CORPORATION',
    aliases: ['BLUE OWL', 'OBDC', 'OWL ROCK'],
    industry: 'PRIVATE CREDIT & BDC',
    keywords: ['DIRECT LENDING', 'NON-ACCRUAL', 'REDEMPTION', 'NET INVESTMENT INCOME'],
    cik: '0001655887',
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA',
    aliases: ['NVIDIA', 'JENSEN HUANG', 'GEFORCE', 'BLACKWELL', 'HOPPER GPU', 'CUDA'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI CHIPS', 'DATACENTER GPU', 'GPU DEMAND', 'EARNINGS', 'QUARTERLY REVENUE'],
    cik: '0001045810',
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'APPLE',
    aliases: ['APPLE INC', 'TIM COOK', 'IPHONE', 'IOS', 'APPLE INTELLIGENCE', 'VISION PRO'],
    industry: 'CONSUMER TECH',
    keywords: ['IPHONE SALES', 'SERVICES REVENUE', 'APP STORE', 'EARNINGS', 'HARDWARE'],
    cik: '0000320193',
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'MICROSOFT',
    aliases: ['MICROSOFT', 'SATYA NADELLA', 'AZURE CLOUD', 'COPILOT', 'WINDOWS', 'OFFICE 365'],
    industry: 'CLOUD & SOFTWARE',
    keywords: ['AZURE GROWTH', 'CLOUD COMPUTING', 'OPENAI INVESTMENT', 'ENTERPRISE REVENUE'],
    cik: '0000789019',
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'ALPHABET / GOOGLE',
    aliases: ['GOOGLE', 'ALPHABET', 'SUNDAR PICHAI', 'GEMINI AI', 'YOUTUBE', 'GOOGLE CLOUD'],
    industry: 'SEARCH & CLOUD',
    keywords: ['SEARCH AD REVENUE', 'YOUTUBE ADS', 'GOOGLE CLOUD PROFIT', 'ANTITRUST'],
    cik: '0001652044',
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'AMAZON',
    aliases: ['AMAZON.COM', 'ANDY JASSY', 'AWS', 'AMAZON WEB SERVICES', 'PRIME'],
    industry: 'E-COMMERCE & CLOUD',
    keywords: ['AWS CLOUD REVENUE', 'E-COMMERCE RETAIL', 'LOGISTICS', 'CLOUD MARGINS'],
    cik: '0001018724',
  },
  META: {
    symbol: 'META',
    name: 'META PLATFORMS',
    aliases: ['META', 'MARK ZUCKERBERG', 'FACEBOOK', 'INSTAGRAM', 'LLAMA AI', 'REALITY LABS'],
    industry: 'SOCIAL & AI',
    keywords: ['AD REVENUE', 'DAILY ACTIVE USERS', 'OPEN SOURCE AI', 'METAVERSE SPENDING'],
    cik: '0001326801',
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'TESLA',
    aliases: ['TESLA INC', 'ELON MUSK', 'CYBERTRUCK', 'MODEL Y', 'MODEL 3', 'FSD', 'OPTIMUS'],
    industry: 'EV & ROBOTICS',
    keywords: ['EV DELIVERIES', 'AUTOMOTIVE MARGINS', 'ENERGY STORAGE', 'GIGAFACTORY'],
    cik: '0001318605',
  },
  JPM: {
    symbol: 'JPM',
    name: 'JPMORGAN CHASE',
    aliases: ['JPMORGAN', 'JAMIE DIMON', 'CHASE BANK', 'JP MORGAN'],
    industry: 'BANKING & FIXED INCOME',
    keywords: ['NET INTEREST INCOME', 'INVESTMENT BANKING', 'CREDIT QUALITY', 'LOAN LOSS PROVISIONS'],
    cik: '0000019617',
  },
  BAC: {
    symbol: 'BAC',
    name: 'BANK OF AMERICA',
    aliases: ['BANK OF AMERICA', 'BOA', 'MERRILL LYNCH'],
    industry: 'BANKING & FIXED INCOME',
    keywords: ['NET INTEREST YIELD', 'DEPOSIT COSTS', 'CREDIT PROVISIONS', 'BOND TRADING'],
    cik: '0000070858',
  },
  AMD: {
    symbol: 'AMD',
    name: 'ADVANCED MICRO DEVICES',
    aliases: ['AMD', 'LISA SU', 'RYZEN', 'RADEON', 'INSTINCT MI300', 'EPYC'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI ACCELERATOR', 'DATACENTER CHIPS', 'CPU MARKET SHARE', 'DATACENTER REVENUE'],
    cik: '0000002488',
  },
  AVGO: {
    symbol: 'AVGO',
    name: 'BROADCOM',
    aliases: ['BROADCOM INC', 'HOCK TAN', 'VMWARE', 'NETWORKING CHIPS'],
    industry: 'SEMICONDUCTORS',
    keywords: ['AI NETWORKING', 'CUSTOM SILICON', 'VMWARE INTEGRATION', 'INFRASTRUCTURE SOFTWARE'],
    cik: '0001730168',
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
    cik: '0001321655',
  },
  COIN: {
    symbol: 'COIN',
    name: 'COINBASE',
    aliases: ['COINBASE GLOBAL', 'BRIAN ARMSTRONG', 'BASE L2', 'CRYPTO EXCHANGE'],
    industry: 'FINTECH & CRYPTO',
    keywords: ['TRADING VOLUME', 'CRYPTO CUSTODY', 'SPOT BITCOIN ETF', 'TRANSACTION FEES'],
    cik: '0001679788',
  },
  CRWD: {
    symbol: 'CRWD',
    name: 'CROWDSTRIKE',
    aliases: ['CROWDSTRIKE', 'GEORGE KURTZ', 'FALCON PLATFORM', 'ENDPOINT SECURITY'],
    industry: 'CYBERSECURITY',
    keywords: ['ARR', 'ENDPOINT PROTECTION', 'CLOUD SECURITY', 'THREAT INTELLIGENCE'],
    cik: '0001535527',
  },
  NFLX: {
    symbol: 'NFLX',
    name: 'NETFLIX',
    aliases: ['NETFLIX INC', 'TED SARANDOS', 'STREAMING WARS'],
    industry: 'STREAMING',
    keywords: ['SUBSCRIBER GROWTH', 'AD TIER', 'CONTENT SPEND', 'PASSWORD SHARING CRACKDOWN'],
    cik: '0001065280',
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
 * Save user custom metadata to localStorage and maintain custom sector list
 */
export function saveCustomMetadata(symbol: string, meta: Partial<TickerMetadata>) {
  if (typeof window === 'undefined') return;
  try {
    const clean = symbol.trim().toUpperCase();
    const stored = localStorage.getItem('pulse_custom_metadata');
    const map: Record<string, TickerMetadata> = stored ? JSON.parse(stored) : {};

    const isSector = meta.isSector ?? (SECTOR_DIRECTORY[clean] ? true : false);

    const existing = FULL_DIRECTORY[clean] || {};
    map[clean] = {
      symbol: clean,
      name: (meta.name || existing.name || clean).toUpperCase(),
      aliases: (meta.aliases || existing.aliases || []).map((a) => a.toUpperCase()),
      industry: (meta.industry || existing.industry || (isSector ? 'SECTOR INTELLIGENCE' : 'EQUITIES')).toUpperCase(),
      keywords: meta.keywords || existing.keywords || ['STOCK', 'MARKET', 'BUSINESS'],
      isSector,
      ...(meta.cik ? { cik: meta.cik } : {}),
    };

    localStorage.setItem('pulse_custom_metadata', JSON.stringify(map));

    // Update dedicated custom sectors list if it is a sector
    if (isSector) {
      const storedSectors = localStorage.getItem('pulse_custom_sectors_list');
      const sectorsList: string[] = storedSectors ? JSON.parse(storedSectors) : [];
      if (!sectorsList.includes(clean)) {
        sectorsList.push(clean);
        localStorage.setItem('pulse_custom_sectors_list', JSON.stringify(sectorsList));
      }
    }
  } catch (e) {
    console.warn('Error saving custom metadata:', e);
  }
}

/**
 * Check if a symbol or name is a Sector
 */
export function isSectorEntity(id: string): boolean {
  if (!id) return false;
  const clean = id.trim().toUpperCase();

  // 1. Built-in sector directory check
  if (SECTOR_DIRECTORY[clean]) return true;

  // 2. Client-side explicit sector list check
  if (typeof window !== 'undefined') {
    try {
      const storedSectors = localStorage.getItem('pulse_custom_sectors_list');
      if (storedSectors) {
        const sectorsList: string[] = JSON.parse(storedSectors);
        if (sectorsList.includes(clean)) return true;
      }

      const customMap = getCustomMetadataMap();
      if (customMap[clean]?.isSector) return true;
    } catch {}
  }

  // 3. Known keywords heuristics if not in ticker directory
  if (!TICKER_DIRECTORY[clean]) {
    // Underscore-separated or multi-word labels (e.g. HIGH_YIELD_BONDS) are never
    // real ticker symbols — treat any such unresolved portfolio entry as a sector.
    if (clean.includes('_') || clean.length > 6) return true;

    const sectorKeywords = ['SECTOR', 'INDUSTRY', 'CHIPS', 'CLOUD', 'ENERGY', 'BANKING', 'PHARMA', 'DEFENSE', 'MACRO', 'INCOME', 'CREDIT'];
    return sectorKeywords.some((k) => clean.includes(k));
  }

  return false;
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
  if (!symbol) return null;
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

  // 3. If it is a sector name
  if (isSectorEntity(clean)) {
    return {
      symbol: clean,
      name: clean.replace(/_/g, ' '),
      aliases: [clean.replace(/_/g, ' ')],
      industry: 'SECTOR INTELLIGENCE',
      keywords: ['INDUSTRY', 'MARKET', 'OUTLOOK', 'SECTOR', 'CREDIT'],
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
      ? ['SECTOR', 'INDUSTRY', 'OUTLOOK', 'CREDIT', ...(meta.keywords || []).slice(0, 3)]
      : ['STOCK', 'SHARES', 'EARNINGS', 'REVENUE', 'DEBT', ...(meta.keywords || []).slice(0, 2)];

    const contextGroup = contextTerms
      .filter(Boolean)
      .map((k) => (k.includes(' ') ? `"${k}"` : k))
      .join(' OR ');

    return `(${aliasGroup}) AND (${contextGroup})`;
  }

  return `("${clean}" OR "${clean} stock") AND (shares OR earnings OR revenue OR market OR debt)`;
}

/**
 * Builds combined Boolean query for an entire portfolio watchlist (stocks + sectors)
 */
export function buildPortfolioCombinedQuery(symbols: string[]): string {
  if (!symbols || symbols.length === 0) return 'stock market earnings debt revenue credit';

  const parts = symbols.slice(0, 10).map((sym) => {
    const clean = sym.trim().toUpperCase();
    const meta = getTickerMeta(clean) || FULL_DIRECTORY[clean];
    if (meta) {
      return `"${meta.name}" OR ${clean}`;
    }
    return `"${clean}"`;
  });

  return `(${parts.join(' OR ')}) AND (stock OR shares OR earnings OR quarterly OR debt OR credit OR sector)`;
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
  cik?: string;
} {
  const meta = getTickerMeta(symbol) || FULL_DIRECTORY[symbol.toUpperCase()];
  if (meta) {
    return {
      name: meta.name.toUpperCase(),
      industry: meta.industry.toUpperCase(),
      aliases: meta.aliases.map((a) => a.toUpperCase()),
      isSector: !!meta.isSector,
      cik: meta.cik,
    };
  }
  return {
    name: symbol.toUpperCase(),
    industry: isSectorEntity(symbol) ? 'SECTOR' : 'UNKNOWN',
    aliases: [],
    isSector: isSectorEntity(symbol),
  };
}
