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
  sEggToLarva: 0.05,             // Egg-to-questing-larva survival.
  sLarvaToNymph: 0.10,           // Requires successful larval blood meal.
  sNymphToAdult: 0.08,           // Requires successful nymphal blood meal.
  sAdultOverwinter: 0.50,        // Adult survival after blood meal + oviposition window.
  // Host saturation (Beverton-Holt style): survival scales as host/(K_half + host).
  kMouseHalf: 8,                 // mice/ha for half-max larval/nymphal survival.
  kDeerHalf: 1.5,                // deer/ha for half-max adult feeding.
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
  nymphBitesPerMouse: 4.0,
  larvaBitesPerMouse: 12.0,
  // Baseline vertical/co-feeding transmission (set 0 in v1).
  pVertical: 0,
  // Human exposure.
  humansPerCell: 5,              // residential-suburban; surfaced as parameter.
  humanBitesPerNymph: 0.002,     // per nymph per year, encounter rate.
  pNymphToHuman: 0.03,           // ~3% per attached infected nymph (24h+ attachment avg).
};

// --- Spatial dispersal ------------------------------------------------------
export const DISPERSAL = {
  tickAdultFrac: 0.02,           // adults riding deer.
  mouseFrac: 0.05,
  deerMixFrac: 0.20,             // toward 4-neighbor mean.
};

// --- Economy ----------------------------------------------------------------
export const ECON = {
  gameYears: 10,
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
