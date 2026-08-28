import { NextRequest, NextResponse } from 'next/server';
import { scrapeMultiEngineNews } from '@/lib/html-scraper';

export const dynamic = 'force-dynamic';

// Long-running: allow the platform max so slow upstream fetches do not surface as a 504.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    const articles = await scrapeMultiEngineNews(query.trim(), maxResults);

    return NextResponse.json({
      success: true,
      query: query.trim(),
      count: articles.length,
      articles,
    });
  } catch (error: any) {
    console.error('Error in /api/scrape-news:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Scraping failed',
      articles: [],
    }, { status: 500 });
  }
}
