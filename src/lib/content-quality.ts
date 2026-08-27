/**
 * PulseNews Content Quality Gate
 * Rejects boilerplate, paywall notices, navigation chrome, and raw table dumps before
 * they can enter the evidence graph and masquerade as analysable intelligence.
 *
 * This runs BEFORE any LLM analysis so we never spend tokens reasoning about, or
 * surface to the user, text that carries no informational content.
 */

/** Phrases that mark a snippet as legal/paywall/subscription boilerplate rather than reporting. */
const BOILERPLATE_MARKERS = [
  'this copy is for your personal',
  'non-commercial use only',
  'distribution and use of this material are governed by',
  'subscriber agreement',
  'dow jones reprints',
  'djreprints.com',
  'all rights reserved',
  'terms of service',
  'privacy policy',
  'cookie policy',
  'we use cookies',
  'accept all cookies',
  'enable javascript',
  'please enable',
  'your browser is not supported',
  'sign in to continue',
  'subscribe to read',
  'create a free account',
  'to order multiple copies',
  'for non-personal use',
  'advertisement',
  'skip to main content',
  'javascript is disabled',
];

/** Phrases indicating the snippet is a site directory / index listing, not a development. */
const INDEX_PAGE_MARKERS = [
  'form type',
  'form group',
  'accession',
  's.no.',
  'view and download',
  'filings including',
  'category:',
  'financial indicators tracked',
  'key indicators highlighted',
];

export interface ContentQualityVerdict {
  usable: boolean;
  score: number; // 0 - 100
  reason?: string;
}

/**
 * Strips leading boilerplate (paywall notices, ad markers) from an otherwise usable
 * snippet, so real reporting that trails behind a legal preamble is still usable.
 */
export function stripBoilerplatePrefix(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // Remove common leading advertisement / reprint preambles up to the first real headline marker
  const reprintPattern =
    /^.*?(?:djreprints\.com|dow jones reprints at [\d-]+|all rights reserved\.?|advertisement)\s*[.·|-]*\s*/is;
  if (reprintPattern.test(cleaned) && cleaned.length > 200) {
    cleaned = cleaned.replace(reprintPattern, '');
  }

  // Markdown headings often survive scraping — keep their text but drop the hashes
  cleaned = cleaned.replace(/#{1,6}\s*/g, '');

  return cleaned.trim();
}

/**
 * Fraction of the text made up of table-pipe / separator characters. Scraped SEC filing
 * indexes and financial tables come through as long pipe-delimited runs with no prose.
 */
function tableNoiseRatio(text: string): number {
  if (!text) return 0;
  const noiseChars = (text.match(/[|\-—–_]/g) || []).length;
  return noiseChars / text.length;
}

/** Fraction of characters that are digits — very high implies a raw numeric table dump. */
function digitRatio(text: string): number {
  if (!text) return 0;
  const digits = (text.match(/\d/g) || []).length;
  return digits / text.length;
}

/** Counts sentence-like units — real reporting has sentence structure, tables do not. */
function sentenceCount(text: string): number {
  return (text.match(/[.!?](\s|$)/g) || []).length;
}

/**
 * Evaluates whether a scraped snippet carries genuine informational content.
 * Returns a usability verdict plus a 0-100 quality score used downstream for ranking.
 */
export function assessContentQuality(rawText: string): ContentQualityVerdict {
  const text = stripBoilerplatePrefix(rawText || '');

  if (!text || text.trim().length < 60) {
    return { usable: false, score: 0, reason: 'TOO_SHORT' };
  }

  const lower = text.toLowerCase();

  // 1. Hard reject: dominated by legal/paywall boilerplate
  const boilerplateHits = BOILERPLATE_MARKERS.filter((m) => lower.includes(m)).length;
  if (boilerplateHits >= 2) {
    return { usable: false, score: 0, reason: 'PAYWALL_BOILERPLATE' };
  }

  // 2. Hard reject: site index / filing directory listings
  const indexHits = INDEX_PAGE_MARKERS.filter((m) => lower.includes(m)).length;
  if (indexHits >= 2) {
    return { usable: false, score: 0, reason: 'INDEX_LISTING' };
  }

  // 3. Hard reject: raw table dumps (pipe-heavy or digit-heavy with no prose)
  if (tableNoiseRatio(text) > 0.08 && sentenceCount(text) < 2) {
    return { usable: false, score: 0, reason: 'TABLE_DUMP' };
  }
  if (digitRatio(text) > 0.3 && sentenceCount(text) < 2) {
    return { usable: false, score: 0, reason: 'NUMERIC_DUMP' };
  }

  // 4. Hard reject: no sentence structure at all
  if (sentenceCount(text) === 0 && text.length < 200) {
    return { usable: false, score: 0, reason: 'NO_PROSE' };
  }

  // 5. Score the remainder on informational density
  let score = 50;
  if (/\b\d+(\.\d+)?%/.test(text)) score += 15; // percentages
  if (/\$\s?\d/.test(text)) score += 10; // dollar figures
  if (/\b(Q[1-4]\s?20\d{2}|20\d{2})\b/.test(text)) score += 10; // period references
  if (sentenceCount(text) >= 3) score += 10;
  if (text.length > 300) score += 5;
  if (boilerplateHits === 1) score -= 20; // trace boilerplate still present

  score = Math.max(0, Math.min(100, score));

  return { usable: score >= 35, score, reason: score >= 35 ? undefined : 'LOW_DENSITY' };
}

/** Convenience filter preserving only snippets that clear the quality gate. */
export function filterUsableSnippets<T>(items: T[], getText: (item: T) => string): T[] {
  return items.filter((item) => assessContentQuality(getText(item)).usable);
}
