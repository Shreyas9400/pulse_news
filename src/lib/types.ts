/**
 * PulseNews Recursive Intelligence Platform — Canonical Data Contracts & Epistemic Types
 */

// ============================================================================
// 1. Core Stock & Ingestion Types (Preserved for compatibility)
// ============================================================================

export interface StockQuote {
  symbol: string;
  shortName: string;
  price: number;
  formattedPrice: string;
  change: number;
  changePercent: number;
  formattedChange: string;
  isPositive: boolean;
  currency: string;
  high?: number;
  low?: number;
  volume?: string;
  sparkline?: number[];
}

export type StockTickerItem = StockQuote;

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  contentSnippet?: string;
  content?: string;
  source: string;
  sourceIcon?: string;
  publishedAt: string;
  timestamp: number;
  category: string;
  imageUrl?: string;
  author?: string;
  isSaved?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  materiality?: 'HIGH' | 'MEDIUM' | 'LOW';
  creditContext?: string;
  relevanceScore?: number;
  summaryBullets?: string[];
  stockTicker?: {
    symbol: string;
    change?: string;
  };
}

export interface DailyBriefing {
  date: string;
  greeting: string;
  overview: string;
  marketMood: string;
  topStories: NewsArticle[];
  keyBulletPoints: string[];
  generatedAt: string;
  // Advanced Delta Report fields
  deltaStories?: DeltaStoryItem[];
  quietEntities?: QuietEntityReport[];
  crossEntitySynthesis?: CrossPortfolioSynthesis;
  portfolioDomain?: string;
  stateTransitionsCount?: number;
}

export interface DeltaStoryItem {
  id: string;
  title: string;
  entityId: string;
  entityName: string;
  whatChanged: string;
  whyItMatters: string;
  portfolioImpact: string;
  confidenceScore: number;
  materialityScore: number;
  riskDirection: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
  facts: EpistemicClaim[];
  inferences: string[];
  whatWouldChangeOurView: string;
  primarySourcesCount: number;
  totalSourcesCount: number;
  researchRunId?: string;
}

export interface QuietEntityReport {
  entityId: string;
  entityName: string;
  status: 'NO_MATERIAL_CHANGE' | 'MONITORING_ACTIVE' | 'BASELINE_STABLE';
  lastKnownState: string;
  activeWatchpoints: string[];
  lastAssessedAt: string;
}

export type CategoryId =
  | 'brief'
  | 'portfolio'
  | 'all'
  | 'markets'
  | 'saved';

export interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: string;
  badge?: string;
}

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

// ============================================================================
// 2. Canonical Entity & Relationship Models
// ============================================================================

export type EntityType =
  | 'PUBLIC_COMPANY'
  | 'PRIVATE_COMPANY'
  | 'FUND'
  | 'SECTOR'
  | 'MACRO_THEME'
  | 'COMMODITY'
  | 'PERSON'
  | 'CUSTOM_TOPIC';

export interface EntityRelationship {
  targetEntityId: string;
  relationshipType:
    | 'OWNS'
    | 'MANAGES'
    | 'LENDS_TO'
    | 'INVESTED_IN'
    | 'SUBSIDIARY_OF'
    | 'COMPETITOR_OF'
    | 'SECTOR_OF'
    | 'EXPOSED_TO'
    | 'AFFECTED_BY'
    | 'RELATED_TO';
  confidence: number; // 0 - 100
  notes?: string;
}

export interface CanonicalEntity {
  id: string; // e.g. "ENT_BCSF", "ENT_NVDA", "ENT_CCLFX"
  canonicalName: string;
  primaryTicker?: string;
  cik?: string;
  aliases: string[];
  entityType: EntityType;
  parentEntityId?: string;
  relationships: EntityRelationship[];
  domainHint?: string;
  industry?: string;
  description?: string;
}

// ============================================================================
// 3. Epistemic Types & Source Quality Graph
// ============================================================================

export type EpistemicType =
  | 'OBSERVED_FACT'        // Directly supported by an official filing or primary source
  | 'DERIVED_FACT'         // Mathematically/logically calculated difference (e.g. +3pp QoQ)
  | 'SUPPORTED_INFERENCE'  // High confidence analytical deduction with evidence
  | 'HYPOTHESIS'           // Plausible explanation requiring recursive testing
  | 'EMERGING_SIGNAL'      // Interesting but unconfirmed pattern
  | 'UNRESOLVED'           // Conflicting or missing evidence
  | 'REJECTED';            // Disproven by contrary evidence

export interface EpistemicClaim {
  id: string;
  entityId: string;
  type: EpistemicType;
  statement: string;
  supportingEvidenceIds: string[];
  refutingEvidenceIds?: string[];
  confidence: number; // 0 - 100
  asOfDate?: string;
  provenance: string; // e.g. "SEC EDGAR Form 10-Q Item 1" or "Reuters investigation"
}

export type SourceTier =
  | 'TIER_1_PRIMARY'     // SEC, IR, official filings, regulatory, court records
  | 'TIER_2_JOURNALISM'  // FT, WSJ, Bloomberg, Reuters, CNBC, Barron's
  | 'TIER_3_MARKET'      // Yahoo Finance, Investing.com, Morningstar, Seeking Alpha
  | 'TIER_4_ALTERNATIVE';// LinkedIn, conference transcripts, specialist blogs

export type EvidenceType =
  | 'PRIMARY_FACT'
  | 'SECONDARY_CONFIRMATION'
  | 'ANALYST_INFERENCE'
  | 'EMERGING_SIGNAL'
  | 'SPECULATION';

export interface EvidenceItem {
  id: string;
  eventId?: string;
  sourceUrl: string;
  sourceName: string;
  sourceTier: SourceTier;
  publisher: string;
  originalPublisher?: string;
  syndicationLineage: string[]; // e.g. ["Reuters", "Yahoo Finance"]
  publishedAt: string;
  retrievedAt: string;
  snippet: string;
  rawContent?: string;
  authorityScore: number;     // 0 - 100
  directnessScore: number;    // 0 - 100
  recencyScore: number;       // 0 - 100
  specificityScore: number;   // 0 - 100
  independenceScore: number;  // 0 - 100 (accounts for syndicated re-posts)
  evidenceType: EvidenceType;
  extractedFacts: string[];
}

export interface SourceLineageNode {
  sourceId: string;
  url: string;
  publisher: string;
  rootPublisher?: string;
  syndicatedTo: string[];
  referencedBy: string[];
  independenceScore: number;
}

export interface EvidenceConflict {
  conflictId: string;
  entityId: string;
  claims: Array<{
    claimText: string;
    evidenceId: string;
    sourceName: string;
    publishedDate: string;
  }>;
  conflictType:
    | 'DATE'
    | 'DEFINITION'
    | 'VALUE'
    | 'SCOPE'
    | 'PRELIMINARY_FINAL'
    | 'ENTITY'
    | 'INTERPRETATION';
  resolutionStatus: 'UNRESOLVED' | 'RESOLVED' | 'PARTIALLY_RESOLVED';
  resolutionExplanation?: string;
  resolvedByTaskId?: string;
}

// ============================================================================
// 4. Canonical Event Intelligence Model & Lifecycle
// ============================================================================

export type EventLifecycleState =
  | 'DETECTED'
  | 'RESEARCHING'
  | 'EVIDENCE_ACCUMULATING'
  | 'VALIDATED'
  | 'MATERIAL'
  | 'REPORTED'
  | 'MONITORED'
  | 'RESOLVED_SUPERSEDED';

export interface MaterialityAssessment {
  materialityScore: number; // 0 - 100
  confidenceScore: number;  // 0 - 100
  riskDirection: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
  reasoning: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  factors: {
    changeMagnitude: number;
    financialImpact: number;
    portfolioExposure: number;
    liquidityImpact: number;
    valuationImpact: number;
    strategicImportance: number;
    systemicRelevance: number;
    novelty: number;
    sourceConfidence: number;
  };
}

export interface MetricDelta {
  metricName: string;
  previousValue?: string | number;
  currentValue: string | number;
  delta?: string | number;
  unit?: string;
  asOfDate?: string;
}

export interface EventSourceRef {
  url: string;
  publisher: string;
  title: string;
  publishedAt: string;
  tier: string;
}

export interface CanonicalIntelligenceEvent {
  eventId: string;
  canonicalEntityId: string;
  portfolioIds: string[];
  eventType: string; // e.g. "REDEMPTION_CHANGE", "EARNINGS_CAPEX_SURGE", "NON_ACCRUAL_INCREASE"
  title: string;
  summary: string;
  /** Resolved, clickable source attribution for every claim in this event. */
  sources: EventSourceRef[];
  /** The next observable fact that would confirm or invalidate the current assessment. */
  nextTrigger?: string;
  lifecycleState: EventLifecycleState;
  firstSeenAt: string;
  lastEvidenceAt: string;
  eventDate?: string;
  facts: EpistemicClaim[];
  metrics: MetricDelta[];
  evidenceIds: string[];
  previousStateSnapshot?: Record<string, any>;
  currentStateSnapshot?: Record<string, any>;
  materiality: MaterialityAssessment;
  confidenceScore: number;
  implications: string[];
  openQuestions: string[];
  relatedEventIds: string[];
  changeInView?: {
    priorAssessment: string;
    newAssessment: string;
    magnitude: 'LOW' | 'MEDIUM' | 'HIGH';
    triggerEventIds: string[];
    rationale: string;
  };
  adversarialCheck?: {
    counterHypothesis: string;
    vulnerabilitiesIdentified: string[];
    robustnessScore: number;
    passed: boolean;
  };
}

// ============================================================================
// 5. Versioned Knowledge State & Memory
// ============================================================================

export interface StateTransition {
  timestamp: string;
  fromState: string;
  toState: string;
  triggerEventId: string;
  reasoning: string;
  version: number;
}

export interface EntityKnowledgeState {
  entityId: string;
  version: number;
  lastUpdated: string;
  lastResearchRunId?: string;
  currentBeliefs: {
    statusSummary: string;
    operationalHealth: 'STRONG' | 'STABLE' | 'WATCH' | 'STRESSED' | 'CRITICAL';
    keyMetrics: Record<string, { value: any; asOf: string; source: string }>;
    activeRisks: string[];
    activeCatalysts: string[];
    monitoringQuestions: string[];
  };
  historicalTransitions: StateTransition[];
  openHypotheses: Array<{
    id: string;
    hypothesis: string;
    supportingEvidence: string[];
    contradictingEvidence: string[];
    confidence: number;
    status: HypothesisStatus;
  }>;
}

// ============================================================================
// 6. Dynamic Expertise & Portfolio Intelligence Profile
// ============================================================================

export interface PortfolioIntelligenceProfile {
  portfolioId: string;
  entityIds: string[];
  primaryDomain: string; // e.g. "private_credit", "tech_semiconductors", "indian_automotive", "macroeconomics"
  subdomains: string[];
  inferredThemes: string[];
  level1DomainKnowledge: string;
  level2PortfolioExposure: {
    directExposure: string[];
    indirectExposure: string[];
    sectorConcentration: string[];
    riskPropagationPaths: Array<{ fromEntity: string; toEntity: string; mechanism: string }>;
  };
  level3ActiveContext: {
    activeResearchQuestions: string[];
    unresolvedHypotheses: string[];
  };
  keyMetricsToMonitor: string[];
  riskTaxonomy: string[];
  sourceHierarchy: Array<{
    tier: SourceTier;
    priorityDomains: string[];
    notes: string;
  }>;
  dynamicAnalystPrompt: string;
  monitoringRules: Array<{
    ruleName: string;
    triggerCondition: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }>;
  candidateConceptsProposed: string[];
  version: number;
  updatedAt: string;
}

// ============================================================================
// 7. Research Tasks, Hypotheses & Blackboard
// ============================================================================

export type HypothesisStatus =
  | 'UNTESTED'
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'WEAKENED'
  | 'REJECTED'
  | 'INCONCLUSIVE';

export interface CompetingHypothesis {
  id: string;
  statement: string;
  competingWith?: string[];
  status: HypothesisStatus;
  evidenceFor: string[];
  evidenceAgainst: string[];
  confidence: number;
  testTasksCreated: string[];
}

export type ResearchTaskType =
  | 'DISCOVERY'
  | 'PRIMARY_SOURCE'
  | 'FINANCIAL'
  | 'CREDIT'
  | 'MARKET'
  | 'ALTERNATIVE_SIGNAL'
  | 'CONTRADICTION'
  | 'HYPOTHESIS_TEST'
  | 'ADVERSARIAL'
  | 'CROSS_ENTITY';

export interface ResearchTask {
  taskId: string;
  runId: string;
  parentTaskId?: string;
  branchId?: string;
  taskType: ResearchTaskType;
  entityId: string;
  question: string;
  targetHypothesisId?: string;
  perspective: 'ENTITY' | 'EVENT' | 'PRIMARY_SOURCE' | 'CONTRARIAN' | 'COMPARABLE' | 'MACRO';
  priorityScore: number;
  materialityEstimate: number;       // 0 - 100
  expectedInformationGain: number;   // 0 - 100
  estimatedCost: number;             // relative token/query weight
  depth: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SUPERSEDED';
  dependencies?: string[];
  result?: {
    evidenceRetrieved: string[];
    newClaimsGenerated: EpistemicClaim[];
    gapsIdentified: string[];
    contradictionsFound: EvidenceConflict[];
    suggestedFollowupTasks: Partial<ResearchTask>[];
  };
}

export interface ResearchBlackboard {
  runId: string;
  portfolioId: string;
  primaryDomain: string;
  status: 'INITIALIZING' | 'ACTIVE' | 'CONVERGING' | 'COMPLETED' | 'HALTED';
  budget: {
    maxDepth: number;
    depthReached: number;
    maxQueries: number;
    queriesExecuted: number;
    maxLLMCalls: number;
    llmCallsCount: number;
    tokensUsed: number;
    timeBudgetMs: number;
    elapsedMs: number;
  };
  epistemicFacts: EpistemicClaim[];
  hypotheses: CompetingHypothesis[];
  evidenceItems: Map<string, EvidenceItem>;
  sourceLineageGraph: Map<string, SourceLineageNode>;
  evidenceConflicts: EvidenceConflict[];
  taskQueue: ResearchTask[];
  completedTasks: ResearchTask[];
  activeKnowledgeGaps: string[];
  candidateStateTransitions: StateTransition[];
  whyIncluded: Array<{ eventId: string; reason: string; materiality: number }>;
  whyExcluded: Array<{ itemTitle: string; reason: 'LOW_MATERIALITY' | 'DUPLICATE_EVENT' | 'UNCONFIRMED_SPECULATION' | 'OUTDATED'; score?: number }>;
  failedQueryPatterns: Array<{ query: string; reason: string }>;
  conclusions: string[];
}

export interface ResearchTrace {
  runId: string;
  portfolioId: string;
  entityId?: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  budget: ResearchBlackboard['budget'];
  iterations: Array<{
    iteration: number;
    branchName: string;
    hypothesesTested: string[];
    queries: string[];
    sourcesRetrieved: number;
    sourcesRejected: Array<{ url: string; reason: string }>;
    evidenceExtracted: string[];
    knowledgeGapsIdentified: {
      known: string[];
      unknown: string[];
      contradictions: string[];
      openQuestions: string[];
    };
    stoppingConditionMet?: string;
  }>;
  adversarialCheckResults?: {
    challengedConclusions: string[];
    identifiedWeaknesses: string[];
    finalValidationPassed: boolean;
  };
  whyIncluded: Array<{ eventId: string; reason: string; materiality: number }>;
  whyExcluded: Array<{ itemTitle: string; reason: string; score?: number }>;
  conclusions: string[];
  blackboardSummary?: {
    factsCount: number;
    hypothesesCount: number;
    conflictsCount: number;
    evidenceCount: number;
  };
}

// ============================================================================
// 8. Cross-Entity Analysis & Synthesis
// ============================================================================

export interface CrossPortfolioSynthesis {
  systemicThemes: Array<{
    theme: string;
    description: string;
    affectedEntityIds: string[];
    confidence: number;
  }>;
  sectorPatterns: Array<{
    sector: string;
    pattern: string;
    driver: string;
    affectedEntityIds: string[];
  }>;
  idiosyncraticRisks: Array<{
    entityId: string;
    isolatedRisk: string;
    distinctionReason: string;
  }>;
  riskClassification: 'IDIOSYNCRATIC' | 'SECTOR' | 'SYSTEMIC' | 'COINCIDENTAL';
  summary: string;
}
