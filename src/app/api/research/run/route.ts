import { NextRequest, NextResponse } from 'next/server';
import { ResearchJobs } from '@/lib/research-jobs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId = 'default_portfolio', entities = [] } = body;

    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entities array is required to run portfolio research' },
        { status: 400 }
      );
    }

    const result = await ResearchJobs.triggerPortfolioResearch(portfolioId, entities);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('API /api/research/run error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Research run failed' },
      { status: 500 }
    );
  }
}
