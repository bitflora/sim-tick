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
  | 'lymeVaccine'
  | 'reservoirVaccine';

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
  // Reservoir-targeted vaccine (RTV): mice raise anti-OspA antibodies that
  // kill spirochetes at the tick-mouse interface. Acts on transmission at
  // BOTH directions of the mouse-tick boundary.
  mouseAcquisitionMul: number;   // scales LYME.pNymphToMouse (mice ← nymphs)
  mouseInfectivityMul: number;   // scales LYME.pMouseToLarva (larvae ← mice)
  // Set true when any property-scale intervention is active in this cell.
  // Drives Ninf→cases spillover discount (see LYME.spilloverDiscount).
  propertyScaleActive: boolean;
}

export function emptyModifiers(): Modifiers {
  return {
    tickSurvivalMul: 1, adultSurvivalMul: 1, nymphSurvivalMul: 1, larvaSurvivalMul: 1,
    mouseDensityMul: 1, deerDensityMul: 1, habMul: 1, humanTransmissionMul: 1,
    mouseAcquisitionMul: 1, mouseInfectivityMul: 1,
    propertyScaleActive: false,
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

export interface ApplyContext {
  // Consecutive years (including this one) the intervention has been deployed
  // in this cell. 1 = first year. Consumed by interventions with rampSchedule.
  consecutiveYears: number;
}

export interface Intervention {
  id: InterventionId;
  name: string;
  cost: number;                  // USD/cell/yr (or one-time for capex items)
  blurb: string;
  icon: string;                  // emoji glyph for grid overlay
  apply(m: Modifiers, ctx: ApplyContext): void;
  persistsYears?: number;        // if >0, effect carries forward (engine handles)
  // Optional multi-year build-up. Interventions with biology that needs
  // sustained deployment (e.g. fourPoster) can read ctx.consecutiveYears in
  // apply() to gate efficacy.
  rampSchedule?: number[];
  // Optional spatial gate. Effect zeroes out when the connected (4-neighbor)
  // cluster of active cells (fresh deploy OR carry-over) is smaller than this
  // threshold. Cost is still charged. Literature: deerFencing needs ≥15-acre
  // exclosure; fourPoster needs station-density supporting ≥20 acres.
  minContiguousCells?: number;
  // Property-scale interventions (residential yard treatments) cut nymph
  // density but not residents' off-property tick exposure. Engine flags the
  // cell so cases use a spillover-discounted Ninf. See LYME.spilloverDiscount.
  propertyScale?: boolean;
  effect: InterventionEffect;
  citations: Citation[];
}

export const INTERVENTIONS: Record<InterventionId, Intervention> = {
  acaricide: {
    id: 'acaricide', name: 'Acaricide broadcast', cost: 181_300, icon: '🧪',
    blurb: 'Bifenthrin / permethrin spray on lawn–woods ecotone.',
    apply: (m) => { m.tickSurvivalMul *= 0.30; },
    propertyScale: true,
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
    id: 'tickTubes', name: 'Tick tubes (Damminix)', cost: 64_750, icon: '🏠',
    blurb: 'Permethrin-treated cotton nest material; kills ticks on mice.',
    apply: (m) => { m.larvaSurvivalMul *= 0.40; m.nymphSurvivalMul *= 0.55; },
    propertyScale: true,
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
    id: 'baitBox', name: 'SELECT TCS bait boxes', cost: 90_650, icon: '📦',
    blurb: 'Fipronil-wick boxes treat mice & chipmunks; ~12 per lot.',
    apply: (m) => { m.larvaSurvivalMul *= 0.50; m.nymphSurvivalMul *= 0.50; },
    propertyScale: true,
    effect: {
      metric: 'QN', medianPct: 50, rangePct: [50, 84],
      note: 'Tick Project mid-range (~50%); NJ suburban replications up to 84%. Null on human cases.',
    },
    citations: [
      { label: 'Schulze 2017 J Med Entomol', url: 'https://academic.oup.com/jme/article/54/4/1019/3070958' },
      { label: 'Keesing 2022 Emerg Infect Dis', url: 'https://wwwnc.cdc.gov/eid/article/28/5/21-1146_article' },
    ],
  },
  fourPoster: {
    id: 'fourPoster', name: '4-Poster deer stations', cost: 310_800, icon: '🎯',
    blurb: 'Permethrin self-applicator on baited deer; multi-year build-up.',
    // Ramps with consecutive deployment: Stafford 2017 (residential, yr1) only
    // ~8% kill; Pound 2009 (area-wide, yr3-6) 60-91%. Schedule indexes by
    // consecutive year, clamped to last entry. No carry-over: stop deploying
    // and ticks rebound within a season.
    apply: (m, ctx) => {
      const schedule = [0.92, 0.60, 0.30];
      const i = Math.min(Math.max(ctx.consecutiveYears, 1), schedule.length) - 1;
      m.adultSurvivalMul *= schedule[i];
    },
    rampSchedule: [0.92, 0.60, 0.30],
    // Gate retired: single 1-sq-mi cell (640 ac) trivially exceeds the
    // ~20-ac station-density threshold.
    propertyScale: true,
    effect: {
      metric: 'QN', medianPct: 60, rangePct: [8, 91],
      note: 'Yr1 ~8% (Stafford 2017 residential); ramps to 70% by yr3+ (Pound area-wide).',
    },
    citations: [
      { label: 'Pound 2009 J Med Entomol', url: 'https://academic.oup.com/jipm/article/8/1/19/3978945' },
      { label: 'Williams/Stafford 2018', url: 'https://parasitesandvectors.biomedcentral.com/articles/10.1186/1756-3305-7-292' },
    ],
  },
  deerCull: {
    id: 'deerCull', name: 'Deer culling', cost: 518_000, icon: '🦌',
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
    id: 'deerFencing', name: '8-ft deer exclusion fencing', cost: 240_000, icon: '🚧',
    blurb: 'Physical fence around 1 sq mi. Blocks deer movement in/out; no direct kill.',
    // Mechanism is purely spatial: fenced cells are excluded from deer
    // dispersal (local drift, fall rut, long-range jumps). See grid.ts.
    apply: () => {},
    persistsYears: 10,
    effect: {
      metric: 'QN', medianPct: 85, rangePct: [74, 97],
      note: 'One-time capex (~$37/m perimeter ≈ $240k/sq-mi); ~10-yr durable. Effect emerges from cutting deer re-seeding, not direct mortality.',
    },
    citations: [
      { label: 'Daniels & Fish 1993', url: 'https://pubmed.ncbi.nlm.nih.gov/8271246/' },
      { label: 'Williams 2025 J Med Entomol', url: 'https://academic.oup.com/jme/advance-article/doi/10.1093/jme/tjaf070/8171309' },
    ],
  },
  habitatMgmt: {
    id: 'habitatMgmt', name: 'Habitat management', cost: 38_850, icon: '🌿',
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
    id: 'messaging', name: 'Messaging / PPE campaign', cost: 12_950, icon: '📣',
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
    id: 'doxyProphylaxis', name: 'Post-bite doxycycline', cost: 51_800, icon: '💊',
    blurb: 'Single 200 mg dose within 72 h of attached tick. Clinical lever.',
    // Nadelman 87% is per-bite efficacy in compliant trial cohort. Population-
    // effective rate is much lower: bite must be recognized, tick removed
    // <72h, and a prescription filled. Modeled coverage ~50% → ~35% pop kill.
    apply: (m) => { m.humanTransmissionMul *= 0.65; },
    effect: {
      metric: 'EM', medianPct: 35, rangePct: [10, 70],
      note: 'Per-bite efficacy 87% (Nadelman); pop-effective discounted for recognition / 72h window / Rx fill.',
    },
    citations: [
      { label: 'Nadelman 2001 NEJM', url: 'https://www.nejm.org/doi/full/10.1056/NEJM200107123450201' },
    ],
  },
  reservoirVaccine: {
    id: 'reservoirVaccine', name: 'Reservoir-targeted OspA bait', cost: 103_600, icon: '🐭',
    blurb: 'Oral OspA in bait pellets; mice raise Ab that clears spirochetes in feeding ticks.',
    // Tsao 2004 + Richer 2014: ~24% NIP reduction yr 1 (lab up to 100%).
    // Symmetric block on both ends of the mouse-tick boundary: less mouse
    // acquisition from infected nymphs AND less larval infection from mice.
    apply: (m) => { m.mouseAcquisitionMul *= 0.76; m.mouseInfectivityMul *= 0.76; },
    effect: {
      metric: 'NIP', medianPct: 24, rangePct: [10, 41],
      note: 'Pre-commercial; only covers Peromyscus — chipmunks/shrews/birds not vaccinated.',
    },
    citations: [
      { label: 'Tsao 2004 PNAS', url: 'https://www.pnas.org/doi/10.1073/pnas.0405763102' },
      { label: 'Richer 2014 J Infect Dis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4176399/' },
    ],
  },
  lymeVaccine: {
    id: 'lymeVaccine', name: 'Human Lyme vaccine (VLA15)', cost: 155_400, icon: '💉',
    blurb: 'Pfizer/Valneva multivalent OspA, 3-dose primary + annual boost.',
    apply: (m) => { m.humanTransmissionMul *= 0.27; },
    persistsYears: 3,
    effect: {
      metric: 'HC', medianPct: 73, rangePct: [50, 90],
      note: 'VALOR phase 3 interim 2026; single ongoing trial → wide uncertainty band.',
    },
    citations: [
      { label: 'VALOR trial NCT05477524', url: 'https://clinicaltrials.gov/study/NCT05477524' },
      { label: 'Pfizer/Valneva press', url: 'https://www.pfizer.com/news/press-release/press-release-detail/pfizer-and-valneva-announce-lyme-disease-vaccine-candidate' },
    ],
  },
};

export const INTERVENTION_LIST: Intervention[] = Object.values(INTERVENTIONS);
