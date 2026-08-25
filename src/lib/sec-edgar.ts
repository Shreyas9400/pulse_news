/**
 * SEC EDGAR Public Submissions & CIK Directory for Credit Risk Analysis
 * Fetches real-time 10-K, 10-Q, 8-K, and debt prospectus filings from SEC EDGAR.
 */

export interface SecFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
  documentUrl: string;
  size: number;
  creditRiskTakeaway?: string;
}

// Built-in SEC CIK Directory for major US corporate issuers & FI portfolio names
export const DEFAULT_CIK_DIRECTORY: Record<string, string> = {
  AAPL: '0000320193',
  MSFT: '0000789019',
  NVDA: '0001045810',
  AMZN: '0001018724',
  GOOGL: '0001652044',
  GOOG: '0001652044',
  META: '0001326801',
  TSLA: '0001318605',
  JPM: '0000019617',
  BAC: '0000070858',
  C: '0000831001',
  WFC: '0000072971',
  GS: '0000886982',
  MS: '0000895421',
  AMD: '0000002488',
  INTC: '0000050863',
  AVGO: '0001730168',
  PLTR: '0001321655',
  CRWD: '0001535527',
  COIN: '0001679788',
  NFLX: '0001065280',
  DIS: '0001744489',
  BA: '0000012927',
  GE: '0000040545',
  T: '0000049070',
  VZ: '0000732712',
  UNH: '0000731766',
  LLY: '0000059478',
  PFE: '0000078003',
  JNJ: '0000200406',
  XOM: '0000034088',
  CVX: '0000093410',
  ORCL: '0001341439',
  IBM: '0000051143',
  CRM: '0001108524',
  QCOM: '0000804328',
};

/**
 * Resolve CIK for any symbol from localStorage custom map or built-in directory
 */
export function resolveCik(symbolOrCik: string): string | null {
  const clean = symbolOrCik.trim().toUpperCase();

  // If already a numeric CIK, zero-pad to 10 digits
  if (/^\d+$/.test(clean)) {
    return clean.padStart(10, '0');
  }

  // Check stored custom metadata
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pulse_custom_metadata');
      if (stored) {
        const map = JSON.parse(stored);
        if (map[clean]?.cik) {
          return map[clean].cik.padStart(10, '0');
        }
      }
    } catch {}
  }

  // Check built-in directory
  if (DEFAULT_CIK_DIRECTORY[clean]) {
    return DEFAULT_CIK_DIRECTORY[clean];
  }

  return null;
}

/**
 * Fetch SEC Filings from SEC EDGAR Submissions API
 */
export async function fetchSecFilings(cik: string, formFilter?: string): Promise<{
  companyName: string;
  cik: string;
  sicDescription: string;
  filings: SecFiling[];
}> {
  const cleanCik = cik.padStart(10, '0');
  const numericCik = parseInt(cleanCik, 10).toString();

  const url = `https://data.sec.gov/submissions/CIK${cleanCik}.json`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PulseNewsCreditRiskTerminal/1.0 (fixed_income_analyst@pulsenews.app)',
      'Accept': 'application/json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`SEC EDGAR returned HTTP ${res.status} for CIK ${cleanCik}`);
  }

  const data = await res.json();
  const recent = data.filings?.recent;

  if (!recent || !recent.form) {
    return {
      companyName: data.name || cleanCik,
      cik: cleanCik,
      sicDescription: data.sicDescription || 'Corporate Issuer',
      filings: [],
    };
  }

  const rawCount = recent.form.length;
  const filings: SecFiling[] = [];

  const targetForms = formFilter && formFilter !== 'ALL'
    ? formFilter.split(',').map((f) => f.trim().toUpperCase())
    : ['10-K', '10-Q', '8-K', '424B2', '424B5', '6-K', '20-F'];

  for (let i = 0; i < rawCount && filings.length < 25; i++) {
    const formType = recent.form[i]?.toUpperCase();

    if (!formFilter || formFilter === 'ALL' || targetForms.includes(formType)) {
      const accessionNo = recent.accessionNumber[i];
      const accessionClean = accessionNo.replace(/-/g, '');
      const primaryDoc = recent.primaryDocument[i];
      const docUrl = `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accessionClean}/${primaryDoc}`;

      // Senior Credit Risk Assessment for this filing
      let creditRiskTakeaway = 'Standard periodic disclosure under SEC reporting obligations.';
      if (formType === '10-K') {
        creditRiskTakeaway = 'CRITICAL: Annual audited balance sheet, total debt schedule, liquidity reserves, and financial covenant disclosures.';
      } else if (formType === '10-Q') {
        creditRiskTakeaway = 'HIGH: Interim liquidity, short-term debt maturity profile, and quarterly operating cash flow health.';
      } else if (formType === '8-K') {
        creditRiskTakeaway = 'MATERIAL EVENT: Unscheduled credit disclosure (e.g. debt issuance, credit facility amendment, M&A, leadership changes).';
      } else if (formType.includes('424B')) {
        creditRiskTakeaway = 'DEBT PROSPECTUS: Bond issuance offering, coupon terms, maturity date, and senior/subordinated notes pricing.';
      }

      filings.push({
        accessionNumber: accessionNo,
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i] || recent.filingDate[i],
        form: formType,
        primaryDocument: primaryDoc,
        primaryDocDescription: recent.primaryDocDescription[i] || formType,
        documentUrl: docUrl,
        size: recent.size[i] || 0,
        creditRiskTakeaway,
      });
    }
  }

  return {
    companyName: data.name || cleanCik,
    cik: cleanCik,
    sicDescription: data.sicDescription || 'Corporate Issuer',
    filings,
  };
}
