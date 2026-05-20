// Biological + economic parameters for Ixodes scapularis + Borrelia burgdorferi.
// Units: densities per hectare, rates per year. Values chosen for plausibility,
// not for publication-grade calibration. Sources noted inline.

// Grid edge length (cells). Override at build/dev time with VITE_GRID_SIZE.
const envGridSize = Number(import.meta.env.VITE_GRID_SIZE);
export const GRID_SIZE = Number.isFinite(envGridSize) && envGridSize > 0 ? envGridSize : 5;
export const HECTARES_PER_CELL = 1;

// --- Tick demography (annual survival fractions, not daily rates) -----------
export const TICK = {
  eggsPerAdult: 2000,            // Ostfeld, Lyme Disease (2011); ~1500-3000 viable eggs.
  sEggToLarva: 0.05,             // Lindsay 1995 / Ostfeld 2011: 0.05–0.10. Conservative low end.
  sLarvaToNymph: 0.10,           // Lindsay / Ostfeld: 0.05–0.10. Upper end.
  sNymphToAdult: 0.08,           // Lindsay / Ostfeld: 0.05–0.10. Mid-range.
  sAdultOverwinter: 0.40,        // Lindsay 0.30–0.50; research §5 recommended 0.4 (was 0.5).
  // Host saturation (Beverton-Holt style): survival scales as host/(K_half + host).
  kMouseHalf: 8,                 // mice/ha for half-max larval/nymphal survival.
  // deer/ha for half-max adult feeding under Hill-3. Retuned from 1.5 (Hill-1)
  // to preserve baseline ~0.75 saturation at D=5/ha while giving sharp
  // threshold collapse near 0.05/ha (Monhegan effect). See engine.adultFeedSaturation.
  kDeerHalf: 3.5,
};

// --- Hosts ------------------------------------------------------------------
export const MOUSE = {
  r: 1.2,                        // intrinsic annual growth (Peromyscus leucopus).
  K: 50,                         // carrying capacity per ha (oak-mast year highs).
  init: 25,
};
export const DEER = {
  r: 0.25,                       // slow growth, Odocoileus virginianus.
  K: 8,                          // suburban-edge density.
  init: 5,
};

// --- Lyme transmission ------------------------------------------------------
export const LYME = {
  // Probabilities per feeding event.
  pNymphToMouse: 0.83,           // Donahue et al. 1987; very efficient.
  pMouseToLarva: 0.65,           // Mather et al.; reservoir competence of mice.
  // Annual contact intensity (bites per host per year, effective).
  // No direct citation; derived from typical exposure × pNymphToMouse so that
  // mouse infection prevalence equilibrates to literature endemic (~20-30%).
  nymphBitesPerMouse: 4.0,
  larvaBitesPerMouse: 12.0,
  // Baseline vertical/co-feeding transmission (set 0 in v1).
  pVertical: 0,
  // Human exposure. 1-ha residential cell, 0.2-0.5 ha lots ~ 2-5 households
  // ~ 5-15 people. Was 5 (low); 10 is mid-range residential density.
  humansPerCell: 10,
  humanBitesPerNymph: 0.002,     // per nymph per year, encounter rate.
  pNymphToHuman: 0.03,           // ~3% per attached infected nymph (24h+ attachment avg).
  // Property-scale interventions (lawn-edge acaricide, tick tubes, bait boxes,
  // 4-poster) cut nymph density in-yard but do not eliminate exposure: people
  // still get bitten on hikes, parks, and adjacent woods. Hinckley 2016 + Tick
  // Project (Keesing 2022) both showed QN reductions with null human-case
  // effect. We model this as: effective infected-nymph encounters seen by
  // residents are a weighted average of in-yard Ninf and an untreatable
  // off-site background reservoir. spilloverDiscount = weight on background.
  spilloverDiscount: 0.5,
  spilloverBaselineInfectedNymphs: 40, // = INIT.N * INIT.fracNymphInf (endemic background)
  // Combined human-transmission multiplier (messaging × doxy × vaccine) is
  // clamped so stacking can't deliver >80% reduction. Real-world co-deployment
  // has correlated adherence (vaccinated people don't also take post-bite doxy,
  // PPE adherence correlates with vaccine uptake). Hard floor is a crude
  // proxy for that correlation.
  humanTransmissionFloor: 0.20,
};

// --- Spatial dispersal ------------------------------------------------------
// Pure tuning knobs — no direct empirical anchor. Calibrated to produce
// plausible neighbor-to-neighbor spread over a 10-yr horizon.
export const DISPERSAL = {
  tickAdultFrac: 0.02,           // adults riding deer.
  mouseFrac: 0.05,
  deerMixFrac: 0.20,             // toward 4-neighbor mean.
};

// --- Initial state ----------------------------------------------------------
export const INIT = {
  L: 400,
  N: 200,
  A: 60,
  // Endemic Lyme: ~20% infected nymphs, ~25% infected mice.
  fracNymphInf: 0.20,
  fracAdultInf: 0.30,
  fracLarvaInf: 0.02,
  fracMouseInf: 0.25,
};
