import { NextRequest, NextResponse } from 'next/server';
import { fetchSecFilings, resolveCik } from '@/lib/sec-edgar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const cikParam = searchParams.get('cik');
  const form = searchParams.get('form') || 'ALL'; // 10-K, 10-Q, 8-K, ALL

  if (!symbol && !cikParam) {
    return NextResponse.json({ success: false, error: 'Ticker symbol or CIK number is required', filings: [] }, { status: 400 });
  }

  const resolvedCik = cikParam || (symbol ? resolveCik(symbol) : null);

  if (!resolvedCik) {
    return NextResponse.json({
      success: true,
      notice: `No SEC CIK mapped for "${symbol}". You can add its SEC CIK in the Portfolio settings.`,
      filings: [],
    });
  }

  try {
    const data = await fetchSecFilings(resolvedCik, form);
    return NextResponse.json({
      success: true,
      symbol: symbol?.toUpperCase() || null,
      cik: resolvedCik,
      companyName: data.companyName,
      sicDescription: data.sicDescription,
      filings: data.filings || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      notice: error.message || 'SEC EDGAR archive currently unavailable.',
      filings: [],
    });
  }
}
