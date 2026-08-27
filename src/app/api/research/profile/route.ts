import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioIntelligenceProfile } from '@/lib/expertise-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId = 'default_portfolio', entities = [] } = body;

    const profile = await getPortfolioIntelligenceProfile(portfolioId, entities);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate profile' },
      { status: 500 }
    );
  }
}
