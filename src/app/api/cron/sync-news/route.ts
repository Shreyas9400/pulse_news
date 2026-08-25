import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedNews } from '@/lib/news-aggregator';

// Disable static caching for the cron runner
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Validate CRON_SECRET if configured in environment
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid CRON_SECRET token.' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Pre-warm and fetch across critical channels (markets, tech, world, ai)
    const categories = ['all', 'markets', 'tech', 'ai', 'world'];
    const syncResults = await Promise.allSettled(
      categories.map(cat => getAggregatedNews({ category: cat, limit: 30 }))
    );

    let totalFetched = 0;
    syncResults.forEach(res => {
      if (res.status === 'fulfilled') {
        totalFetched += res.value.length;
      }
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'News feeds successfully synchronized and edge cache warmed.',
      totalArticlesProcessed: totalFetched,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error occurred during scheduled news sync',
      },
      { status: 500 }
    );
  }
}
