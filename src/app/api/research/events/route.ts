import { NextRequest, NextResponse } from 'next/server';
import { getAllCanonicalEvents } from '@/lib/event-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const events = getAllCanonicalEvents();

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch canonical events' },
      { status: 500 }
    );
  }
}
