import { NewsArticle, DailyBriefing } from './types';

/**
 * Generate an AI Senior Credit Risk Analyst & Fixed Income Daily Briefing
 * Persona: Experienced Senior Credit Risk Analyst agnostic to sector, evaluating
 * liquidity, debt serviceability, leverage, yield spreads, and material SEC disclosures.
 */
export async function generateDailyBriefing(articles: NewsArticle[]): Promise<DailyBriefing> {
  const topArticles = articles.slice(0, 8);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'CREDIT RISK BRIEFING (MORNING)' : hour < 18 ? 'CREDIT RISK BRIEFING (MIDDAY)' : 'CREDIT RISK BRIEFING (CLOSE)';

  // If Gemini API Key is configured in environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && topArticles.length > 0) {
    try {
      const prompt = `You are a Veteran Senior Credit Risk Analyst & US Fixed Income Strategist. Sector-agnostic.
Your analytical lens evaluates:
1. Debt serviceability, interest coverage ratios, leverage, and cash flow stability.
2. Refinancing risk, maturity walls, and credit rating migration triggers.
3. Macro rate environment (Treasury yield curve, Fed policy rate, IG/HY credit spreads).
4. Materiality of corporate news and SEC regulatory disclosures on debt obligations and counterparty risk.

Review these current intelligence items:
${topArticles.map((a, i) => `${i + 1}. [${a.source} - ${a.category}] ${a.title}: ${a.description}`).join('\n')}

Generate a rigorous, institutional-grade Credit Risk Executive Briefing formatted as strict JSON:
{
  "overview": "A 2-3 sentence credit risk synopsis analyzing macro fixed income conditions, corporate liquidity buffers, and default/spread materiality across market sectors.",
  "marketMood": "Credit Environment: e.g. Spread Tightening (Low Default Risk) / Defensive (Spread Widening Risk) / Volatile (Refinancing Pressures) with 1 sentence rationale.",
  "keyBulletPoints": [
    "Credit Risk Takeaway 1: Focus on cash flow & debt impact",
    "Credit Risk Takeaway 2: Focus on liquidity or regulatory disclosure",
    "Credit Risk Takeaway 3: Focus on macro rate / yield spread implications",
    "Credit Risk Takeaway 4: Focus on counterparty or covenant health"
  ]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            date: dateStr,
            greeting,
            overview: parsed.overview || 'US Fixed Income & Corporate Credit risk monitoring remains active across corporate balance sheets and Treasury yield curves.',
            marketMood: parsed.marketMood || 'Credit Spreads: Stable with disciplined corporate liquidity monitoring.',
            topStories: topArticles.slice(0, 5),
            keyBulletPoints: parsed.keyBulletPoints || topArticles.slice(0, 4).map((a) => `Credit Assessment: ${a.title}`),
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('[GeminiCreditBriefing] Fallback to credit risk local synthesizer:', e);
    }
  }

  // Institutional Local Credit Risk Synthesizer (Zero API keys needed)
  const positiveCount = topArticles.filter((a) => a.sentiment === 'positive').length;
  const negativeCount = topArticles.filter((a) => a.sentiment === 'negative').length;

  let mood = 'Credit Spreads Neutral — Balanced Refinancing & Coverage Metrics';
  if (positiveCount > negativeCount + 1) {
    mood = 'Tightening Credit Spreads — Strong Balance Sheet Liquidity & Robust Cash Flow';
  } else if (negativeCount > positiveCount) {
    mood = 'Widening Spread Risk — Elevated Leverage & Refinancing Sensitivity';
  }

  return {
    date: dateStr,
    greeting,
    overview: `Senior Credit Risk Monitor: Active surveillance across US Fixed Income, debt issuance, and liquidity buffers. Recent reporting from ${[...new Set(topArticles.map((a) => a.source))].slice(0, 3).join(', ')} highlights corporate cash flow durability and macro yield sensitivity.`,
    marketMood: mood,
    topStories: topArticles.slice(0, 5),
    keyBulletPoints: [
      `Liquidity & Cash Flow: ${topArticles[0]?.title || 'Corporate cash balances remain adequate against near-term debt maturities.'}`,
      `Macro Rate Sensitivity: ${topArticles[1]?.title || 'Treasury yield curve dynamics and Fed terminal rate expectations influence refinancing costs.'}`,
      `Material Disclosures & Filings: ${topArticles[2]?.title || 'Surveillance on interim 10-Q/10-K covenant headroom and credit facility amendments.'}`,
      `Credit Rating & Default Risk: ${topArticles[3]?.title || 'Evaluating investment grade and high yield spread differentials across monitored issuers.'}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate 3 bullet credit risk analyst takeaway for an individual article/event
 */
export function summarizeArticleLocally(title: string, description: string): string[] {
  return [
    `CREDIT IMPACT: ${title}`,
    `LIQUIDITY & SPREAD EFFECT: ${description || 'Monitored for corporate debt serviceability, free cash flow generation, and balance sheet leverage.'}`,
    'MATERIALITY: Sector-agnostic credit risk surveillance on covenant compliance and rating migration.',
  ];
}
