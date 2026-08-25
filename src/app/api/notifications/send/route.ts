import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: contentBody, url, symbol } = body;

    const result = await sendPushNotification({
      title: title || 'PulseNews Market Alert',
      body: contentBody || 'High-impact market or portfolio news published.',
      url,
      symbol,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
