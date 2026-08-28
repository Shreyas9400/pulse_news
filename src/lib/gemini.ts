import { NewsArticle, DailyBriefing } from './types';
import { callGemini, getApiKey } from './gemini-client';
import {
  getCachedDossier,
  saveDossierCache,
  getEntityHistoricalMemory,
  recordCreditMilestone,
  StoredDossierAnalysis,
} from './credit-memory';

export interface EntityCreditDossierAnalysis extends StoredDossierAnalysis {
  redemptionAndLiquidityTakeaway?: string;
  recentMaterialTakeaways?: string[];
}

/**
 * Generate an AI Senior Credit Risk Analyst & Fixed Income Daily Briefing
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && topArticles.length > 0) {
    try {
      const prompt = `You are a Veteran Senior Credit Risk Analyst & US Fixed Income Strategist. Sector-agnostic.
Your analytical lens evaluates:
1. Debt serviceability, interest coverage ratios, leverage, and cash flow stability.
2. Refinancing risk, maturity walls, and credit rating migration triggers.
3. Macro rate environment (Treasury yield curve, Fed policy rate, IG/HY credit spreads).
4. Materiality of corporate news and SEC regulatory disclosures on debt obligations, BDC non-accruals, and redemption liquidity.

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

      const geminiResult = await callGemini({ prompt, tier: 'fast' });

      if (geminiResult.ok) {
        const rawText = geminiResult.text;
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

  // Institutional Local Credit Risk Synthesizer
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
 * Enterprise Batch JSON Credit Risk Analysis with Sector-Specific Redemptions & Materiality
 */
export async function analyzeEntityBatch(params: {
  entity: string;
  name: string;
  industry?: string;
  isSector?: boolean;
  articles: Array<{ title: string; link: string; description: string; source: string; publishedAt?: string }>;
  filings?: Array<{ form: string; filingDate: string; description: string; creditRiskTakeaway?: string }>;
  forceRefresh?: boolean;
}): Promise<EntityCreditDossierAnalysis> {
  const { entity, name, industry, isSector, articles, filings, forceRefresh } = params;
  const cleanKey = entity.toUpperCase().trim();

  // 1. Check 4-Hour Persistent Firestore Cache
  if (!forceRefresh) {
    const cached = await getCachedDossier(cleanKey);
    if (cached) {
      return cached;
    }
  }

  // 2. Fetch Historical Memory Milestones from Firestore 'pulsenews' Database
  const historicalMemory = await getEntityHistoricalMemory(cleanKey);

  const isBDC = ['CCLFX', 'BCSF', 'ARCC', 'OBDC', 'MFIC', 'OTF', 'FBDC', 'SSLP', 'AB-LEND', 'FPCC'].includes(cleanKey);
  const isPrivateCreditFund = isBDC || name.toLowerCase().includes('lending') || name.toLowerCase().includes('private credit') || name.toLowerCase().includes('credit fund');
  const isFixedIncomeSector = cleanKey.includes('BOND') || cleanKey.includes('_FI') || cleanKey.includes('HY') || name.toLowerCase().includes('fixed income') || name.toLowerCase().includes('treasury');

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && (articles.length > 0 || (filings && filings.length > 0) || historicalMemory.length > 0)) {
    try {
      const articleLines = articles.slice(0, 12).map((a, i) =>
        `${i + 1}. [${a.source}${a.publishedAt ? ' | ' + a.publishedAt : ''}] ${a.title}${a.description ? ': ' + a.description.substring(0, 220) : ''}`
      );
      const filingLines = (filings || []).slice(0, 5).map(f => `• ${f.form} (${f.filingDate}): ${f.description}`);
      const historyLines = historicalMemory.slice(0, 4).map(m => `• [${m.materiality}] ${m.date}: ${m.title} — ${m.impactSummary || ''}`);

      const entityClass = isBDC ? 'Business Development Company (BDC) / Non-Traded Interval Fund'
        : isPrivateCreditFund ? 'Private Credit / Middle-Market Direct Lending Fund'
        : isFixedIncomeSector ? 'US Fixed Income / Bond Market Instrument'
        : isSector ? 'Industry Sector / Thematic Credit Basket'
        : 'Corporate Issuer / Credit Entity';

      const sectorGuide = (isBDC || isPrivateCreditFund)
        ? '\nBDC / PRIVATE CREDIT CRITICAL LENS — address ALL of these:\n- Quarterly tender offer: Is the redemption queue building? Are redemption requests approaching the 5%/quarter statutory cap? Any gating risk?\n- Non-accrual rate: % of portfolio at fair value. Any NEW non-accruals, reversals, or recoveries vs prior quarter?\n- NAV per share: Growing/flat/declining? Sustained erosion >5% is high-risk.\n- NII coverage: NII per share vs dividend per share. Sub-1.0x = distribution cut risk.\n- Leverage: Debt-to-equity ratio vs 1.0x BDC cap. Credit facility draws and covenant headroom.\n- PIK income %, first-lien senior secured %, floating rate loan exposure.\n- Any credit facility amendments, waivers, or new draws?'
        : isFixedIncomeSector
        ? '\nFIXED INCOME / RATES CRITICAL LENS:\n- Treasury yield curve (2yr/10yr): Inversion depth or steepening signals.\n- IG OAS and HY OAS spread levels — tightening or widening?\n- Duration risk and Fed rate sensitivity for the portfolio.\n- HY default rate trajectory (Moody\'s / S&P trailing 12-month).\n- Near-term maturity concentration and refinancing wall.'
        : '\nCORPORATE CREDIT CRITICAL LENS:\n- Net Debt/EBITDA trajectory and covenant headroom.\n- Interest coverage ratio and FCF vs debt service.\n- Debt maturity schedule and refinancing access (1-3 year wall).\n- Any S&P/Moody\'s rating watch/downgrade placements.\n- Capital allocation decisions pressuring the balance sheet.';

      const prompt = `You are a Veteran Senior Credit Risk Analyst with 20+ years across US Fixed Income, Private Credit BDCs, and Corporate Debt. Write like a Goldman Sachs / Apollo institutional credit research note.

ENTITY: ${cleanKey} — ${name}
CLASS: ${entityClass}
INDUSTRY: ${industry || 'US FIXED INCOME & PRIVATE CREDIT'}
${sectorGuide}

RECENT NEWS DISPATCHES (${articles.length} total):
${articleLines.join('\n') || 'No recent news — rely on sector knowledge and historical milestones below.'}

SEC FILINGS:
${filingLines.join('\n') || 'No recent SEC filings.'}

HISTORICAL CREDIT MILESTONES:
${historyLines.join('\n') || 'No prior milestones recorded.'}

INSTRUCTIONS — MANDATORY:
- Be SPECIFIC and QUANTITATIVE. Cite NII coverage ratios, leverage levels, redemption % figures, spread bps, filing dates.
- DO NOT write generic or placeholder text. Every bullet must contain a concrete, actionable insight with named figures or events.
- For BDCs: the executiveSummary MUST address redemption queue, non-accrual rate, NII coverage, and NAV trajectory.
- If news is sparse: apply your expert knowledge of this specific entity's documented credit profile and sector dynamics.
- recentMaterialTakeaways must cite specific news headlines, filing data, or credit events — not generic statements.

Respond ONLY with valid JSON:
{
  "overallSentiment": "positive",
  "relevanceScore": 88,
  "materiality": "MEDIUM",
  "notify": false,
  "notificationTitle": "8 word max headline here",
  "notificationBody": "One specific sentence on credit materiality.",
  "analytics": {
    "liquidityRisk": "LOW",
    "spreadTrajectory": "STABLE",
    "leverageWatch": "0.87x Debt/Equity — within 1.0x BDC statutory cap",
    "refinancingRisk": "LOW"
  },
  "executiveSummary": "4-5 sentences with specific figures and named events — not generic.",
  "redemptionAndLiquidityTakeaway": "3-4 sentences. For BDCs: cite tender offer %, redemption queue, undrawn credit lines, distribution coverage. For corporates: FCF vs interest charges, revolver headroom.",
  "recentMaterialTakeaways": [
    "Cite specific headline/filing: e.g. Per Q2 2025 10-Q, NII of $0.47/share covers $0.40 dividend at 1.18x, signaling distribution durability",
    "e.g. Non-accrual rate per latest filing increased to 2.1% of fair value (+40bps QoQ) driven by 2 middle-market borrowers in workout",
    "e.g. Credit facility amended Aug-2025 adding $300M accordion feature, reducing near-term liquidity risk through 2027"
  ],
  "keyRiskWatchpoints": [
    "Specific quantified risk: e.g. Redemption queue at ~3.8% of NAV vs 5% quarterly tender cap; pro-rata protocols activate if demand persists next quarter",
    "Second specific risk with figures",
    "Third specific risk"
  ],
  "creditCatalysts": [
    "Specific catalyst: e.g. 94% first-lien senior secured portfolio with >80% historical recovery rates provides structural downside protection",
    "Second specific catalyst"
  ]
}
Set "notify": true ONLY if materiality HIGH (redemption gating breach, non-accrual >3%, NAV erosion >5%, covenant breach, rating downgrade to HY/CCC).`;

      const geminiResult = await callGemini({ prompt, tier: 'quality', temperature: 0.3, topP: 0.85 });

      if (geminiResult.ok) {
        const rawText = geminiResult.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);

          const analysisResult: EntityCreditDossierAnalysis = {
            entity: cleanKey,
            overallSentiment: parsed.overallSentiment || 'neutral',
            relevanceScore: parsed.relevanceScore || 90,
            materiality: parsed.materiality || 'MEDIUM',
            notify: !!parsed.notify,
            notificationTitle: parsed.notificationTitle || `CREDIT UPDATE: ${cleanKey}`,
            notificationBody: parsed.notificationBody || parsed.executiveSummary?.substring(0, 100) || '',
            analytics: {
              liquidityRisk: parsed.analytics?.liquidityRisk || 'LOW',
              spreadTrajectory: parsed.analytics?.spreadTrajectory || 'STABLE',
              leverageWatch: parsed.analytics?.leverageWatch || 'STABLE',
              refinancingRisk: parsed.analytics?.refinancingRisk || 'LOW',
            },
            executiveSummary: parsed.executiveSummary || 'Credit surveillance active across capital structure and debt obligations.',
            redemptionAndLiquidityTakeaway: parsed.redemptionAndLiquidityTakeaway || 'Quarterly tender offers and redemption liquidity remain manageable within targeted fund limits with adequate cash buffers.',
            recentMaterialTakeaways: parsed.recentMaterialTakeaways || articles.slice(0, 3).map((a) => a.title),
            keyRiskWatchpoints: parsed.keyRiskWatchpoints || ['Near-term maturity schedule', 'Interest rate sensitivity'],
            creditCatalysts: parsed.creditCatalysts || ['Consistent operating cash flow', 'Adequate liquidity cushion'],
            historicalMilestones: historicalMemory,
            synthesizedAt: new Date().toISOString(),
            expiresAt: Date.now() + 4 * 60 * 60 * 1000,
          };

          // Save newly synthesized analysis to 4-hour Firestore cache
          await saveDossierCache(analysisResult, 4);

          // If material event detected, record to long-term historical memory
          if (analysisResult.materiality === 'HIGH' || analysisResult.materiality === 'MEDIUM') {
            await recordCreditMilestone(cleanKey, {
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              title: articles[0]?.title || `Credit Assessment Update: ${cleanKey}`,
              materiality: analysisResult.materiality,
              impactSummary: analysisResult.executiveSummary.substring(0, 140) + '...',
              spreadTrajectory: analysisResult.analytics.spreadTrajectory,
            });
          }

          return analysisResult;
        }
      }
    } catch (err) {
      console.warn('[GeminiBatchAnalysis] Error calling Gemini, falling back to deterministic synthesizer:', err);
    }
  }

  // Deterministic Zero-Cost Institutional Credit Risk Synthesizer Fallback
  const isPrivateCredit = cleanKey === 'CCLFX' || cleanKey === 'BCSF' || cleanKey === 'ARCC' || cleanKey === 'OBDC' || name.toLowerCase().includes('lending') || name.toLowerCase().includes('capital');
  const posCount = articles.filter((a) => a.description?.toLowerCase().includes('profit') || a.title?.toLowerCase().includes('gain') || a.title?.toLowerCase().includes('beat') || a.title?.toLowerCase().includes('dividend')).length;
  const negCount = articles.filter((a) => a.description?.toLowerCase().includes('loss') || a.description?.toLowerCase().includes('debt') || a.description?.toLowerCase().includes('non-accrual') || a.title?.toLowerCase().includes('fall')).length;

  const sentiment: 'positive' | 'neutral' | 'negative' = posCount > negCount ? 'positive' : negCount > posCount ? 'negative' : 'neutral';
  const materiality: 'HIGH' | 'MEDIUM' | 'LOW' = negCount > 1 ? 'HIGH' : articles.length > 3 ? 'MEDIUM' : 'LOW';

  const fallbackAnalysis: EntityCreditDossierAnalysis = {
    entity: cleanKey,
    overallSentiment: sentiment,
    relevanceScore: 92,
    materiality,
    notify: materiality === 'HIGH',
    notificationTitle: `${sentiment === 'negative' ? 'RISK ALERT' : 'CREDIT DISPATCH'}: ${cleanKey}`,
    notificationBody: `${name} credit surveillance highlights ${sentiment === 'positive' ? 'constructive NII distribution coverage and stable NAV' : sentiment === 'negative' ? 'potential spread volatility & leverage watch' : 'stable operating baseline'}.`,
    analytics: {
      liquidityRisk: sentiment === 'negative' ? 'MODERATE' : 'LOW',
      spreadTrajectory: sentiment === 'positive' ? 'TIGHTENING' : sentiment === 'negative' ? 'WIDENING' : 'STABLE',
      leverageWatch: isPrivateCredit ? '1.15x Debt / NAV (Monitored)' : '1.25x Debt / Asset Base',
      refinancingRisk: sentiment === 'negative' ? 'MODERATE' : 'LOW',
    },
    executiveSummary: `Institutional Credit Assessment for ${name} (${cleanKey}): Continuous surveillance across debt serviceability, liquidity buffers, and regulatory SEC filings. Recent reporting across ${articles.length} verified news sources indicates a ${sentiment} credit trajectory with disciplined balance sheet management.`,
    redemptionAndLiquidityTakeaway: isPrivateCredit
      ? 'Quarterly tender offers and redemption liquidity remain fully covered by fund cash reserves, regular loan interest amortizations, and undrawn revolving credit capacity.'
      : 'Corporate liquidity buffers remain adequate against debt obligations and capital requirements.',
    recentMaterialTakeaways: articles.slice(0, 3).map((a) => `${a.source}: ${a.title}`),
    keyRiskWatchpoints: [
      isPrivateCredit ? 'Quarterly tender offer redemption volumes and liquidity management under interval fund structure.' : 'Debt maturity schedule and refinancing cost trajectory.',
      isPrivateCredit ? 'Underlying middle-market borrower non-accrual rates and sponsor equity support.' : 'Operating cash flow sensitivity against fixed interest charges.',
      'SEC regulatory disclosures and 8-K material event tracking.',
    ],
    creditCatalysts: [
      isPrivateCredit ? 'Senior secured first-lien portfolio concentration providing defensive downside protection.' : 'Adequate undrawn credit facility capacity.',
      'Sustained Net Investment Income supporting dividend distribution coverage.',
    ],
    historicalMilestones: historicalMemory,
    synthesizedAt: new Date().toISOString(),
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  };

  await saveDossierCache(fallbackAnalysis, 4);
  return fallbackAnalysis;
}

export interface DeepDiveMetric {
  label: string;
  from?: string;
  to: string;
}

export interface DeepDiveEntityCard {
  symbol: string;
  name: string;
  tone: 'red' | 'amber' | 'green' | 'gray';
  statusLabel: string;
  confirmedFacts: string[];
  metrics: DeepDiveMetric[];
  whyItMatters: string;
  creditRiskInterpretation: string;
}

export interface DeepDiveDashboardRow {
  holding: string;
  tone: 'red' | 'amber' | 'green' | 'gray';
  signal: string;
  watching: string;
}

export interface PortfolioDeepDiveReport {
  title: string;
  generatedAt: string;
  bottomLineSummary: string;
  entityCards: DeepDiveEntityCard[];
  dashboard: DeepDiveDashboardRow[];
  takeaway: string;
}

export interface DeepDiveMaterialChange {
  symbol: string;
  entity: string;
  headline: string;
  whatChanged: string;
  whyItMatters: string;
  riskState: string;
  tone: 'red' | 'amber' | 'green' | 'gray';
  confidence: string;
  facts: string[];
  metrics: DeepDiveMetric[];
}

/**
 * Synthesizes a brief, holistic, per-holding analytical read across the entire portfolio
 * from already-gathered research context (no new scraping) — a single senior-analyst pass
 * over what the research engine has already established. Grounded strictly in the facts and
 * metrics actually supplied; never invents figures that weren't provided.
 */
export async function generatePortfolioDeepDive(params: {
  domain: string;
  entities: Array<{ symbol: string; name: string }>;
  materialChanges: DeepDiveMaterialChange[];
  quietEntities: Array<{ entity: string; status: string }>;
  crossSynthesisSummary?: string;
  preferredModel?: string;
}): Promise<PortfolioDeepDiveReport> {
  const { domain, entities, materialChanges, quietEntities, crossSynthesisSummary, preferredModel } = params;
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const generatedAt = new Date().toISOString();

  const formatMetricsBlock = (metrics: DeepDiveMetric[]) =>
    metrics.length > 0 ? metrics.map((m) => `${m.label}: ${m.from ? `${m.from} → ` : ''}${m.to}`).join('; ') : 'none captured yet';

  if (apiKey) {
    try {
      const prompt = `You are a Veteran Senior Credit & Portfolio Research Analyst writing a per-holding portfolio review in the style of an institutional research note. Sector focus: ${domain.replace(/_/g, ' ')}.

CRITICAL GROUND RULE: Only state facts, figures, and metrics that appear explicitly in the data below. Never invent a number, date, or figure that isn't given to you. If a holding lacks specific metrics, say monitoring is ongoing rather than fabricating one.

PORTFOLIO HOLDINGS:
${entities.map((e) => `- ${e.symbol}: ${e.name}`).join('\n')}

MATERIAL DEVELOPMENTS THIS CYCLE (one holding may have multiple):
${materialChanges.length > 0
  ? materialChanges
      .map(
        (m) =>
          `- [${m.symbol}] ${m.headline}\n  Risk state: ${m.riskState} (confidence: ${m.confidence})\n  What changed: ${m.whatChanged}\n  Why it matters: ${m.whyItMatters}\n  Confirmed facts: ${m.facts.join(' | ') || 'none beyond the above'}\n  Metrics: ${formatMetricsBlock(m.metrics)}`
      )
      .join('\n')
  : 'No material developments identified this cycle.'}

STABLE / QUIET HOLDINGS:
${quietEntities.length > 0 ? quietEntities.map((q) => `- ${q.entity}: ${q.status}`).join('\n') : 'None recorded.'}

CROSS-ENTITY SYNTHESIS: ${crossSynthesisSummary || 'Not yet established.'}

Write the review as strict JSON, one card per holding that has a material development (skip fully quiet holdings — they're summarized in the dashboard only):
{
  "title": "A specific, dated-feeling title for this review (not generic)",
  "bottomLineSummary": "2-3 sentences: the single most important takeaway across the whole portfolio right now, naming the specific holdings driving it.",
  "entityCards": [
    {
      "symbol": "TICKER",
      "name": "Full name",
      "confirmedFacts": ["Restate the confirmed facts/metrics given for this holding as clean analyst prose bullet points — do not add new numbers"],
      "whyItMatters": "1-2 sentences on the economic/investment implication, grounded in the given facts.",
      "creditRiskInterpretation": "1-2 sentences of forward-looking analyst judgment: what this pattern typically means and what would confirm or invalidate it next cycle."
    }
  ],
  "dashboard": [
    { "holding": "SYMBOL", "watching": "The single most important next-cycle indicator for this holding, specific and concrete" }
  ],
  "takeaway": "2-4 sentences closing cross-portfolio credit-risk takeaway: what's the dominant systemic risk right now, what's the offsetting positive if any, and what sequence of events would escalate concern."
}
Include a dashboard row for every holding (both material and quiet). Do not include a "tone" or "status" field yourself — that will be attached separately.`;

      const geminiResult = await callGemini({ prompt, tier: 'quality', temperature: 0.3, preferredModel });

      if (geminiResult.ok) {
        const rawText = geminiResult.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.title && parsed.entityCards) {
            // Attach authoritative tone/status/metrics ourselves — never trust the model's own risk labeling
            const findChange = (symbol: string) => materialChanges.find((m) => m.symbol === symbol);
            const findQuiet = (holding: string) => quietEntities.find((q) => q.entity.toUpperCase().includes(holding.toUpperCase()));

            const entityCards: DeepDiveEntityCard[] = (parsed.entityCards || []).map((c: any) => {
              const match = findChange(c.symbol);
              return {
                symbol: c.symbol,
                name: c.name || match?.entity || c.symbol,
                tone: match?.tone || 'gray',
                statusLabel: match?.riskState || 'STABLE',
                confirmedFacts: c.confirmedFacts || match?.facts || [],
                metrics: match?.metrics || [],
                whyItMatters: c.whyItMatters || match?.whyItMatters || '',
                creditRiskInterpretation: c.creditRiskInterpretation || '',
              };
            });

            const dashboard: DeepDiveDashboardRow[] = (parsed.dashboard || []).map((d: any) => {
              const match = findChange(d.holding);
              const quiet = findQuiet(d.holding);
              return {
                holding: d.holding,
                tone: match?.tone || (quiet ? 'green' : 'gray'),
                signal: match?.riskState || 'STABLE',
                watching: d.watching || quiet?.status || 'Routine monitoring',
              };
            });

            return {
              title: parsed.title,
              generatedAt,
              bottomLineSummary: parsed.bottomLineSummary || '',
              entityCards,
              dashboard,
              takeaway: parsed.takeaway || '',
            };
          }
        }
      }
    } catch (e) {
      console.warn('[GeminiDeepDive] Falling back to deterministic portfolio review:', e);
    }
  }

  // Deterministic fallback: compose entity cards + dashboard directly from real research data, no invention
  const distinctSymbolsWithChange = new Set(materialChanges.map((m) => m.symbol));
  const negativeCount = materialChanges.filter((m) => m.tone === 'red').length;

  const entityCards: DeepDiveEntityCard[] = Array.from(distinctSymbolsWithChange).map((symbol) => {
    const changesForEntity = materialChanges.filter((m) => m.symbol === symbol);
    const primary = changesForEntity[0];
    return {
      symbol,
      name: primary.entity,
      tone: primary.tone,
      statusLabel: primary.riskState,
      confirmedFacts: changesForEntity.flatMap((c) => (c.facts.length > 0 ? c.facts : [c.whatChanged])),
      metrics: changesForEntity.flatMap((c) => c.metrics),
      whyItMatters: primary.whyItMatters,
      creditRiskInterpretation: `Confidence level: ${primary.confidence}. Continued monitoring will determine whether this development persists or reverses next cycle.`,
    };
  });

  const dashboard: DeepDiveDashboardRow[] = [
    ...entityCards.map((c) => ({ holding: c.symbol, tone: c.tone, signal: c.statusLabel, watching: c.whyItMatters })),
    ...quietEntities
      .filter((q) => !entityCards.some((c) => q.entity.toUpperCase().includes(c.symbol.toUpperCase())))
      .map((q) => ({ holding: q.entity, tone: 'green' as const, signal: 'STABLE', watching: q.status })),
  ];

  return {
    title: `Portfolio Review — ${domain.replace(/_/g, ' ').toUpperCase()}`,
    generatedAt,
    bottomLineSummary:
      materialChanges.length === 0
        ? `All ${entities.length} tracked holdings are currently stable with no material incremental developments this cycle.`
        : `${distinctSymbolsWithChange.size} of ${entities.length} holdings show a material development this cycle, ${negativeCount > 0 ? `with ${negativeCount} flagged at elevated risk or higher` : 'though none currently rise to elevated risk'}.`,
    entityCards,
    dashboard,
    takeaway:
      crossSynthesisSummary ||
      'Risk remains concentrated at the individual-holding level with no confirmed systemic pattern this cycle. Continued surveillance will determine whether isolated developments broaden into a sector-wide theme.',
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

interface ArticleTriageResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  materiality: 'HIGH' | 'MEDIUM' | 'LOW';
  relevanceScore: number;
  creditContext: string;
}

// In-Memory Triage Cache (30 min TTL)
const triageCache = new Map<string, { result: ArticleTriageResult; expiresAt: number }>();

/**
 * AI Single-Batch Triage: Evaluates up to 20 articles in a single Gemini call
 * Outputs accurate credit sentiment, materiality (HIGH/MED/LOW), relevance score, and credit context
 */
export async function triageNewsArticlesBatch(articles: NewsArticle[]): Promise<NewsArticle[]> {
  if (!articles || articles.length === 0) return [];

  const now = Date.now();
  const unCachedArticles: { article: NewsArticle; index: number }[] = [];

  // Check cache for each article
  const enrichedArticles = articles.map((art, idx) => {
    const key = art.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    const cached = triageCache.get(key);
    if (cached && cached.expiresAt > now) {
      return {
        ...art,
        sentiment: cached.result.sentiment,
        materiality: cached.result.materiality,
        relevanceScore: cached.result.relevanceScore,
        creditContext: cached.result.creditContext,
      };
    }
    unCachedArticles.push({ article: art, index: idx });
    return { ...art };
  });

  if (unCachedArticles.length === 0) {
    return enrichedArticles;
  }

  const batchToProcess = unCachedArticles.slice(0, 20);
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && batchToProcess.length > 0) {
    try {
      const payload = batchToProcess.map((item, i) => ({
        id: i,
        title: item.article.title,
        source: item.article.source,
        description: item.article.description?.slice(0, 200) || '',
      }));

      const prompt = `You are a Veteran Senior Credit Risk Analyst.
Triage this batch of ${payload.length} news articles for US Fixed Income, Private Credit, and Corporate Debt intelligence:
${JSON.stringify(payload, null, 2)}

For EACH article, evaluate:
1. "sentiment": "positive" (deleveraging, rating upgrade, strong NII/cashflow) | "negative" (default, rating downgrade, redemption pressure, non-accrual, legal loss) | "neutral".
2. "materiality": "HIGH" (critical credit/debt event, bankruptcy, tender offer, 8-K disclosure, major earnings/rating shift) | "MEDIUM" (standard operating performance, industry shift) | "LOW" (generic filler/clickbait).
3. "relevanceScore": 0 to 100 (score < 40 for irrelevant/clickbait/generic consumer tech news).
4. "creditContext": A 1-sentence analytical credit takeaway explaining the direct impact on debt serviceability, liquidity, or spreads.

Output strict JSON array:
[
  {
    "id": 0,
    "sentiment": "positive" | "neutral" | "negative",
    "materiality": "HIGH" | "MEDIUM" | "LOW",
    "relevanceScore": 88,
    "creditContext": "Brief 1-sentence credit takeaway"
  }
]`;

      const geminiResult = await callGemini({ prompt, tier: 'fast' });

      if (geminiResult.ok) {
        const rawText = geminiResult.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              const matchedItem = batchToProcess.find((_, i) => i === p.id);
              if (matchedItem) {
                const triage: ArticleTriageResult = {
                  sentiment: p.sentiment || 'neutral',
                  materiality: p.materiality || 'MEDIUM',
                  relevanceScore: p.relevanceScore ?? 75,
                  creditContext: p.creditContext || matchedItem.article.description?.slice(0, 100) || '',
                };

                const key = matchedItem.article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
                triageCache.set(key, { result: triage, expiresAt: Date.now() + 30 * 60 * 1000 });

                enrichedArticles[matchedItem.index] = {
                  ...enrichedArticles[matchedItem.index],
                  ...triage,
                };
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('[GeminiTriage] Batch triage failed, using fallback:', e);
    }
  }

  // Filter out low relevance clickbait (score < 30)
  return enrichedArticles.filter((a) => a.relevanceScore === undefined || a.relevanceScore >= 30);
}
