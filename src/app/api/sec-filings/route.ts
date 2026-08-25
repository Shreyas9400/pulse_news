import { NextRequest, NextResponse } from 'next/server';
import { fetchSecFilings, resolveCik } from '@/lib/sec-edgar';

export const revalidate = 3600; // 1 hour edge cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const cikParam = searchParams.get('cik');
  const form = searchParams.get('form') || 'ALL'; // 10-K, 10-Q, 8-K, ALL

  if (!symbol && !cikParam) {
    return NextResponse.json({ error: 'Ticker symbol or CIK number is required' }, { status: 400 });
  }

  const resolvedCik = cikParam || (symbol ? resolveCik(symbol) : null);

  if (!resolvedCik) {
    return NextResponse.json({
      success: false,
      error: `No SEC CIK found for "${symbol}". Please specify the 10-digit CIK in the portfolio editor.`,
      filings: [],
    }, { status: 404 });
  }

  try {
    const data = await fetchSecFilings(resolvedCik, form);
    return NextResponse.json({
      success: true,
      symbol: symbol?.toUpperCase() || null,
      cik: resolvedCik,
      companyName: data.companyName,
      sicDescription: data.sicDescription,
      filings: data.filings,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch SEC filings from EDGAR',
      filings: [],
    }, { status: 500 });
  }
}
