import { NextRequest, NextResponse } from 'next/server';
import { ResearchJobs } from '@/lib/research-jobs';

export const dynamic = 'force-dynamic';

// A full research cycle performs several network fetches plus a reasoning pass. Without an
// explicit budget the platform's default gateway timeout (as low as 10s) aborts the request
// and the browser reports a 504. 60s is the Vercel Hobby ceiling; raise on paid plans.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId = 'default_portfolio', entities = [], customQuestions = [], preferredModel } = body;

    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entities array is required to run portfolio research' },
        { status: 400 }
      );
    }

    const result = await ResearchJobs.triggerPortfolioResearch(
      portfolioId,
      entities,
      customQuestions,
      preferredModel
    );

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
