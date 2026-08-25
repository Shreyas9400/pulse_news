import { StockQuote } from './types';

const SYMBOL_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'Nasdaq',
  '^DJI': 'Dow Jones',
  'NVDA': 'NVIDIA Corp',
  'AAPL': 'Apple Inc',
  'MSFT': 'Microsoft Corp',
  'TSLA': 'Tesla Inc',
  'AMZN': 'Amazon.com',
  'GOOGL': 'Alphabet Inc',
  'META': 'Meta Platforms',
  'AMD': 'Advanced Micro Devices',
  'PLTR': 'Palantir Tech',
  'COIN': 'Coinbase Global',
  'BTC-USD': 'Bitcoin USD',
  'ETH-USD': 'Ethereum USD',
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
};

/**
 * Fetch real-time live stock quote from Yahoo Finance API
 */
export async function fetchLiveStockQuote(symbol: string): Promise<StockQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=15m&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache on edge for 60 seconds
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result || !result.meta) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    const isPositive = change >= 0;

    // Extract sparkline points from timestamps / closes
    const closeQuotes = result.indicators?.quote?.[0]?.close || [];
    const sparkline = closeQuotes.filter((v: any) => typeof v === 'number' && !isNaN(v)).slice(-10);

    const formattedPrice = price >= 1000
      ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toFixed(2);

    const formattedChange = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;

    return {
      symbol: cleanSymbol,
      shortName: SYMBOL_NAMES[cleanSymbol] || meta.shortName || cleanSymbol,
      price,
      formattedPrice: meta.currency === 'USD' ? `$${formattedPrice}` : `${formattedPrice} ${meta.currency || ''}`,
      change,
      changePercent,
      formattedChange,
      isPositive,
      currency: meta.currency || 'USD',
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      sparkline,
    };
  } catch (error) {
    console.warn(`[StockService] Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch quotes for multiple stock/crypto symbols in parallel
 */
export async function getLiveStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const uniqueSymbols = [...new Set(symbols.map(s => s.trim().toUpperCase()).filter(Boolean))];
  const promises = uniqueSymbols.map(s => fetchLiveStockQuote(s));
  const results = await Promise.allSettled(promises);

  const quotes: StockQuote[] = [];
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled' && r.value) {
      quotes.push(r.value);
    } else {
      // Graceful fallback for symbol
      const sym = uniqueSymbols[idx];
      quotes.push({
        symbol: sym,
        shortName: SYMBOL_NAMES[sym] || sym,
        price: 0,
        formattedPrice: '—',
        change: 0,
        changePercent: 0,
        formattedChange: '0.00%',
        isPositive: true,
        currency: 'USD',
      });
    }
  });

  return quotes;
}
