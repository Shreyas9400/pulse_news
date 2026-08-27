import { NextRequest, NextResponse } from 'next/server';
import { ResearchJobs } from '@/lib/research-jobs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || searchParams.get('portfolioId') || 'default_portfolio';

    const result = await ResearchJobs.getLatestRunResult(runId);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'No research run found for the requested ID',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trace: result.trace,
      blackboardSummary: result.trace.blackboardSummary,
      whyIncluded: result.trace.whyIncluded,
      whyExcluded: result.trace.whyExcluded,
      adversarialCheckResults: result.trace.adversarialCheckResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch research trace' },
      { status: 500 }
    );
  }
}
