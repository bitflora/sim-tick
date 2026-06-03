// Biological + economic parameters for Ixodes scapularis + Borrelia burgdorferi.
// Units: densities per hectare, rates per year. Values chosen for plausibility,
// not for publication-grade calibration. Sources noted inline.

// Grid edge length (cells). Override at build/dev time with VITE_GRID_SIZE.
const envGridSize = Number(import.meta.env.VITE_GRID_SIZE);
export const GRID_SIZE = Number.isFinite(envGridSize) && envGridSize > 0 ? envGridSize : 5;
// 1 sq mile = 640 acres ≈ 258.999 hectares. Per-hectare biological constants
// below are unchanged; per-cell economic/population values scale with cell area.
export const HECTARES_PER_CELL = 259;

// --- Tick demography (annual survival fractions, not daily rates) -----------
export const TICK = {
  eggsPerAdult: 2000,            // Ostfeld, Lyme Disease (2011); ~1500-3000 viable eggs.
  sEggToLarva: 0.05,             // Lindsay 1995 / Ostfeld 2011: 0.05–0.10. Conservative low end.
  sLarvaToNymph: 0.10,           // Lindsay / Ostfeld: 0.05–0.10. Upper end.
  sNymphToAdult: 0.08,           // Lindsay / Ostfeld: 0.05–0.10. Mid-range.
  sAdultOverwinter: 0.40,        // Lindsay 0.30–0.50; research §5 recommended 0.4 (was 0.5).
  // Host saturation (Beverton-Holt style): survival scales as host/(K_half + host).
  // mice/ha for half-max larval/nymphal survival. Tuned so closed-form R₀ ≈ 1
  // at endemic host equilibria (M=50, D=0.5): μ_M = 50/59 = 0.847, μ_NH = 0.91;
  // R₀ = f·sE·sL·sN·μ_D·μ_M·μ_NH/(1−sA) ≈ 1.00. See research/tick-growth.md §2.
  kMouseHalf: 9,
  // deer/ha for half-max adult feeding under Hill-3. Rescaled with realistic
  // DEER.K=0.5/ha: at D=0.5, μ_D = 0.974; at D=0.15 (k), μ_D = 0.5; sharp
  // collapse below k. Hard floor at 0.05/ha (Monhegan) still applies.
  kDeerHalf: 0.15,
  // Allee mate-finding: probability a questing female encounters a male on
  // the same host scales as A/(A + Aallee). At endemic A≈60/ha the multiplier
  // is ~0.98 (no measurable effect); below ~5/ha it bites hard, driving the
  // R₀<1 → extinction transition that pure linear models miss. Reference:
  // research/gpt/tick-extinction.md §2 (Allee effect, mate failure on sparse
  // hosts); Stephens & Sutherland 1999 (Allee in arthropod vectors).
  // Tuned to keep mate-finding ≥ 0.995 at endemic A≈60/ha (negligible R₀ drag)
  // while still collapsing reproduction below ~1/ha.
  alleeHalf: 0.3, // adults/ha at which mate-finding success = 0.5
};

// --- Hosts ------------------------------------------------------------------
export const MOUSE = {
  r: 1.2,                        // intrinsic annual growth (Peromyscus leucopus).
  K: 50,                         // carrying capacity per ha (oak-mast year highs).
  init: 25,
  // Annual survival of P. leucopus. Median lifespan in the wild is well under
  // a year; overwinter survival is the bottleneck. Applied to Minf each year
  // so infected mice don't persist forever; the standing population M is
  // already at logistic equilibrium (net growth captures background mortality
  // balanced by births, all born susceptible). 0.35 = ~65% annual mortality.
  annualSurv: 0.35,
};
// Deer (Odocoileus virginianus) are reservoir-INCOMPETENT for B. burgdorferi.
// Adult ticks feed on them for the blood meal that fuels reproduction, but
// spirochetes are typically lost rather than transmitted. We therefore track D
// (population) but not Dinf — deer enter the model only as a demographic
// resource for adult-tick feeding (see adultFeedSaturation in engine.ts).
export const DEER = {
  r: 0.25,                       // slow growth, Odocoileus virginianus.
  // Suburban-edge carrying capacity. White-tailed deer in oak-hickory forest:
  // 10–30/km² (= 0.1–0.3/ha); severe suburban overpopulation tops ~60/km²
  // (0.6/ha). Stafford & Williams 2017 + research/tick-growth.md §7.
  // (Was 8/ha — biologically implausible, 100× too high.)
  K: 0.5,
  init: 0.3,
};

// --- Lyme transmission ------------------------------------------------------
export const LYME = {
  // Probabilities per feeding event.
  pNymphToMouse: 0.83,           // Donahue et al. 1987; very efficient.
  pMouseToLarva: 0.65,           // Mather et al.; reservoir competence of mice.
  // Mouse FOI is density-based: hazard = pNymphToMouse · nymphContactRate ·
  // (Ninf / M). Units of nymphContactRate are effective infectious contacts
  // per (infected-nymph-per-mouse) per year — i.e. a per-mouse search-rate
  // coefficient. Calibrated so that at endemic Ninf=100/cell, M=50/ha the
  // hazard matches the prior fraction-based form (β·Ninf/M = 4·Ninf/N at
  // those host densities). Replacing the fraction form means tick-density
  // interventions (acaricide, tick tubes) now correctly reduce mouse FOI.
  nymphContactRate: 0.40,
  // Larvae: hazard per larva is pMouseToLarva · larvaBitesPerMouse · (Minf/M).
  // Per-larva form is fraction-based because each larva takes ~one mouse meal
  // and the probability that mouse is infected is exactly Minf/M. The constant
  // sets effective exposure intensity to roll up multiple attempts per molt.
  larvaBitesPerMouse: 12.0,
  // Baseline vertical/co-feeding transmission (set 0 in v1).
  pVertical: 0,
  // Human exposure. 1 sq mi cell at suburban-edge density (~10 people/ha,
  // mixed residential + woodland) ~ 2,600 residents.
  humansPerCell: 2590,
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
  spilloverBaselineInfectedNymphs: 100, // = INIT.N * INIT.fracNymphInf (endemic background)
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
  // Habitat-weighted local drift. Webb et al. 2010 GPS-collar telemetry:
  // mean 95% annual home range ~900–1,000 ha. At HECTARES_PER_CELL=259 that
  // spans ~3–4 cells, so a sizeable fraction leaves each cell per year.
  deerMixFrac: 0.40,
  // Rare long-range jumps: yearling buck dispersal (median 5.77 km, range
  // 1.3–68.3 km, Long et al. PMC9608933) + rut excursions. Small share,
  // habitat-weighted global redistribution — captures the connectivity
  // → pathogen-spread mechanism (Landscape Ecology 2025, CDC EID 2019).
  deerJumpFrac: 0.015,
  // Fall rut pulse: extra deer mixing pass between host adjustments and
  // year-end dispersal. Aligns spatial mixing of deer (and thus adult-tick
  // blood meals) with the autumn rut, when adult I. scapularis quest.
  deerRutFrac: 0.10,
};

// --- Stochasticity ----------------------------------------------------------
// Per-cell, per-stage lognormal multiplier on tick stage transitions to match
// the literature CV of 0.3–0.6 in nymph counts (research/tick-growth.md §6).
// Applied as exp(σ·Z − σ²/2) so the multiplier has mean 1 (no long-run bias).
export const STOCHASTIC = {
  stageSigma: 0.2,
};

// --- Initial state ----------------------------------------------------------
// Eigenvector of the stage matrix at R₀=1 with host equilibria (M=50, D=0.5):
// L:N:A ≈ 97 : 8.4 : 1. Sized so the no-intervention run holds equilibrium from
// year 0 instead of oscillating through a multi-year transient. The L count is
// the annual *cohort* (eggs that survived to larva), not the simultaneous
// questing-larva snapshot that field drag-counts measure.
export const INIT = {
  L: 5800,
  N: 500,
  A: 60,
  // Endemic Lyme: ~20% infected nymphs, ~25% infected mice.
  fracNymphInf: 0.20,
  fracAdultInf: 0.30,
  fracLarvaInf: 0.02,
  fracMouseInf: 0.25,
};
