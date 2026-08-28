/**
 * PulseNews Gemini Client
 *
 * Centralises every Gemini call behind a resilient, self-healing model resolver.
 *
 * Why this exists: model names get retired. Hardcoded ones (e.g. gemini-1.5-pro) start
 * returning 404 and — because every call site had its own try/catch fallback — the whole
 * product silently degraded to template output with no visible error. This module makes
 * that failure mode loud and recoverable: it walks a preference chain, remembers which
 * model actually works, and surfaces a clear diagnostic when none do.
 */

export type ModelTier = 'quality' | 'fast';

/**
 * Models the user can pick in Settings. Ordered cheapest/highest-throughput first, because
 * the default posture is to stay comfortably inside the provider's free tier.
 * Rate limits are the published free-tier allowances and are shown in the UI.
 */
export interface SelectableModel {
  id: string;
  label: string;
  note: string;
  freeTier: boolean;
}

export const SELECTABLE_MODELS: SelectableModel[] = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    note: 'Free · 15 RPM · 250K TPM · 500/day — best free-tier throughput (recommended)',
    freeTier: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    note: 'Free · high throughput · slightly older generation',
    freeTier: true,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    note: 'Free · stronger reasoning · much lower daily limit (~20/day)',
    freeTier: true,
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    note: 'Free · newer generation flash',
    freeTier: true,
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    note: 'Requires billing enabled · deepest analysis',
    freeTier: false,
  },
];

export const DEFAULT_MODEL_ID = 'gemini-3.1-flash-lite';

/**
 * Fallback chains used when no explicit model is selected, or when the selected one is
 * unavailable. Free-tier-friendly models come first so the app does not incur spend or
 * hit `limit: 0` tier walls by default.
 */
const MODEL_CHAINS: Record<ModelTier, string[]> = {
  quality: ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash'],
  fast: ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'],
};

/** Status codes that mean "this model is unusable for us — try the next one". */
const FALLTHROUGH_STATUSES = new Set([404, 429, 503]);

/** Cache of the first model in each chain that actually answered, per process. */
const resolvedModel: Partial<Record<ModelTier, string>> = {};

/**
 * Models proven permanently unavailable to this API key (retired, or not offered on the
 * key's billing tier). Retrying these on every call burns a round-trip each time, so once
 * a permanent signal is seen the model is skipped for the life of the process.
 */
const deadModels = new Set<string>();

/** Diagnostics from the most recent resolution attempt, for surfacing real errors. */
let lastResolutionError: string | null = null;

/**
 * Distinguishes a permanent tier/retirement failure from a transient rate limit.
 * `limit: 0` means the model is not offered on this billing tier at all — unlike a
 * normal 429, waiting will never help.
 */
function isPermanentlyUnavailable(status: number, error: string): boolean {
  if (status === 404) return true;
  if (status === 429 && /limit:\s*0\b/.test(error)) return true;
  return false;
}

export function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

export function getLastGeminiError(): string | null {
  return lastResolutionError;
}

/**
 * A short, user-safe description of why analysis is unavailable.
 * Raw provider errors (multi-line quota dumps with billing URLs) must never reach the UI —
 * they belong in the server log. This collapses them to one actionable sentence.
 */
export function getAnalysisUnavailableReason(): string {
  if (!getApiKey()) return 'no analysis API key is configured';
  const err = lastResolutionError || '';
  if (/quota|rate.?limit|limit:\s*0/i.test(err)) {
    return 'the analysis API quota was exhausted for this cycle';
  }
  if (/not found|404/i.test(err)) return 'the configured analysis model is unavailable';
  if (/timeout|ETIMEDOUT|network/i.test(err)) return 'the analysis service could not be reached';
  return 'the analysis service returned an error';
}

export interface GeminiCallOptions {
  prompt: string;
  tier?: ModelTier;
  temperature?: number;
  topP?: number;
  /** Request strict JSON output. Defaults to true — every caller here parses JSON. */
  json?: boolean;
  /** User-selected model from Settings. Tried first; the tier chain is the fallback. */
  preferredModel?: string;
}

export interface GeminiCallResult {
  ok: boolean;
  text?: string;
  model?: string;
  error?: string;
}

async function attemptModel(model: string, options: GeminiCallOptions, apiKey: string) {
  const { prompt, temperature = 0.3, topP = 0.85, json = true } = options;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          ...(json ? { responseMimeType: 'application/json' } : {}),
          temperature,
          topP,
        },
      }),
    }
  );

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* non-JSON error body */
    }
    return { ok: false as const, status: res.status, error: message };
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { ok: false as const, status: 200, error: 'Empty completion returned' };
  }

  return { ok: true as const, text };
}

/**
 * Calls Gemini, walking the tier's model chain until one succeeds.
 * The winning model is cached so later calls go straight to it.
 */
export async function callGemini(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    lastResolutionError = 'No GEMINI_API_KEY configured';
    return { ok: false, error: lastResolutionError };
  }

  const tier = options.tier || 'quality';

  // An explicit user selection takes precedence over the cached/default chain.
  // Its result is cached under the tier so subsequent calls skip straight to it.
  const preferred = options.preferredModel;
  if (preferred && !deadModels.has(preferred) && resolvedModel[tier] !== preferred) {
    const result = await attemptModel(preferred, options, apiKey);
    if (result.ok) {
      resolvedModel[tier] = preferred;
      lastResolutionError = null;
      return { ok: true, text: result.text, model: preferred };
    }
    if (isPermanentlyUnavailable(result.status, result.error)) {
      deadModels.add(preferred);
      console.warn(`[GeminiClient] Selected model "${preferred}" is unavailable to this key — falling back.`);
    }
  }

  // Fast path: a model already proved itself this process
  const cached = resolvedModel[tier];
  if (cached) {
    let result = await attemptModel(cached, options, apiKey);

    // A transient per-minute rate limit shouldn't lose the cycle — back off once and retry
    // the proven model before falling back to a weaker one.
    if (!result.ok && result.status === 429 && !isPermanentlyUnavailable(result.status, result.error)) {
      await new Promise((r) => setTimeout(r, 6000));
      result = await attemptModel(cached, options, apiKey);
    }

    if (result.ok) return { ok: true, text: result.text, model: cached };

    // Cached model degraded (quota exhausted mid-run, retirement) — re-resolve below
    if (!FALLTHROUGH_STATUSES.has(result.status)) {
      return { ok: false, error: result.error, model: cached };
    }
    if (isPermanentlyUnavailable(result.status, result.error)) deadModels.add(cached);
    delete resolvedModel[tier];
  }

  const errors: string[] = [];
  for (const model of MODEL_CHAINS[tier]) {
    if (model === cached) continue; // already tried above
    if (deadModels.has(model)) continue; // known unavailable to this key

    const result = await attemptModel(model, options, apiKey);

    if (result.ok) {
      resolvedModel[tier] = model;
      lastResolutionError = null;
      return { ok: true, text: result.text, model };
    }

    if (isPermanentlyUnavailable(result.status, result.error)) {
      deadModels.add(model);
      console.warn(`[GeminiClient] Model "${model}" unavailable to this key — skipping from now on.`);
    }

    errors.push(`${model}: ${result.error}`);
    if (!FALLTHROUGH_STATUSES.has(result.status)) {
      // A genuine request error (e.g. malformed prompt) — no point trying other models
      break;
    }
  }

  lastResolutionError = errors.join(' | ');
  console.warn('[GeminiClient] All models failed for tier "' + tier + '": ' + lastResolutionError);
  return { ok: false, error: lastResolutionError };
}

/**
 * Calls Gemini and parses the JSON response.
 * Returns null (never throws) so callers can apply their own fallback.
 */
export async function callGeminiJSON<T = any>(options: GeminiCallOptions): Promise<T | null> {
  const result = await callGemini({ ...options, json: true });
  if (!result.ok || !result.text) return null;
  try {
    return JSON.parse(result.text) as T;
  } catch (e) {
    console.warn('[GeminiClient] JSON parse failed from model ' + result.model);
    return null;
  }
}
