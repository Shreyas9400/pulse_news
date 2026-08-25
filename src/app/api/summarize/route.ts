import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedNews } from '@/lib/news-aggregator';
import { generateDailyBriefing, summarizeArticleLocally } from '@/lib/gemini';

export const revalidate = 1800; // 30 min cache for executive briefing

export async function GET(request: NextRequest) {
  try {
    const articles = await getAggregatedNews({ category: 'all', limit: 15 });
    const briefing = await generateDailyBriefing(articles);

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const bullets = summarizeArticleLocally(title, description || '');

    return NextResponse.json({
      success: true,
      bullets,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
