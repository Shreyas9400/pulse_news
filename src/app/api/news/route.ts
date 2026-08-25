import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedNews, getLiveMarketTickers } from '@/lib/news-aggregator';

// Dynamic on-demand execution with edge caching headers
export const dynamic = 'force-dynamic';
export const revalidate = 900;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const query = searchParams.get('q') || undefined;
    const symbolsParam = searchParams.get('symbols');
    const stockSymbols = symbolsParam ? symbolsParam.split(',') : undefined;
    const limit = parseInt(searchParams.get('limit') || '40', 10);

    const articles = await getAggregatedNews({
      category,
      query,
      stockSymbols,
      limit,
    });

    const marketTickers = getLiveMarketTickers();

    return NextResponse.json(
      {
        success: true,
        count: articles.length,
        category,
        query: query || null,
        articles,
        marketTickers,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error: any) {
    console.error('API /api/news error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch news feed',
      },
      { status: 500 }
    );
  }
}
