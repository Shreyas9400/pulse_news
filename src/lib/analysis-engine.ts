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

const GEMINI_MODEL = 'gemini-1.5-pro';

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

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return deterministicAnalysis(usable.map((u) => u.ev), entityName);
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

Return strict JSON — an array of the genuine developments found (empty array if none are material):
[
  {
    "isMaterial": true,
    "sourceIndices": [1, 3],
    "headline": "Specific development in under 10 words — the event, not the article title",
    "whatChanged": "1-2 sentences stating exactly what changed versus the prior known state, with the specific figures from the sources.",
    "whyItMatters": "1-2 sentences on the actual credit/liquidity/valuation implication for a holder. Be concrete about the mechanism.",
    "metrics": [
      { "metricName": "Non-Accrual Rate", "previousValue": "1.4%", "currentValue": "3.2%", "unit": "%", "asOfDate": "Q2 2026" }
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
Set "metrics" to [] if no quantitative deltas appear in the sources. Only include a metric when the figure is explicitly in the source material.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2, topP: 0.8 },
        }),
      }
    );

    if (!res.ok) {
      console.warn('[AnalysisEngine] Gemini call failed:', res.status);
      return deterministicAnalysis(usable.map((u) => u.ev), entityName);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return deterministicAnalysis(usable.map((u) => u.ev), entityName);

    const parsed = JSON.parse(rawText);
    const list = Array.isArray(parsed) ? parsed : parsed.events || [];

    return list
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
            ? item.metrics.map((m: any) => ({
                metricName: m.metricName,
                previousValue: m.previousValue,
                currentValue: m.currentValue,
                unit: m.unit,
                asOfDate: m.asOfDate,
              }))
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
  } catch (e) {
    console.warn('[AnalysisEngine] Analysis error, using deterministic fallback:', e);
    return deterministicAnalysis(usable.map((u) => u.ev), entityName);
  }
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

  return [
    {
      isMaterial: true,
      headline: `${entityName}: disclosure from ${best.originalPublisher || best.publisher}`,
      whatChanged: cleaned.slice(0, 300),
      whyItMatters:
        'Automated reasoning is unavailable (no analysis API key configured), so this item is surfaced unanalysed from a primary/high-specificity source for manual review.',
      metrics: [],
      factsEstablished: [cleaned.slice(0, 240)],
      openQuestions: ['Full analyst interpretation pending — configure an analysis API key to enable reasoning.'],
      nextTrigger: 'Enable the analysis engine to derive a confirmation trigger for this item.',
      riskDirection: 'NEUTRAL',
      materialityScore: 45,
      confidenceScore: best.authorityScore,
      reasoning: 'Deterministic fallback: surfaced on source authority alone, without reasoning.',
      sources: [toSource(best)],
    },
  ];
}
