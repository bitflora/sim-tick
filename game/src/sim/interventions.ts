// Intervention catalog. Each item is bought per-cell, per-year (unless
// `persistsYears` set). Effects expressed as modifiers applied to the
// per-cell step BEFORE demography runs (see engine.ts).
//
// `effect` + `citations` are display-only metadata sourced from research.md.
// The sim mechanics are governed by `apply()`; the displayed median % is the
// literature anchor we calibrated `apply()` against, not a recomputation of it.

export type InterventionId =
  | 'acaricide'
  | 'tickTubes'
  | 'baitBox'
  | 'fourPoster'
  | 'deerCull'
  | 'deerFencing'
  | 'habitatMgmt'
  | 'messaging'
  | 'doxyProphylaxis'
  | 'lymeVaccine';

export interface Modifiers {
  // Multipliers applied to within-cell parameters this year.
  tickSurvivalMul: number;       // all tick-stage survivals
  adultSurvivalMul: number;      // adults only (4-poster, deer effect)
  nymphSurvivalMul: number;      // tick tubes (kill on mouse)
  larvaSurvivalMul: number;      // tick tubes
  mouseDensityMul: number;       // (no current intervention; kept for engine compat)
  deerDensityMul: number;        // deer cull
  habMul: number;                // habitat management
  humanTransmissionMul: number;  // messaging / PPE / doxy / vaccine
}

export function emptyModifiers(): Modifiers {
  return {
    tickSurvivalMul: 1, adultSurvivalMul: 1, nymphSurvivalMul: 1, larvaSurvivalMul: 1,
    mouseDensityMul: 1, deerDensityMul: 1, habMul: 1, humanTransmissionMul: 1,
  };
}

// Study endpoint the median effect was measured against. Matches research.md §1.
export type EffectMetric = 'QN' | 'IN' | 'NIP' | 'TBM' | 'HC' | 'EM';

export const METRIC_LEGEND: Record<EffectMetric, string> = {
  QN:  'questing nymph density',
  IN:  'infected questing nymphs',
  NIP: 'nymphal infection prevalence',
  TBM: 'tick burden on mice',
  HC:  'human Lyme cases',
  EM:  'erythema migrans incidence',
};

export interface Citation {
  label: string;
  url: string;
}

export interface InterventionEffect {
  metric: EffectMetric;
  medianPct: number;          // 0-100; % reduction in `metric`
  rangePct: [number, number]; // observed across-study range; not SD unless noted
  note?: string;              // caveats: single trial, HC null, etc.
}

export interface Intervention {
  id: InterventionId;
  name: string;
  cost: number;                  // USD/cell/yr (or one-time for capex items)
  blurb: string;
  icon: string;                  // emoji glyph for grid overlay
  apply(m: Modifiers): void;
  persistsYears?: number;        // if >0, effect carries forward (engine handles)
  effect: InterventionEffect;
  citations: Citation[];
}

export const INTERVENTIONS: Record<InterventionId, Intervention> = {
  acaricide: {
    id: 'acaricide', name: 'Acaricide broadcast', cost: 700, icon: '🧪',
    blurb: 'Bifenthrin / permethrin spray on lawn–woods ecotone.',
    apply: (m) => { m.tickSurvivalMul *= 0.30; },
    effect: {
      metric: 'QN', medianPct: 70, rangePct: [50, 100],
      note: 'Hinckley RCT: 63% QN but null on human cases',
    },
    citations: [
      { label: 'Hinckley 2016 J Infect Dis',  url: 'https://doi.org/10.1093/infdis/jiv775' },
      { label: 'Eisen & Dolan 2016 J Med Entomol', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5788731/' },
    ],
  },
  tickTubes: {
    id: 'tickTubes', name: 'Tick tubes (Damminix)', cost: 250, icon: '🏠',
    blurb: 'Permethrin-treated cotton nest material; kills ticks on mice.',
    apply: (m) => { m.larvaSurvivalMul *= 0.40; m.nymphSurvivalMul *= 0.55; },
    effect: {
      metric: 'QN', medianPct: 50, rangePct: [20, 89],
      note: 'Original MA: 89%. Suburban replications often 20–28%.',
    },
    citations: [
      { label: 'Mather 1987 J Med Entomol', url: 'https://pubmed.ncbi.nlm.nih.gov/3585913/' },
      { label: 'Jordan & Schulze 2019', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8116133/' },
    ],
  },
  baitBox: {
    id: 'baitBox', name: 'SELECT TCS bait boxes', cost: 350, icon: '📦',
    blurb: 'Fipronil-wick boxes treat mice & chipmunks; ~12 per lot.',
    apply: (m) => { m.larvaSurvivalMul *= 0.50; m.nymphSurvivalMul *= 0.50; },
    effect: {
      metric: 'QN', medianPct: 65, rangePct: [50, 84],
      note: 'Tick Project: QN ↓~50% but null on human cases',
    },
    citations: [
      { label: 'Schulze 2017 J Med Entomol', url: 'https://academic.oup.com/jme/article/54/4/1019/3070958' },
      { label: 'Keesing 2022 Emerg Infect Dis', url: 'https://wwwnc.cdc.gov/eid/article/28/5/21-1146_article' },
    ],
  },
  fourPoster: {
    id: 'fourPoster', name: '4-Poster deer stations', cost: 1200, icon: '🎯',
    blurb: 'Permethrin self-applicator on baited deer; multi-year build-up.',
    apply: (m) => { m.adultSurvivalMul *= 0.30; },
    effect: {
      metric: 'QN', medianPct: 60, rangePct: [8, 91],
      note: 'Stafford 2017 residential RCT: only 8%. Best after ≥3 seasons.',
    },
    citations: [
      { label: 'Pound 2009 J Med Entomol', url: 'https://academic.oup.com/jipm/article/8/1/19/3978945' },
      { label: 'Williams/Stafford 2018', url: 'https://parasitesandvectors.biomedcentral.com/articles/10.1186/1756-3305-7-292' },
    ],
  },
  deerCull: {
    id: 'deerCull', name: 'Deer culling', cost: 2000, icon: '🦌',
    blurb: 'Sharpshoot / managed hunt. Halves deer this year.',
    apply: (m) => { m.deerDensityMul *= 0.50; },
    effect: {
      metric: 'QN', medianPct: 80, rangePct: [50, 100],
      note: 'Threshold near ~5 deer/km²; Monhegan eradication via total removal.',
    },
    citations: [
      { label: 'Stafford 2003 J Med Entomol', url: 'https://pubmed.ncbi.nlm.nih.gov/14596277/' },
      { label: 'Kilpatrick 2014',  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4912954/' },
    ],
  },
  deerFencing: {
    id: 'deerFencing', name: '8-ft deer exclusion fencing', cost: 5000, icon: '🚧',
    blurb: 'Physical fence; needs ≥15-acre exclosure to work. Multi-year capex.',
    apply: (m) => { m.adultSurvivalMul *= 0.20; m.tickSurvivalMul *= 0.30; },
    persistsYears: 10,
    effect: {
      metric: 'QN', medianPct: 85, rangePct: [74, 97],
      note: 'Only at ≥15-acre scale; smaller exclosures fail.',
    },
    citations: [
      { label: 'Daniels & Fish 1993', url: 'https://pubmed.ncbi.nlm.nih.gov/8271246/' },
      { label: 'Williams 2025 J Med Entomol', url: 'https://academic.oup.com/jme/advance-article/doi/10.1093/jme/tjaf070/8171309' },
    ],
  },
  habitatMgmt: {
    id: 'habitatMgmt', name: 'Habitat management', cost: 150, icon: '🌿',
    blurb: 'Leaf-litter removal, mowing, mulch barrier.',
    apply: (m) => { m.habMul *= 0.4; },
    persistsYears: 1,
    effect: {
      metric: 'QN', medianPct: 75, rangePct: [50, 100],
      note: 'Effect fades as litter rebuilds; redeploy yearly.',
    },
    citations: [
      { label: 'Schulze 1995 J Med Entomol', url: 'https://pubmed.ncbi.nlm.nih.gov/7473629/' },
    ],
  },
  messaging: {
    id: 'messaging', name: 'Messaging / PPE campaign', cost: 50, icon: '📣',
    blurb: 'Public outreach + repellent / treated-clothing subsidies.',
    apply: (m) => { m.humanTransmissionMul *= 0.80; },
    effect: {
      metric: 'HC', medianPct: 20, rangePct: [0, 40],
      note: 'Behavioral; rarely shows incidence reduction. Adherence-limited.',
    },
    citations: [
      { label: 'Beard 2018 (review)', url: 'https://pubmed.ncbi.nlm.nih.gov/29494922/' },
      { label: 'Vaughn 2014 (treated clothing RCT)', url: 'https://pubmed.ncbi.nlm.nih.gov/24745637/' },
    ],
  },
  doxyProphylaxis: {
    id: 'doxyProphylaxis', name: 'Post-bite doxycycline', cost: 200, icon: '💊',
    blurb: 'Single 200 mg dose within 72 h of attached tick. Clinical lever.',
    apply: (m) => { m.humanTransmissionMul *= 0.13; },
    effect: {
      metric: 'EM', medianPct: 87, rangePct: [25, 98],
      note: '95% CI from Nadelman 2001 NEJM RCT (n=482).',
    },
    citations: [
      { label: 'Nadelman 2001 NEJM', url: 'https://www.nejm.org/doi/full/10.1056/NEJM200107123450201' },
    ],
  },
  lymeVaccine: {
    id: 'lymeVaccine', name: 'Human Lyme vaccine (VLA15)', cost: 600, icon: '💉',
    blurb: 'Pfizer/Valneva multivalent OspA, 3-dose primary + annual boost.',
    apply: (m) => { m.humanTransmissionMul *= 0.27; },
    persistsYears: 3,
    effect: {
      metric: 'HC', medianPct: 73, rangePct: [73, 73],
      note: 'VALOR phase 3 interim 2026; not yet licensed.',
    },
    citations: [
      { label: 'VALOR trial NCT05477524', url: 'https://clinicaltrials.gov/study/NCT05477524' },
      { label: 'Pfizer/Valneva press', url: 'https://www.pfizer.com/news/press-release/press-release-detail/pfizer-and-valneva-announce-lyme-disease-vaccine-candidate' },
    ],
  },
};

export const INTERVENTION_LIST: Intervention[] = Object.values(INTERVENTIONS);
