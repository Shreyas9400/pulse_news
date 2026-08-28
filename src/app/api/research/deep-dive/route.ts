import { NextRequest, NextResponse } from 'next/server';
import { generatePortfolioDeepDive } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// Long-running: allow the platform max so slow upstream fetches do not surface as a 504.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, entities = [], materialChanges = [], quietEntities = [], crossSynthesisSummary, preferredModel } = body;

    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entities array is required to generate a portfolio deep dive' },
        { status: 400 }
      );
    }

    const report = await generatePortfolioDeepDive({
      domain: domain || 'portfolio',
      entities,
      materialChanges,
      quietEntities,
      crossSynthesisSummary,
      preferredModel,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('API /api/research/deep-dive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Portfolio deep dive generation failed' },
      { status: 500 }
    );
  }
}
