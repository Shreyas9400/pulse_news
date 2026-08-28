/**
 * PulseNews Event Analysis Engine
 *
 * This is the reasoning layer that converts raw evidence into genuine analyst output.
 * Everything the user reads as "analysis" — what changed, why it matters, the metric
 * deltas, the risk call, the open questions — is produced here, grounded strictly in
 * the supplied evidence.
 *
 * Design rules:
 *  1. NEVER invent a figure, date, or fact that is not present in the evidence text.
 *  2. Aggressively mark immaterial items so they can be dropped instead of padding the UI.
 *  3. Preserve source attribution so every claim can be traced back to a URL.
 */

import { EvidenceItem, MetricDelta, MaterialityAssessment } from './types';
import { assessContentQuality, stripBoilerplatePrefix } from './content-quality';
import { callGemini, getApiKey, getAnalysisUnavailableReason } from './gemini-client';

export interface AnalyzedEventSource {
  url: string;
  publisher: string;
  title: string;
  publishedAt: string;
  tier: string;
}

export interface AnalyzedEvent {
  /** False when the evidence carries no genuine, portfolio-relevant development. */
  isMaterial: boolean;
  /** Short specific headline — the development itself, not the article title. */
  headline: string;
  /** What specifically changed versus the prior known state. */
  whatChanged: string;
  /** The concrete economic / credit / investment implication. */
  whyItMatters: string;
  /** Quantitative deltas actually present in the evidence. */
  metrics: MetricDelta[];
  /** Discrete facts established by the evidence, as analyst prose. */
  factsEstablished: string[];
  /** Genuine unknowns specific to this development. */
  openQuestions: string[];
  /** The next observable fact that would confirm or invalidate this read. */
  nextTrigger: string;
  riskDirection: MaterialityAssessment['riskDirection'];
  materialityScore: number;
  confidenceScore: number;
  priorAssessment?: string;
  newAssessment?: string;
  reasoning: string;
  sources: AnalyzedEventSource[];
}

/**
 * Analysis cache. Reasoning over the same evidence twice returns the same answer but
 * costs another API request — and provider free tiers allow very few. Keyed on the
 * entity plus a digest of the evidence actually analysed, so it self-invalidates the
 * moment new sources arrive.
 */
const ANALYSIS_CACHE = new Map<string, { at: number; result: AnalyzedEvent[] }>();
const ANALYSIS_TTL_MS = 60 * 60 * 1000; // 1 hour

function analysisCacheKey(entityName: string, evidence: EvidenceItem[]): string {
  const digest = evidence
    .map((e) => e.sourceUrl)
    .sort()
    .join('|');
  let hash = 0;
  for (let i = 0; i < digest.length; i++) {
    hash = (hash * 31 + digest.charCodeAt(i)) | 0;
  }
  return `${entityName.toLowerCase()}::${hash}`;
}

function toSource(ev: EvidenceItem): AnalyzedEventSource {
  return {
    url: ev.sourceUrl,
    publisher: ev.originalPublisher || ev.publisher,
    title: ev.sourceName,
    publishedAt: ev.publishedAt,
    tier: ev.sourceTier,
  };
}

function priorityFromScore(score: number): MaterialityAssessment['priority'] {
  if (score >= 85) return 'CRITICAL';
  if (score >= 65) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/** Builds a full MaterialityAssessment from an analyzed event, for the canonical event record. */
export function materialityFromAnalysis(analysis: AnalyzedEvent): MaterialityAssessment {
  const score = analysis.materialityScore;
  return {
    materialityScore: score,
    confidenceScore: analysis.confidenceScore,
    riskDirection: analysis.riskDirection,
    reasoning: analysis.reasoning,
    priority: priorityFromScore(score),
    factors: {
      changeMagnitude: score,
      financialImpact: score,
      portfolioExposure: score,
      liquidityImpact: analysis.riskDirection === 'NEGATIVE' ? score : Math.round(score * 0.6),
      valuationImpact: Math.round(score * 0.8),
      strategicImportance: Math.round(score * 0.7),
      systemicRelevance: Math.round(score * 0.5),
      novelty: score,
      sourceConfidence: analysis.confidenceScore,
    },
  };
}

export interface EntityAnalysisInput {
  entityId: string;
  entityName: string;
  entityTicker?: string;
  evidence: EvidenceItem[];
  priorStateSummary?: string;
  monitoringQuestions?: string[];
}

/** Max holdings folded into a single analysis request, to stay well inside token limits. */
const MAX_ENTITIES_PER_CALL = 6;
/** Max sources per holding included in a batched prompt. */
const MAX_SOURCES_PER_ENTITY = 8;
/** Max characters of each source's content sent for reasoning. */
const MAX_SOURCE_CHARS = 700;

/**
 * Analyses the whole portfolio in as few API calls as possible.
 *
 * Cost design: reasoning is billed per request and free tiers cap requests per day, so
 * all holdings are folded into one prompt (chunked only if the portfolio is large) rather
 * than issuing one request per holding. A 6-holding portfolio costs 1 request, not 6.
 */
export async function analyzePortfolioEvidence(params: {
  domain: string;
  entities: EntityAnalysisInput[];
  preferredModel?: string;
}): Promise<Map<string, AnalyzedEvent[]>> {
  const { domain, entities, preferredModel } = params;
  const out = new Map<string, AnalyzedEvent[]>();

  // Quality-gate every holding's evidence up front; drop holdings left with nothing
  const prepared = entities
    .map((e) => {
      const usable = e.evidence
        .map((ev) => ({ ev, quality: assessContentQuality(ev.snippet) }))
        .filter((x) => x.quality.usable)
        .sort((a, b) => b.quality.score - a.quality.score)
        .slice(0, MAX_SOURCES_PER_ENTITY)
        .map((x) => x.ev);
      return { ...e, usable };
    })
    .filter((e) => e.usable.length > 0);

  if (prepared.length === 0) return out;

  if (!getApiKey()) {
    for (const e of prepared) {
      out.set(e.entityId, deterministicAnalysis(e.usable, e.entityName));
    }
    return out;
  }

  for (let i = 0; i < prepared.length; i += MAX_ENTITIES_PER_CALL) {
    const chunk = prepared.slice(i, i + MAX_ENTITIES_PER_CALL);

    // Serve from cache where the evidence set is unchanged, and only send the rest
    const uncached: typeof chunk = [];
    for (const e of chunk) {
      const key = analysisCacheKey(e.entityName, e.usable);
      const hit = ANALYSIS_CACHE.get(key);
      if (hit && Date.now() - hit.at < ANALYSIS_TTL_MS) {
        out.set(e.entityId, hit.result);
      } else {
        uncached.push(e);
      }
    }
    if (uncached.length === 0) continue;

    const batchResult = await runBatchedAnalysis(domain, uncached, preferredModel);
    for (const e of uncached) {
      const analyses = batchResult.get(e.entityId) ?? [];
      out.set(e.entityId, analyses);
      ANALYSIS_CACHE.set(analysisCacheKey(e.entityName, e.usable), { at: Date.now(), result: analyses });
    }
  }

  return out;
}

/**
 * Runs the senior-analyst reasoning pass over all evidence gathered for one entity.
 * Returns one analyzed event per genuine development (immaterial noise is dropped).
 */
export async function analyzeEvidenceForEntity(params: {
  entityName: string;
  entityTicker?: string;
  domain: string;
  evidence: EvidenceItem[];
  priorStateSummary?: string;
  monitoringQuestions?: string[];
}): Promise<AnalyzedEvent[]> {
  const { entityName, entityTicker, domain, evidence, priorStateSummary, monitoringQuestions } = params;

  // 1. Quality gate: drop boilerplate/table dumps before spending any reasoning on them
  const usable = evidence
    .map((ev) => ({ ev, quality: assessContentQuality(ev.snippet) }))
    .filter((x) => x.quality.usable)
    .sort((a, b) => b.quality.score - a.quality.score)
    .slice(0, 12);

  if (usable.length === 0) return [];

  if (!getApiKey()) {
    return deterministicAnalysis(usable.map((u) => u.ev), entityName);
  }

  // Reuse a recent reasoning pass over identical evidence rather than spending another call
  const cacheKey = analysisCacheKey(entityName, usable.map((u) => u.ev));
  const cached = ANALYSIS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < ANALYSIS_TTL_MS) {
    return cached.result;
  }

  const evidenceBlock = usable
    .map(
      (u, i) =>
        `[${i + 1}] SOURCE: ${u.ev.publisher} (${u.ev.sourceTier}) | PUBLISHED: ${u.ev.publishedAt}\nURL: ${u.ev.sourceUrl}\nCONTENT: ${stripBoilerplatePrefix(u.ev.snippet).slice(0, 900)}`
    )
    .join('\n\n');

  const prompt = `You are a Veteran Senior Credit Risk Analyst covering ${domain.replace(/_/g, ' ')}. You are analysing raw source material gathered on a single portfolio holding and producing institutional research output.

HOLDING: ${entityName}${entityTicker ? ` (${entityTicker})` : ''}
PRIOR KNOWN STATE: ${priorStateSummary || 'No prior assessment on record — this is the baseline cycle.'}
${monitoringQuestions && monitoringQuestions.length > 0 ? `STANDING MONITORING QUESTIONS:\n${monitoringQuestions.map((q) => `- ${q}`).join('\n')}` : ''}

SOURCE MATERIAL:
${evidenceBlock}

ABSOLUTE RULES:
1. GROUNDING: Only state facts, figures, dates and metrics that appear VERBATIM in the source material above. Never infer, estimate, or supply a number from your own knowledge. If a figure is not in the sources, do not mention it.
2. MATERIALITY: Most scraped content is NOT a material development. Marketing pages, fund descriptions, generic sector explainers, directory listings, "what is private credit" explainers, and articles that merely mention the holding in passing are NOT material — set isMaterial:false for these. Only a genuine, specific, NEW development (an earnings result, a filing disclosure, a redemption/tender action, a rating change, a non-accrual move, a NAV change, a credit facility action, a management/strategy change) is material.
3. SPECIFICITY: Never write generic filler such as "assessing potential portfolio implications" or "this is something to monitor". If you cannot say something specific and grounded, the item is not material.
4. DEDUPLICATION: If several sources describe the SAME development, emit ONE event citing all of their indices.
5. ROUTINE FILINGS: A filing that merely EXISTS is not a development. "Company filed an N-CEN/N-PX/Form 4/8-K" with no disclosed content is administrative noise — set isMaterial:false. Only report a filing when the sources state what it actually DISCLOSED.
6. RISK DIRECTION — call it honestly, do not default to NEUTRAL:
   - NEGATIVE: any credit deterioration — non-accruals rising, NAV declining, leverage increasing, income falling, redemptions building, coverage weakening, rating pressure.
   - POSITIVE: deleveraging, NAV growth, non-accrual cures, improved coverage, funding access reopening, upgrades.
   - MIXED: genuinely offsetting moves (e.g. income up but asset quality down) — use this rather than NEUTRAL when both directions are present.
   - NEUTRAL: reserve for genuinely directionless information only.
   Deteriorating asset quality is NEGATIVE even when income still covers the dividend.
7. UNITS: embed the unit directly in every metric value string — write "$16.65", "3.2%", "$62.3M", "1.22x", never a bare number like "16.65" or "77.6".

Return strict JSON — an array of the genuine developments found (empty array if none are material):
[
  {
    "isMaterial": true,
    "sourceIndices": [1, 3],
    "headline": "Specific development in under 10 words — the event, not the article title",
    "whatChanged": "1-2 sentences stating exactly what changed versus the prior known state, with the specific figures from the sources.",
    "whyItMatters": "1-2 sentences on the actual credit/liquidity/valuation implication for a holder. Be concrete about the mechanism.",
    "metrics": [
      { "metricName": "Non-Accrual Rate", "previousValue": "1.4%", "currentValue": "3.2%", "unit": "%", "asOfDate": "Q2 2026" },
      { "metricName": "NAV per share", "currentValue": "$16.65", "unit": "USD", "asOfDate": "Q2 2026" }
    ],
    "factsEstablished": [
      "Each discrete fact the sources establish, written as clean analyst prose with its figure"
    ],
    "openQuestions": [
      "A genuine unknown specific to THIS development — not a generic question"
    ],
    "nextTrigger": "The single next observable fact that would confirm or invalidate this assessment. Be specific (e.g. 'Q3 non-accrual rate and whether the two workout positions are resolved').",
    "riskDirection": "NEGATIVE" | "POSITIVE" | "NEUTRAL" | "MIXED",
    "materialityScore": 0-100,
    "confidenceScore": 0-100,
    "priorAssessment": "Short prior risk label if the prior state implies one, else omit",
    "newAssessment": "Short new risk label implied by this development, else omit",
    "reasoning": "1 sentence on why you scored materiality where you did."
  }
]
METRICS RULE: Extract EVERY hard figure the sources state for this holding — NAV per share, non-accrual rate, net investment income, dividend, leverage/debt-to-equity, redemption or tender percentages, portfolio fair value, first-lien percentage, undrawn capacity. Include "previousValue" ONLY when the source itself states the prior figure; otherwise give just "currentValue" as a point-in-time reading. Never leave metrics empty when the sources contain figures, and never write a figure that is not in the sources.`;

  try {
    const result = await callGemini({ prompt, tier: 'quality', temperature: 0.2, topP: 0.8 });

    if (!result.ok || !result.text) {
      console.warn('[AnalysisEngine] Analysis unavailable:', result.error);
      return deterministicAnalysis(usable.map((u) => u.ev), entityName);
    }

    const parsed = JSON.parse(result.text);
    const list = Array.isArray(parsed) ? parsed : parsed.events || [];

    const analyzed: AnalyzedEvent[] = list
      .filter((item: any) => item && item.isMaterial !== false && item.headline)
      .map((item: any): AnalyzedEvent => {
        // Map the model's source indices back to real evidence records for attribution
        const indices: number[] = Array.isArray(item.sourceIndices) ? item.sourceIndices : [];
        const cited = indices
          .map((i) => usable[i - 1]?.ev)
          .filter((e): e is EvidenceItem => !!e);
        const sources = (cited.length > 0 ? cited : usable.slice(0, 1).map((u) => u.ev)).map(toSource);

        return {
          isMaterial: true,
          headline: item.headline,
          whatChanged: item.whatChanged || item.headline,
          whyItMatters: item.whyItMatters || '',
          metrics: Array.isArray(item.metrics)
            ? item.metrics.map((m: any) => {
                // Guarantee the unit is visible even if the model returned a bare number
                const withUnit = (v: unknown) => {
                  if (v === undefined || v === null || v === '') return undefined;
                  const s = String(v).trim();
                  if (!m.unit || /[%$x×]/i.test(s) || /[a-zA-Z]/.test(s)) return s;
                  return m.unit === '%' ? `${s}%` : m.unit === 'USD' ? `$${s}` : `${s} ${m.unit}`;
                };
                return {
                  metricName: m.metricName,
                  previousValue: withUnit(m.previousValue),
                  currentValue: withUnit(m.currentValue) ?? String(m.currentValue ?? ''),
                  unit: m.unit,
                  asOfDate: m.asOfDate,
                };
              })
            : [],
          factsEstablished: Array.isArray(item.factsEstablished) ? item.factsEstablished : [],
          openQuestions: Array.isArray(item.openQuestions) ? item.openQuestions : [],
          nextTrigger: item.nextTrigger || '',
          riskDirection: item.riskDirection || 'NEUTRAL',
          materialityScore: typeof item.materialityScore === 'number' ? item.materialityScore : 50,
          confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : 60,
          priorAssessment: item.priorAssessment,
          newAssessment: item.newAssessment,
          reasoning: item.reasoning || '',
          sources,
        };
      });

    ANALYSIS_CACHE.set(cacheKey, { at: Date.now(), result: analyzed });
    return analyzed;
  } catch (e) {
    console.warn('[AnalysisEngine] Analysis error, using deterministic fallback:', e);
    return deterministicAnalysis(usable.map((u) => u.ev), entityName);
  }
}

/** Shared grounding rules — identical standards whether analysing one holding or many. */
const ANALYST_RULES = `ABSOLUTE RULES:
1. GROUNDING: Only state facts, figures, dates and metrics that appear VERBATIM in the source material. Never infer, estimate, or supply a number from your own knowledge. If a figure is not in the sources, do not mention it.
2. MATERIALITY: Most scraped content is NOT a material development. Marketing pages, fund descriptions, generic sector explainers, "what is private credit" articles, directory listings, and articles that merely mention a holding in passing are NOT material — omit them entirely. Only a genuine, specific, NEW development (an earnings result, a filing disclosure, a redemption/tender action, a rating change, a non-accrual move, a NAV change, a credit facility action, a management/strategy change) qualifies.
3. SPECIFICITY: Never write generic filler such as "assessing potential portfolio implications" or "this is something to monitor". If you cannot say something specific and grounded, omit the item.
4. DEDUPLICATION: If several sources describe the SAME development, emit ONE event citing all of their indices.
5. ROUTINE FILINGS: A filing that merely EXISTS is not a development. "Company filed an N-CEN/N-PX/Form 4/8-K" with no disclosed content is administrative noise — omit it. Only report a filing when the sources state what it actually DISCLOSED.
6. RISK DIRECTION — call it honestly, do not default to NEUTRAL:
   - NEGATIVE: any credit deterioration — non-accruals rising, NAV declining, leverage increasing, income falling, redemptions building, coverage weakening, rating pressure.
   - POSITIVE: deleveraging, NAV growth, non-accrual cures, improved coverage, funding access reopening, upgrades.
   - MIXED: genuinely offsetting moves (e.g. income up but asset quality down) — prefer this over NEUTRAL when both directions are present.
   - NEUTRAL: reserve for genuinely directionless information only.
   Deteriorating asset quality is NEGATIVE even when income still covers the dividend.
7. UNITS: embed the unit directly in every metric value — write "$16.65", "3.2%", "$62.3M", "1.22x", never a bare number.
8. METRICS: extract EVERY hard figure the sources state — NAV/share, non-accrual rate, net investment income, dividend, leverage, redemption or tender percentages, portfolio fair value, first-lien %, undrawn capacity. Include "previousValue" ONLY when the source itself states the prior figure.`;

/**
 * Executes one multi-holding analysis request and maps results back per entity.
 * Sources are indexed globally across the batch so citations stay unambiguous.
 */
async function runBatchedAnalysis(
  domain: string,
  entities: Array<EntityAnalysisInput & { usable: EvidenceItem[] }>,
  preferredModel?: string
): Promise<Map<string, AnalyzedEvent[]>> {
  const out = new Map<string, AnalyzedEvent[]>();

  // Global source index -> evidence, so the model can cite [n] across all holdings
  const indexed: EvidenceItem[] = [];
  const blocks: string[] = [];

  for (const e of entities) {
    const lines = e.usable.map((ev) => {
      indexed.push(ev);
      const n = indexed.length;
      return `  [${n}] ${ev.publisher} (${ev.sourceTier}) | ${ev.publishedAt}\n      ${stripBoilerplatePrefix(ev.snippet).slice(0, MAX_SOURCE_CHARS)}`;
    });

    blocks.push(
      `### HOLDING key="${e.entityId}" — ${e.entityName}${e.entityTicker ? ` (${e.entityTicker})` : ''}\n` +
        `PRIOR KNOWN STATE: ${e.priorStateSummary || 'No prior assessment on record.'}\n` +
        (e.monitoringQuestions?.length
          ? `STANDING QUESTIONS: ${e.monitoringQuestions.slice(0, 3).join(' | ')}\n`
          : '') +
        `SOURCES:\n${lines.join('\n')}`
    );
  }

  const prompt = `You are a Veteran Senior Credit Risk Analyst covering ${domain.replace(/_/g, ' ')}. Analyse the source material for EACH holding below and produce institutional research output.

${ANALYST_RULES}

${blocks.join('\n\n')}

Return strict JSON mapping each holding's key to its genuine developments. Use an empty array for a holding with no material development — that is a valid and common answer:
{
  "ENTITY_KEY": [
    {
      "sourceIndices": [1, 3],
      "headline": "Specific development in under 10 words — the event, not the article title",
      "whatChanged": "1-2 sentences stating exactly what changed versus the prior known state, with the specific figures from the sources.",
      "whyItMatters": "1-2 sentences on the actual credit/liquidity/valuation implication. Be concrete about the mechanism.",
      "metrics": [
        { "metricName": "Non-Accrual Rate", "previousValue": "1.4%", "currentValue": "3.2%", "unit": "%", "asOfDate": "Q2 2026" }
      ],
      "factsEstablished": ["Each discrete fact the sources establish, as clean analyst prose with its figure"],
      "openQuestions": ["A genuine unknown specific to THIS development"],
      "nextTrigger": "The single next observable fact that would confirm or invalidate this assessment.",
      "riskDirection": "NEGATIVE",
      "materialityScore": 0-100,
      "confidenceScore": 0-100,
      "priorAssessment": "Short prior risk label, omit if unknown",
      "newAssessment": "Short new risk label, omit if unknown",
      "reasoning": "1 sentence on why you scored materiality where you did."
    }
  ]
}
Use EXACTLY the key strings given after key= for each holding.`;

  const result = await callGemini({
    prompt,
    tier: 'quality',
    temperature: 0.2,
    topP: 0.8,
    preferredModel,
  });

  if (!result.ok || !result.text) {
    console.warn('[AnalysisEngine] Batched analysis unavailable:', result.error);
    for (const e of entities) out.set(e.entityId, deterministicAnalysis(e.usable, e.entityName));
    return out;
  }

  try {
    const parsed = JSON.parse(result.text);
    for (const e of entities) {
      const raw = parsed[e.entityId] ?? parsed[e.entityName] ?? [];
      const list = Array.isArray(raw) ? raw : [];
      out.set(
        e.entityId,
        list
          .filter((item: any) => item && item.headline)
          .map((item: any) => mapAnalyzedItem(item, indexed, e.usable))
      );
    }
  } catch (err) {
    console.warn('[AnalysisEngine] Batched analysis parse error:', err);
    for (const e of entities) out.set(e.entityId, deterministicAnalysis(e.usable, e.entityName));
  }

  return out;
}

/** Normalises one model-emitted development into an AnalyzedEvent with real attribution. */
function mapAnalyzedItem(item: any, indexed: EvidenceItem[], fallbackEvidence: EvidenceItem[]): AnalyzedEvent {
  const indices: number[] = Array.isArray(item.sourceIndices) ? item.sourceIndices : [];
  const cited = indices.map((i) => indexed[i - 1]).filter((e): e is EvidenceItem => !!e);
  const sources = (cited.length > 0 ? cited : fallbackEvidence.slice(0, 1)).map(toSource);

  const metrics: MetricDelta[] = Array.isArray(item.metrics)
    ? item.metrics.map((m: any) => {
        const withUnit = (v: unknown) => {
          if (v === undefined || v === null || v === '') return undefined;
          const s = String(v).trim();
          // Models sometimes emit a placeholder for "no prior figure" — that is not a delta
          if (/^(n\/?a|none|null|unknown|-{1,2})$/i.test(s)) return undefined;
          if (!m.unit || /[%$x×]/i.test(s) || /[a-zA-Z]/.test(s)) return s;
          return m.unit === '%' ? `${s}%` : m.unit === 'USD' ? `$${s}` : `${s} ${m.unit}`;
        };
        return {
          metricName: m.metricName,
          previousValue: withUnit(m.previousValue),
          currentValue: withUnit(m.currentValue) ?? String(m.currentValue ?? ''),
          unit: m.unit,
          asOfDate: m.asOfDate,
        };
      })
    : [];

  return {
    isMaterial: true,
    headline: item.headline,
    whatChanged: item.whatChanged || item.headline,
    whyItMatters: item.whyItMatters || '',
    metrics,
    factsEstablished: Array.isArray(item.factsEstablished) ? item.factsEstablished : [],
    openQuestions: Array.isArray(item.openQuestions) ? item.openQuestions : [],
    nextTrigger: item.nextTrigger || '',
    riskDirection: item.riskDirection || 'NEUTRAL',
    materialityScore: typeof item.materialityScore === 'number' ? item.materialityScore : 50,
    confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : 60,
    priorAssessment: item.priorAssessment,
    newAssessment: item.newAssessment,
    reasoning: item.reasoning || '',
    sources,
  };
}

/**
 * Zero-LLM fallback. Deliberately conservative: without a reasoning pass we cannot
 * claim to know what changed, so we surface only high-authority primary-source items
 * and label them honestly rather than fabricating analysis.
 */
function deterministicAnalysis(evidence: EvidenceItem[], entityName: string): AnalyzedEvent[] {
  const primary = evidence.filter(
    (e) => e.sourceTier === 'TIER_1_PRIMARY' || (e.sourceTier === 'TIER_2_JOURNALISM' && e.specificityScore >= 75)
  );
  if (primary.length === 0) return [];

  const best = primary.sort((a, b) => b.specificityScore - a.specificityScore)[0];
  const cleaned = stripBoilerplatePrefix(best.snippet);

  const cause = getAnalysisUnavailableReason();

  return [
    {
      isMaterial: true,
      headline: `${entityName}: disclosure from ${best.originalPublisher || best.publisher}`,
      whatChanged: cleaned.slice(0, 300),
      whyItMatters: `Analyst reasoning did not run because ${cause}. This item is surfaced unanalysed from a primary/high-specificity source for manual review.`,
      metrics: [],
      factsEstablished: [cleaned.slice(0, 240)],
      openQuestions: ['Full analyst interpretation pending — the reasoning engine did not run for this cycle.'],
      nextTrigger: 'Restore the analysis engine to derive a confirmation trigger for this item.',
      riskDirection: 'NEUTRAL',
      materialityScore: 45,
      confidenceScore: best.authorityScore,
      reasoning: 'Deterministic fallback: surfaced on source authority alone, without reasoning.',
      sources: [toSource(best)],
    },
  ];
}
