import { NextRequest, NextResponse } from 'next/server';
import { saveFCMToken } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userAgent } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await saveFCMToken(token, { userAgent });

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully for market push notifications.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
