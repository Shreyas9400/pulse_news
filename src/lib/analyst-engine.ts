/**
 * PulseNews Senior Analyst Engine & Delta Briefing Synthesizer
 * Produces institutional delta briefings from versioned state transitions, facts, and cross-portfolio patterns.
 */

import { DailyBriefing, DeltaStoryItem, QuietEntityReport, CrossPortfolioSynthesis } from './types';

/**
 * Generates an institutional-grade Senior Analyst Delta Briefing
 */
export function synthesizeSeniorAnalystBriefing(params: {
  deltaStories: DeltaStoryItem[];
  quietEntities: QuietEntityReport[];
  crossSynthesis: CrossPortfolioSynthesis;
  domain: string;
}): DailyBriefing {
  const { deltaStories, quietEntities, crossSynthesis, domain } = params;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? `EXECUTIVE RESEARCH BRIEFING (MORNING) • ${domain.toUpperCase()}`
      : hour < 18
      ? `EXECUTIVE RESEARCH BRIEFING (MIDDAY) • ${domain.toUpperCase()}`
      : `EXECUTIVE RESEARCH BRIEFING (CLOSE) • ${domain.toUpperCase()}`;

  // 1. Overview Synthesis
  let overview = '';
  if (deltaStories.length === 0) {
    overview = `Portfolio Intelligence Baseline: All monitored assets currently exhibit no material incremental changes since the previous research cycle. Core operational metrics and covenant headroom remain stable across tracked holdings.`;
  } else {
    overview = `Portfolio Delta Analysis: Continuous recursive surveillance identified ${deltaStories.length} material incremental developments across monitored holdings. ${crossSynthesis.summary}`;
  }

  // 2. Key Takeaways derived from actual delta stories
  const keyBulletPoints: string[] = [];
  for (const story of deltaStories.slice(0, 4)) {
    keyBulletPoints.push(`${story.entityName}: ${story.whatChanged} — ${story.portfolioImpact}`);
  }

  if (quietEntities.length > 0) {
    const quietNames = quietEntities.slice(0, 4).map((q) => q.entityName).join(', ');
    keyBulletPoints.push(`Baseline Confirmed (${quietNames}): No material incremental development since prior research cycle.`);
  }

  return {
    date: dateStr,
    greeting,
    overview,
    marketMood: `${crossSynthesis.riskClassification} REGIME: ${crossSynthesis.summary}`,
    topStories: [],
    keyBulletPoints,
    generatedAt: new Date().toISOString(),
    deltaStories,
    quietEntities,
    crossEntitySynthesis: crossSynthesis,
    portfolioDomain: domain,
    stateTransitionsCount: deltaStories.length,
  };
}
