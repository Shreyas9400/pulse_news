/**
 * PulseNews Dynamic 3-Level Expertise Engine
 * Ingests arbitrary user portfolios and generates dynamic domain taxonomy, exposure maps, and tailored research prompts.
 */

import { PortfolioIntelligenceProfile, SourceTier } from './types';
import { resolveCanonicalEntity } from './entity-resolver';

// In-Memory Profile Cache
const PROFILE_CACHE = new Map<string, PortfolioIntelligenceProfile>();

/**
 * Builds or retrieves a 3-Level Portfolio Intelligence Profile for an arbitrary portfolio
 */
export async function getPortfolioIntelligenceProfile(
  portfolioId: string,
  entitySymbols: string[]
): Promise<PortfolioIntelligenceProfile> {
  const cacheKey = `profile_${portfolioId}_${entitySymbols.sort().join('_')}`;
  if (PROFILE_CACHE.has(cacheKey)) {
    return PROFILE_CACHE.get(cacheKey)!;
  }

  // 1. Resolve all canonical entities
  const canonicalEntities = entitySymbols.map((s) => resolveCanonicalEntity(s));
  const domainsCount: Record<string, number> = {};

  canonicalEntities.forEach((e) => {
    const d = e.domainHint || 'equities_markets';
    domainsCount[d] = (domainsCount[d] || 0) + 1;
  });

  // Determine primary domain by frequency
  let primaryDomain = 'equities_markets';
  let maxCount = 0;
  for (const [d, count] of Object.entries(domainsCount)) {
    if (count > maxCount) {
      maxCount = count;
      primaryDomain = d;
    }
  }

  // 2. Generate Domain-Specific Levels
  let subdomains: string[] = [];
  let keyMetrics: string[] = [];
  let riskTaxonomy: string[] = [];
  let level1DomainKnowledge = '';
  let customQuestions: string[] = [];
  let dynamicAnalystPrompt = '';

  if (primaryDomain === 'private_credit') {
    subdomains = ['BDCs', 'Evergreen Interval Funds', 'Direct Lending', 'Senior Secured First Lien', 'Middle-Market Credit'];
    keyMetrics = ['Net Asset Value (NAV)', 'Non-Accrual Rate', 'PIK Income %', 'Net Investment Income (NII) Coverage', 'Quarterly Redemption / Tender Capacity', 'Leverage (Debt-to-Equity)'];
    riskTaxonomy = ['Liquidity Mismatch & Redemption Pressures', 'Borrower Credit Quality Migration', 'Refinancing Walls & Base Rate Sensitivity', 'Valuation & Fair-Value Markdowns', 'Sponsor Support Deterioration'];
    level1DomainKnowledge = 'Private Credit & Direct Lending: Focus on debt serviceability, middle-market borrower cash flows, BDC asset quality, interval fund redemption gating, and non-accrual trends.';
    customQuestions = [
      'Are quarterly redemption requests increasing relative to repurchase limits?',
      'Have non-accrual investments increased as a % of total portfolio fair value?',
      'Is dividend coverage from Net Investment Income (NII) compressing under declining base rates?',
      'Are valuation marks experiencing fair-value write-downs?',
    ];
    dynamicAnalystPrompt = `You are a Senior Institutional Private Credit & Direct Lending Research Strategist.
Evaluate assets on cash flow coverage, debt serviceability, redemption gating, portfolio non-accruals, and sponsor equity cushion.`;
  } else if (primaryDomain === 'tech_semiconductors') {
    subdomains = ['GPU Accelerators', 'Custom Silicon (ASICs)', 'Foundry Capacity', 'Hyperscaler Capex', 'High-Bandwidth Memory (HBM)', 'Enterprise AI Software'];
    keyMetrics = ['Data Center Revenue Growth', 'Gross Margin %', 'Hyperscaler Cloud Capex Commitments', 'Foundry Wafer Lead Times', 'Supply Chain CoWoS Allocation'];
    riskTaxonomy = ['Hyperscaler Capex Digestion', 'Semiconductor Export Restrictions', 'Foundry Packaging Bottlenecks', 'Competitive ASIC Substitution', 'Customer Concentration'];
    level1DomainKnowledge = 'Semiconductors & AI Infrastructure: Focus on hyperscaler cloud capex, GPU compute demand, memory pricing cycles, silicon foundry capacity, and enterprise inference adoption.';
    customQuestions = [
      'Are hyperscaler capital expenditure projections for AI infrastructure accelerating or plateauing?',
      'Are advanced packaging (CoWoS/HBM) supply constraints easing across leading foundries?',
      'Are custom ASIC silicon alternatives displacing standard merchant accelerator GPUs?',
    ];
    dynamicAnalystPrompt = `You are a Senior Semiconductor & AI Hardware Technology Research Analyst.
Evaluate assets on silicon architecture demand, hyperscaler capex cycles, foundry yields, gross margins, and competitive moat sustainability.`;
  } else if (primaryDomain === 'automotive_ev') {
    subdomains = ['Electric Vehicles (EV)', 'Battery Supply Chain', 'Commercial Fleets', 'Automotive Credit', 'Autonomous Systems'];
    keyMetrics = ['Vehicle Delivery Volumes', 'Automotive Gross Margins (ex-regulatory credits)', 'Battery Cell Cost per kWh', 'Dealership Inventory Days', 'Auto Loan Delinquencies'];
    riskTaxonomy = ['EV Price Deflation', 'Raw Material & Lithium Volatility', 'Financing Costs & Consumer Affordability', 'Tariff & Trade Barriers'];
    level1DomainKnowledge = 'Automotive & Mobility: Focus on EV adoption curves, battery supply costs, financing affordability, unit margins, and trade policies.';
    customQuestions = [
      'How are unit vehicle deliveries and average selling prices (ASP) trending?',
      'Is consumer auto financing demand impacting order backlogs?',
    ];
    dynamicAnalystPrompt = `You are a Senior Automotive & Mobility Research Analyst.
Evaluate assets on delivery volumes, unit margins, supply chain localization, and consumer credit health.`;
  } else {
    // Sector-agnostic / Equities / Macro
    subdomains = ['Corporate Earnings', 'Balance Sheet Liquidity', 'Free Cash Flow', 'Valuation Multiples', 'Macro Policy'];
    keyMetrics = ['Operating Cash Flow', 'Operating Margin %', 'Debt / EBITDA', 'Forward P/E Multiple', 'Revenue Growth'];
    riskTaxonomy = ['Macroeconomic Demand Softening', 'Margin Compression', 'Refinancing & Cost of Capital', 'Competitive Disruption'];
    level1DomainKnowledge = 'Cross-Asset Institutional Research: Evaluating fundamental performance, capital allocation, cash flow durability, and macro catalysts.';
    customQuestions = [
      'What are the primary catalysts driving recent operating performance?',
      'Are capital allocation and liquidity buffers adequate against macro headwinds?',
    ];
    dynamicAnalystPrompt = `You are a Senior Cross-Asset Institutional Equity & Research Strategist.
Evaluate fundamental durability, valuation margins, and strategic catalysts.`;
  }

  // 3. Level 2: Portfolio Exposure Mapping & Risk Propagation Paths
  const directExposure = canonicalEntities.map((e) => e.canonicalName);
  const indirectExposure: string[] = [];
  const riskPropagationPaths: Array<{ fromEntity: string; toEntity: string; mechanism: string }> = [];

  for (const ent of canonicalEntities) {
    for (const rel of ent.relationships) {
      indirectExposure.push(`${rel.relationshipType} -> ${rel.targetEntityId}`);
      riskPropagationPaths.push({
        fromEntity: ent.id,
        toEntity: rel.targetEntityId,
        mechanism: `${rel.relationshipType} (${rel.notes || 'Structural Exposure'})`,
      });
    }
  }

  // 4. Source Tier Hierarchy
  const sourceHierarchy = [
    { tier: 'TIER_1_PRIMARY' as SourceTier, priorityDomains: ['sec.gov', 'investor relations', 'regulatory wire'], notes: 'Authoritative financial filings and disclosures' },
    { tier: 'TIER_2_JOURNALISM' as SourceTier, priorityDomains: ['wsj.com', 'ft.com', 'bloomberg.com', 'reuters.com'], notes: 'Institutional financial press' },
    { tier: 'TIER_3_MARKET' as SourceTier, priorityDomains: ['finance.yahoo.com', 'spglobal.com', 'morningstar.com'], notes: 'Market data and credit rating releases' },
    { tier: 'TIER_4_ALTERNATIVE' as SourceTier, priorityDomains: ['linkedin.com', 'industry blogs'], notes: 'Emerging executive commentary and transcripts' },
  ];

  const profile: PortfolioIntelligenceProfile = {
    portfolioId,
    entityIds: canonicalEntities.map((e) => e.id),
    primaryDomain,
    subdomains,
    inferredThemes: subdomains.slice(0, 3),
    level1DomainKnowledge,
    level2PortfolioExposure: {
      directExposure,
      indirectExposure: Array.from(new Set(indirectExposure)),
      sectorConcentration: [primaryDomain.toUpperCase()],
      riskPropagationPaths,
    },
    level3ActiveContext: {
      activeResearchQuestions: customQuestions,
      unresolvedHypotheses: [],
    },
    keyMetricsToMonitor: keyMetrics,
    riskTaxonomy,
    sourceHierarchy,
    dynamicAnalystPrompt,
    monitoringRules: [
      { ruleName: 'Material Delta Threshold', triggerCondition: 'Materiality >= 75 or metric change >= 2.5%', priority: 'CRITICAL' },
      { ruleName: 'Contradiction Alert', triggerCondition: 'Conflicting source values on primary metrics', priority: 'HIGH' },
    ],
    candidateConceptsProposed: [],
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  PROFILE_CACHE.set(cacheKey, profile);
  return profile;
}
