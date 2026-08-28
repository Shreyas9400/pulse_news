import { NextRequest, NextResponse } from 'next/server';
import { analyzeEntityBatch } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// Long-running: allow the platform max so slow upstream fetches do not surface as a 504.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, name, industry, isSector, articles, filings, forceRefresh } = body;

    if (!entity) {
      return NextResponse.json({ success: false, error: 'Entity symbol is required' }, { status: 400 });
    }

    const analysis = await analyzeEntityBatch({
      entity,
      name: name || entity,
      industry,
      isSector,
      articles: Array.isArray(articles) ? articles : [],
      filings: Array.isArray(filings) ? filings : [],
      forceRefresh: !!forceRefresh,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('API /api/entity-analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze entity' },
      { status: 500 }
    );
  }
}
