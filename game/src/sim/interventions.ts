// Intervention catalog. Each item is bought per-cell, per-year (unless
// `persistsYears` set). Effects expressed as modifiers applied to the
// per-cell step BEFORE demography runs (see engine.ts).

export type InterventionId =
  | 'acaricide'
  | 'tickTubes'
  | 'fourPoster'
  | 'deerCull'
  | 'mouseReduction'
  | 'habitatMgmt'
  | 'messaging';

export interface Modifiers {
  // Multipliers applied to within-cell parameters this year.
  tickSurvivalMul: number;       // all tick-stage survivals
  adultSurvivalMul: number;      // adults only (4-poster, deer effect)
  nymphSurvivalMul: number;      // tick tubes (kill on mouse)
  larvaSurvivalMul: number;      // tick tubes
  mouseDensityMul: number;       // mouse reduction
  deerDensityMul: number;        // deer cull
  habMul: number;                // habitat management
  humanTransmissionMul: number;  // messaging / PPE
}

export function emptyModifiers(): Modifiers {
  return {
    tickSurvivalMul: 1, adultSurvivalMul: 1, nymphSurvivalMul: 1, larvaSurvivalMul: 1,
    mouseDensityMul: 1, deerDensityMul: 1, habMul: 1, humanTransmissionMul: 1,
  };
}

export interface Intervention {
  id: InterventionId;
  name: string;
  cost: number;                  // USD/cell/yr
  blurb: string;
  apply(m: Modifiers): void;
  persistsYears?: number;        // if >0, treat as multi-year (engine handles)
}

export const INTERVENTIONS: Record<InterventionId, Intervention> = {
  acaricide: {
    id: 'acaricide', name: 'Acaricide broadcast', cost: 400,
    blurb: 'Bifenthrin broadcast on vegetation. 70-90% nymph reduction in trials.',
    apply: (m) => { m.tickSurvivalMul *= 0.20; },
  },
  tickTubes: {
    id: 'tickTubes', name: 'Tick tubes / bait boxes', cost: 250,
    blurb: 'Permethrin-treated bedding for mice. Kills feeding larvae & nymphs.',
    apply: (m) => { m.larvaSurvivalMul *= 0.40; m.nymphSurvivalMul *= 0.55; },
  },
  fourPoster: {
    id: 'fourPoster', name: '4-Poster deer stations', cost: 1200,
    blurb: 'Self-applicator treats deer with acaricide. Adult-stage focus.',
    apply: (m) => { m.adultSurvivalMul *= 0.30; },
  },
  deerCull: {
    id: 'deerCull', name: 'Deer culling', cost: 500,
    blurb: 'Reduce deer density 50% this year. Cuts adult reproduction.',
    apply: (m) => { m.deerDensityMul *= 0.50; },
  },
  mouseReduction: {
    id: 'mouseReduction', name: 'Mouse trapping', cost: 300,
    blurb: 'Reduce mice 40% this year. Cuts larval & nymphal feeding success and Lyme reservoir.',
    apply: (m) => { m.mouseDensityMul *= 0.60; },
  },
  habitatMgmt: {
    id: 'habitatMgmt', name: 'Habitat management', cost: 150,
    blurb: 'Leaf removal, mowing, edge cleanup. Modest but cheap; lasts 2 years.',
    apply: (m) => { m.habMul *= 0.6; },
    persistsYears: 2,
  },
  messaging: {
    id: 'messaging', name: 'Messaging / PPE', cost: 50,
    blurb: 'Public outreach + repellent subsidies. Halves human bite-to-case rate.',
    apply: (m) => { m.humanTransmissionMul *= 0.5; },
  },
};

export const INTERVENTION_LIST: Intervention[] = Object.values(INTERVENTIONS);
