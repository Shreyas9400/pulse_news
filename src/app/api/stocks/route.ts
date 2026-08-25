import { NextRequest, NextResponse } from 'next/server';
import { getLiveStockQuotes } from '@/lib/stock-service';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 min edge cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols') || '^GSPC,^IXIC,^DJI,NVDA,AAPL,MSFT,TSLA,BTC-USD';
    const symbols = symbolsParam.split(',').filter(Boolean);

    const quotes = await getLiveStockQuotes(symbols);

    return NextResponse.json(
      {
        success: true,
        count: quotes.length,
        quotes,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch live quotes' },
      { status: 500 }
    );
  }
}
