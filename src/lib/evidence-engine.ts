/**
 * PulseNews Evidence & Source Quality Engine
 * Computes multidimensional credibility scores, tracks information lineage, and enforces evidence tiers.
 */

import { EvidenceItem, SourceTier, EvidenceType, SourceLineageNode } from './types';

// Authoritative domain ratings
const PRIMARY_DOMAINS = ['sec.gov', 'investor.', 'treasury.gov', 'federalreserve.gov', 'courtlistener.com', 'fda.gov'];
const TIER2_JOURNALISM_DOMAINS = ['ft.com', 'wsj.com', 'bloomberg.com', 'reuters.com', 'cnbc.com', 'barrons.com', 'institutionalinvestor.com'];
const TIER3_MARKET_DOMAINS = ['finance.yahoo.com', 'investing.com', 'morningstar.com', 'seekingalpha.com', 'marketwatch.com', 'spglobal.com', 'moodys.com', 'fitchratings.com'];
const TIER4_ALT_DOMAINS = ['linkedin.com', 'twitter.com', 'x.com', 'reddit.com', 'medium.com', 'substack.com'];

// Known syndication parents
const WIRE_SYNDICATORS = ['reuters', 'associated press', 'ap news', 'bloomberg wire', 'dow jones newswires', 'prnewswire', 'businesswire', 'globe newswire'];

/**
 * Detects source tier based on domain or publisher name
 */
export function detectSourceTier(url: string, publisher: string): SourceTier {
  const u = url.toLowerCase();
  const p = publisher.toLowerCase();

  if (PRIMARY_DOMAINS.some((d) => u.includes(d) || p.includes(d))) return 'TIER_1_PRIMARY';
  if (TIER2_JOURNALISM_DOMAINS.some((d) => u.includes(d) || p.includes(d))) return 'TIER_2_JOURNALISM';
  if (TIER3_MARKET_DOMAINS.some((d) => u.includes(d) || p.includes(d))) return 'TIER_3_MARKET';
  if (TIER4_ALT_DOMAINS.some((d) => u.includes(d) || p.includes(d))) return 'TIER_4_ALTERNATIVE';

  return 'TIER_3_MARKET';
}

/**
 * Scores source authority from 0 to 100
 */
export function scoreEvidenceAuthority(tier: SourceTier, publisher: string): number {
  const p = publisher.toLowerCase();
  if (tier === 'TIER_1_PRIMARY') return 98;
  if (tier === 'TIER_2_JOURNALISM') {
    if (p.includes('reuters') || p.includes('bloomberg') || p.includes('wsj') || p.includes('ft.com')) return 92;
    return 85;
  }
  if (tier === 'TIER_3_MARKET') return 70;
  return 45; // Tier 4
}

/**
 * Calculates directness score: is this primary reporting or commentary?
 */
export function scoreDirectness(tier: SourceTier, text: string): number {
  if (tier === 'TIER_1_PRIMARY') return 95;
  const lower = text.toLowerCase();
  if (lower.includes('according to a filing') || lower.includes('in an official statement') || lower.includes('reported in regulatory form')) {
    return 85;
  }
  if (lower.includes('sources familiar') || lower.includes('analysts speculate') || lower.includes('opinion')) {
    return 40;
  }
  return 70;
}

/**
 * Calculates recency score based on published date
 */
export function scoreRecency(publishedAt: string): number {
  try {
    const pubTime = new Date(publishedAt).getTime();
    const now = Date.now();
    const ageHours = (now - pubTime) / (1000 * 60 * 60);

    if (ageHours <= 6) return 98;
    if (ageHours <= 24) return 90;
    if (ageHours <= 72) return 80;
    if (ageHours <= 168) return 65; // 7 days
    return 40;
  } catch {
    return 60;
  }
}

/**
 * Calculates specificity score: does the text contain numbers, dates, or specific names?
 */
export function scoreSpecificity(text: string): number {
  let score = 50;
  // Has percentages or dollar signs
  if (/\b\d+(\.\d+)?%|\$\d+(\.\d+)?\b/.test(text)) score += 25;
  // Has dates or quarters
  if (/\b(Q[1-4]|202[4-7]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(text)) score += 15;
  // Length check
  if (text.length > 100) score += 10;
  return Math.min(score, 100);
}

/**
 * Detects syndication lineage and computes independence score
 */
export function detectSyndicationLineage(url: string, text: string, publisher: string): { lineage: string[]; independence: number; originalPublisher?: string } {
  const p = publisher.toLowerCase();
  const t = text.toLowerCase();

  for (const wire of WIRE_SYNDICATORS) {
    if ((t.includes(wire) || p.includes(wire)) && !p.includes(wire.replace(' ', ''))) {
      return {
        lineage: [wire.toUpperCase(), publisher],
        independence: 35, // Syndicated copy: not an independent verification
        originalPublisher: wire.toUpperCase(),
      };
    }
  }

  return {
    lineage: [publisher],
    independence: 90, // Direct independent source
    originalPublisher: publisher,
  };
}

/**
 * Classifies evidence item into fact vs inference vs signal
 */
export function classifyEvidenceType(tier: SourceTier, text: string, authority: number): EvidenceType {
  if (tier === 'TIER_1_PRIMARY') return 'PRIMARY_FACT';
  if (authority >= 85 && /\b(reported|stated|filed|confirmed|announced)\b/i.test(text)) return 'SECONDARY_CONFIRMATION';
  if (/\b(may|could|suggests|indicates|implies|likely|expected to)\b/i.test(text)) return 'ANALYST_INFERENCE';
  if (tier === 'TIER_4_ALTERNATIVE') return 'EMERGING_SIGNAL';
  if (/\b(rumor|speculates|unconfirmed|sources say)\b/i.test(text)) return 'SPECULATION';
  return 'SECONDARY_CONFIRMATION';
}

/**
 * Builds a fully qualified EvidenceItem with multidimensional scoring
 */
export function buildEvidenceItem(params: {
  sourceUrl: string;
  sourceName: string;
  snippet: string;
  publishedAt?: string;
  publisher: string;
  sourceTier?: SourceTier;
  evidenceType?: EvidenceType;
  entityId?: string;
}): EvidenceItem {
  const pubDate = params.publishedAt || new Date().toISOString();
  const tier = params.sourceTier || detectSourceTier(params.sourceUrl, params.publisher);
  const authorityScore = scoreEvidenceAuthority(tier, params.publisher);
  const directnessScore = scoreDirectness(tier, params.snippet);
  const recencyScore = scoreRecency(pubDate);
  const specificityScore = scoreSpecificity(params.snippet);
  const { lineage, independence, originalPublisher } = detectSyndicationLineage(params.sourceUrl, params.snippet, params.publisher);
  const evidenceType = params.evidenceType || classifyEvidenceType(tier, params.snippet, authorityScore);

  // Extract simple atomic facts
  const facts = params.snippet
    .split(/\. |\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !s.includes('http'));

  const id = `ev_${Buffer.from(params.sourceUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}_${Date.now().toString(36)}`;

  return {
    id,
    sourceUrl: params.sourceUrl,
    sourceName: params.sourceName,
    sourceTier: tier,
    publisher: params.publisher,
    originalPublisher,
    syndicationLineage: lineage,
    publishedAt: pubDate,
    retrievedAt: new Date().toISOString(),
    snippet: params.snippet.slice(0, 500),
    authorityScore,
    directnessScore,
    recencyScore,
    specificityScore,
    independenceScore: independence,
    evidenceType,
    extractedFacts: facts.slice(0, 3),
  };
}
