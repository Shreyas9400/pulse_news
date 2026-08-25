import { NextRequest, NextResponse } from 'next/server';
import { searchTavilyForEntity } from '@/lib/tavily';
import { getTickerMeta, getSymbolDisplayInfo } from '@/lib/stock-aliases';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const force = searchParams.get('force') === 'true';

  if (!symbol) {
    return NextResponse.json({ error: 'Entity symbol or sector name is required' }, { status: 400 });
  }

  const cleanSym = symbol.trim().toUpperCase();
  const info = getSymbolDisplayInfo(cleanSym);
  const queryToSearch = info.name && info.name !== cleanSym ? `${cleanSym} ${info.name}` : cleanSym;

  try {
    const { results, cached } = await searchTavilyForEntity(queryToSearch, {
      forceFresh: force,
      maxResults: 6,
    });

    return NextResponse.json({
      success: true,
      symbol: cleanSym,
      query: queryToSearch,
      cached,
      count: results.length,
      articles: results.map((r, i) => ({
        id: `tavily-${cleanSym}-${Date.now()}-${i}`,
        title: r.title,
        link: r.url,
        description: r.content,
        source: r.source,
        sourceIcon: '⚡',
        publishedAt: r.publishedDate || new Date().toISOString(),
        timestamp: r.publishedDate ? new Date(r.publishedDate).getTime() : Date.now() - i * 60000,
        category: 'portfolio',
        sentiment: r.title.toLowerCase().includes('downgrade') || r.title.toLowerCase().includes('loss') || r.title.toLowerCase().includes('default') ? 'negative' : r.title.toLowerCase().includes('upgrade') || r.title.toLowerCase().includes('growth') || r.title.toLowerCase().includes('profit') ? 'positive' : 'neutral',
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Tavily intelligence',
      articles: [],
    }, { status: 500 });
  }
}
