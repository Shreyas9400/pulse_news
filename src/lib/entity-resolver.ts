/**
 * PulseNews Entity Resolution & Canonical Identity Engine
 * Resolves tickers, names, abbreviations, and themes into canonical entities with relationship mapping.
 */

import { CanonicalEntity, EntityRelationship } from './types';
import { DEFAULT_CIK_DIRECTORY } from './sec-edgar';

// In-memory canonical entity registry
const CANONICAL_DIRECTORY: Record<string, CanonicalEntity> = {
  // Private Credit & BDCs
  BCSF: {
    id: 'ENT_BCSF',
    canonicalName: 'Bain Capital Specialty Finance, Inc.',
    primaryTicker: 'BCSF',
    cik: '0001655505',
    aliases: ['BCSF', 'Bain Capital Specialty Finance', 'Bain Capital BDC', 'Bain Credit'],
    entityType: 'FUND',
    parentEntityId: 'ENT_BAIN_CAPITAL',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_US_FIXED_INCOME', relationshipType: 'SECTOR_OF', confidence: 95 },
    ],
    domainHint: 'private_credit',
    industry: 'Asset Management / Direct Lending',
    description: 'Externally managed specialty finance company operating as a business development company (BDC).',
  },
  CCLFX: {
    id: 'ENT_CCLFX',
    canonicalName: 'Cliffwater Corporate Lending Fund',
    primaryTicker: 'CCLFX',
    cik: '0001735964',
    aliases: ['CCLFX', 'Cliffwater Corporate Lending', 'Cliffwater Fund', 'Cliffwater Direct Lending'],
    entityType: 'FUND',
    parentEntityId: 'ENT_CLIFFWATER',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_EVERGREEN_FUNDS', relationshipType: 'SECTOR_OF', confidence: 95 },
    ],
    domainHint: 'private_credit',
    industry: 'Direct Lending Interval Fund',
    description: 'Continuously offered closed-end interval fund investing directly in private middle-market corporate loans.',
  },
  OTF: {
    id: 'ENT_OTF',
    canonicalName: 'Blue Owl Technology Finance Corp.',
    primaryTicker: 'OTF',
    cik: '0001859392',
    aliases: ['OTF', 'Blue Owl Technology Finance', 'Blue Owl Tech Finance Corp', 'Owl Rock Tech'],
    entityType: 'FUND',
    parentEntityId: 'ENT_BLUE_OWL',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_SOFTWARE_LENDING', relationshipType: 'SECTOR_OF', confidence: 90 },
    ],
    domainHint: 'private_credit',
    industry: 'Technology Specialty Lending BDC',
    description: 'Business development company focused on originating senior secured debt to enterprise software & tech borrowers.',
  },
  MFIC: {
    id: 'ENT_MFIC',
    canonicalName: 'MidCap Financial Investment Corporation',
    primaryTicker: 'MFIC',
    cik: '0001278752',
    aliases: ['MFIC', 'MidCap Financial', 'MidCap Financial Investment Corp', 'Apollo MidCap'],
    entityType: 'FUND',
    parentEntityId: 'ENT_APOLLO',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_MIDDLE_MARKET', relationshipType: 'SECTOR_OF', confidence: 95 },
    ],
    domainHint: 'private_credit',
    industry: 'Direct Lending BDC',
    description: 'Middle-market direct lender managed by an affiliate of Apollo Global Management.',
  },
  ARCC: {
    id: 'ENT_ARCC',
    canonicalName: 'Ares Capital Corporation',
    primaryTicker: 'ARCC',
    cik: '0001287750',
    aliases: ['ARCC', 'Ares Capital', 'Ares Capital Corp', 'Ares BDC'],
    entityType: 'FUND',
    parentEntityId: 'ENT_ARES',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
    ],
    domainHint: 'private_credit',
    industry: 'Direct Lending BDC',
    description: 'Largest publicly traded business development company in the United States by market cap.',
  },
  OBDC: {
    id: 'ENT_OBDC',
    canonicalName: 'Blue Owl Capital Corporation',
    primaryTicker: 'OBDC',
    cik: '0001655887',
    aliases: ['OBDC', 'Blue Owl Capital Corp', 'Blue Owl BDC', 'Owl Rock Capital'],
    entityType: 'FUND',
    parentEntityId: 'ENT_BLUE_OWL',
    relationships: [
      { targetEntityId: 'ENT_PRIVATE_CREDIT', relationshipType: 'SECTOR_OF', confidence: 100 },
    ],
    domainHint: 'private_credit',
    industry: 'Direct Lending BDC',
    description: 'Direct lending BDC investing primarily in senior secured loans to upper middle-market companies.',
  },

  // Tech & AI Infrastructure
  NVDA: {
    id: 'ENT_NVDA',
    canonicalName: 'NVIDIA Corporation',
    primaryTicker: 'NVDA',
    cik: '0001045810',
    aliases: ['NVDA', 'Nvidia', 'NVIDIA Corp', 'Nvidia AI'],
    entityType: 'PUBLIC_COMPANY',
    relationships: [
      { targetEntityId: 'ENT_SEMICONDUCTORS', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_AI_INFRASTRUCTURE', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_TSM', relationshipType: 'EXPOSED_TO', confidence: 95, notes: 'Foundry dependency' },
    ],
    domainHint: 'tech_semiconductors',
    industry: 'Semiconductors & GPU Accelerators',
    description: 'Leading designer of graphics processing units (GPUs) and AI accelerator platforms.',
  },
  AMD: {
    id: 'ENT_AMD',
    canonicalName: 'Advanced Micro Devices, Inc.',
    primaryTicker: 'AMD',
    cik: '0000002488',
    aliases: ['AMD', 'Advanced Micro Devices', 'AMD Instinct'],
    entityType: 'PUBLIC_COMPANY',
    relationships: [
      { targetEntityId: 'ENT_SEMICONDUCTORS', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_NVDA', relationshipType: 'COMPETITOR_OF', confidence: 95 },
    ],
    domainHint: 'tech_semiconductors',
    industry: 'Semiconductors & Microprocessors',
    description: 'Global semiconductor vendor of CPUs, GPUs, and enterprise accelerator chips.',
  },
  AVGO: {
    id: 'ENT_AVGO',
    canonicalName: 'Broadcom Inc.',
    primaryTicker: 'AVGO',
    cik: '0001730168',
    aliases: ['AVGO', 'Broadcom', 'Broadcom Inc'],
    entityType: 'PUBLIC_COMPANY',
    relationships: [
      { targetEntityId: 'ENT_SEMICONDUCTORS', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_AI_INFRASTRUCTURE', relationshipType: 'SECTOR_OF', confidence: 90 },
    ],
    domainHint: 'tech_semiconductors',
    industry: 'Semiconductors & Enterprise Software',
    description: 'Designer of custom ASICs, networking switches, and enterprise infrastructure software.',
  },
  TSM: {
    id: 'ENT_TSM',
    canonicalName: 'Taiwan Semiconductor Manufacturing Company Limited',
    primaryTicker: 'TSM',
    aliases: ['TSM', 'TSMC', 'Taiwan Semi', 'Taiwan Semiconductor'],
    entityType: 'PUBLIC_COMPANY',
    relationships: [
      { targetEntityId: 'ENT_SEMICONDUCTORS', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_NVDA', relationshipType: 'LENDS_TO', confidence: 80, notes: 'Key manufacturing partner' },
    ],
    domainHint: 'tech_semiconductors',
    industry: 'Pure-play Semiconductor Foundry',
    description: 'World largest dedicated semiconductor foundry manufacturing advanced silicon nodes.',
  },
  PLTR: {
    id: 'ENT_PLTR',
    canonicalName: 'Palantir Technologies Inc.',
    primaryTicker: 'PLTR',
    cik: '0001321655',
    aliases: ['PLTR', 'Palantir', 'Palantir Tech', 'AIP'],
    entityType: 'PUBLIC_COMPANY',
    relationships: [
      { targetEntityId: 'ENT_ENTERPRISE_SOFTWARE', relationshipType: 'SECTOR_OF', confidence: 100 },
      { targetEntityId: 'ENT_AI_INFRASTRUCTURE', relationshipType: 'SECTOR_OF', confidence: 90 },
    ],
    domainHint: 'enterprise_software',
    industry: 'Enterprise AI & Defense Analytics',
    description: 'Enterprise data integration and AI operating system developer for defense and commercial clients.',
  },
};

/**
 * Resolves any raw query, ticker, name, or alias to a CanonicalEntity
 */
export function resolveCanonicalEntity(symbolOrName: string): CanonicalEntity {
  const clean = symbolOrName.trim();
  const upper = clean.toUpperCase();
  const cleanKey = upper.replace(/[^A-Z0-9_]/g, '_');

  // 1. Direct key match in canonical directory
  if (CANONICAL_DIRECTORY[upper]) {
    return CANONICAL_DIRECTORY[upper];
  }

  // 2. Search aliases & canonical names
  const lower = clean.toLowerCase();
  for (const entity of Object.values(CANONICAL_DIRECTORY)) {
    if (
      entity.canonicalName.toLowerCase() === lower ||
      entity.primaryTicker?.toLowerCase() === lower ||
      entity.aliases.some((a) => a.toLowerCase() === lower || lower.includes(a.toLowerCase()))
    ) {
      return entity;
    }
  }

  // 3. Check CIK Directory
  const matchedCik = DEFAULT_CIK_DIRECTORY[upper] || null;

  // 4. Generate dynamic CanonicalEntity on-the-fly for arbitrary user inputs
  const isSector =
    upper.includes('CREDIT') ||
    upper.includes('SECTOR') ||
    upper.includes('BOND') ||
    upper.includes('CHIPS') ||
    upper.includes('AUTO') ||
    upper.includes('MACRO') ||
    clean.includes(' ');

  const inferredType = isSector ? 'SECTOR' : 'PUBLIC_COMPANY';

  return {
    id: `ENT_${cleanKey}`,
    canonicalName: clean,
    primaryTicker: isSector ? undefined : upper,
    cik: matchedCik || undefined,
    aliases: [clean, upper],
    entityType: inferredType,
    relationships: [],
    domainHint: inferDomainFromText(clean),
    industry: isSector ? 'Sector / Industry Theme' : 'Corporate Asset',
    description: `Tracked entity in user research watchlist: ${clean}.`,
  };
}

/**
 * Heuristically infers primary domain from entity name or symbols
 */
function inferDomainFromText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('credit') || t.includes('bdc') || t.includes('nav') || t.includes('lending') || t.includes('loan') || t.includes('yield') || t.includes('cclfx') || t.includes('bcsf')) {
    return 'private_credit';
  }
  if (t.includes('chip') || t.includes('semi') || t.includes('gpu') || t.includes('nvda') || t.includes('amd') || t.includes('tsm') || t.includes('avgo') || t.includes('broadcom')) {
    return 'tech_semiconductors';
  }
  if (t.includes('auto') || t.includes('tata') || t.includes('mahindra') || t.includes('ev') || t.includes('battery')) {
    return 'automotive_ev';
  }
  if (t.includes('biotech') || t.includes('pharma') || t.includes('fda') || t.includes('drug') || t.includes('clinical')) {
    return 'biotech_healthcare';
  }
  if (t.includes('oil') || t.includes('gas') || t.includes('energy') || t.includes('solar') || t.includes('uranium')) {
    return 'energy_commodities';
  }
  if (t.includes('fed') || t.includes('rate') || t.includes('macro') || t.includes('inflation') || t.includes('treasury')) {
    return 'macroeconomics';
  }
  return 'equities_markets';
}

/**
 * Returns all relationships for an entity
 */
export function getEntityRelationships(entityId: string): EntityRelationship[] {
  const canonical = resolveCanonicalEntity(entityId);
  return canonical.relationships || [];
}
