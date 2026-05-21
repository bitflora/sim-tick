import { TICK, MOUSE, DEER, LYME, GRID_SIZE, DISPERSAL, STOCHASTIC } from './params';
import type { CellState } from './cell';
import { cloneCell, makeInitialCell } from './cell';
import {
  INTERVENTIONS,
  emptyModifiers,
  type ApplyContext,
  type Intervention,
  type InterventionId,
  type Modifiers,
} from './interventions';
import { applyDispersal, applyDeerHabitatDrift, type Grid, type Flow } from './grid';
import { updateMouseInfection, fracNewNymphInfected } from './infection';
import { clusterSizes } from './clustering';

export interface Deployments {
  // cellIndex -> set of interventions deployed THIS year
  [cellIndex: number]: Set<InterventionId>;
}

// Deterministic PRNG (mulberry32). Use `makeRng(seed)` to get a Rng for
// `advanceYear`. Omit the rng arg to keep `advanceYear` fully deterministic
// (used by most unit tests).
export type Rng = () => number;
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIGMA2_HALF = (STOCHASTIC.stageSigma * STOCHASTIC.stageSigma) / 2;
function lognormalNoise(rng: Rng): number {
  // Box-Muller standard normal → mean-preserving lognormal.
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(STOCHASTIC.stageSigma * z - SIGMA2_HALF);
}

export interface YearResult {
  grid: Grid;
  casesThisYear: number;
  casesByCell: number[];
  spend: number;
  flows: Flow[];
  tickDeltaByCell: number[];
  tickPctChangeByCell: number[];
}

export function makeInitialGrid(): Grid {
  const g: Grid = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) g.push(makeInitialCell());
  return g;
}

// Per-intervention map of cellIndex -> cluster size for the current year.
// Only populated for interventions with minContiguousCells set.
type GateMap = Partial<Record<InterventionId, Map<number, number>>>;

function isGated(iv: Intervention, cellIdx: number, gates: GateMap): boolean {
  if (!iv.minContiguousCells) return false;
  const size = gates[iv.id]?.get(cellIdx) ?? 0;
  return size < iv.minContiguousCells;
}

function modifiersFor(
  cell: CellState,
  cellIdx: number,
  deploys: Set<InterventionId> | undefined,
  gates: GateMap,
): Modifiers {
  const m = emptyModifiers();
  // Apply this year's fresh deployments.
  if (deploys) {
    for (const id of deploys) {
      const iv = INTERVENTIONS[id];
      if (isGated(iv, cellIdx, gates)) continue;
      const ctx: ApplyContext = { consecutiveYears: cell.consecutiveYears[id] ?? 1 };
      iv.apply(m, ctx);
      if (iv.propertyScale) m.propertyScaleActive = true;
    }
  }
  // Apply carry-over from prior years' multi-year interventions. Skip any
  // intervention that was also deployed fresh this year (already applied).
  for (const [id, years] of Object.entries(cell.persistEffects) as [InterventionId, number][]) {
    if (years > 0 && !deploys?.has(id)) {
      const iv = INTERVENTIONS[id];
      if (isGated(iv, cellIdx, gates)) continue;
      // Carry-over runs at last-known ramp position (no further build-up
      // without fresh deploys, but we don't reset to yr1 either).
      const ctx: ApplyContext = { consecutiveYears: cell.consecutiveYears[id] ?? 1 };
      iv.apply(m, ctx);
      if (iv.propertyScale) m.propertyScaleActive = true;
    }
  }
  // Correlated-adherence proxy: cap combined human-transmission reduction.
  if (m.humanTransmissionMul < LYME.humanTransmissionFloor) {
    m.humanTransmissionMul = LYME.humanTransmissionFloor;
  }
  return m;
}

function saturation(host: number, kHalf: number): number {
  return host / (kHalf + host);
}

// Adult ticks feeding on deer: Hill-3 with hard floor at 0.05 deer/ha.
// Captures the Monhegan threshold — Ixodes adult reproduction collapses
// below ~5 deer/km² (= 0.05/ha), not a smooth Hill-1 curve.
function adultFeedSaturation(deer: number): number {
  if (deer < 0.05) return 0;
  const k = TICK.kDeerHalf;
  const deer3 = deer * deer * deer;
  return deer3 / (k * k * k + deer3);
}

function stepCell(
  cell: CellState,
  cellIdx: number,
  deploys: Set<InterventionId> | undefined,
  gates: GateMap,
  rng: Rng | undefined,
): number {
  // Update consecutive-deploy counters BEFORE building modifiers so ramp
  // schedules see the right year index (1 on first fresh deploy, etc.).
  for (const iv of Object.values(INTERVENTIONS)) {
    if (!iv.rampSchedule) continue;
    if (deploys?.has(iv.id)) {
      cell.consecutiveYears[iv.id] = (cell.consecutiveYears[iv.id] ?? 0) + 1;
    } else {
      delete cell.consecutiveYears[iv.id];
    }
  }

  const mods = modifiersFor(cell, cellIdx, deploys, gates);

  // Multi-year persistence: refresh counter on fresh deploy, else decrement.
  for (const iv of Object.values(INTERVENTIONS)) {
    if (!iv.persistsYears || iv.persistsYears < 1) continue;
    if (deploys?.has(iv.id)) {
      // Counter stores years of *future* carry-over beyond the deploy year.
      cell.persistEffects[iv.id] = iv.persistsYears - 1;
      if (cell.persistEffects[iv.id] === 0) delete cell.persistEffects[iv.id];
    } else if ((cell.persistEffects[iv.id] ?? 0) > 0) {
      cell.persistEffects[iv.id] = (cell.persistEffects[iv.id] ?? 0) - 1;
      if (cell.persistEffects[iv.id] === 0) delete cell.persistEffects[iv.id];
    }
  }
  cell.habitat = mods.habMul;

  // 1. One-shot host density adjustments (cull / mouse reduction) applied first.
  cell.mice *= mods.mouseDensityMul;
  cell.miceInfected = Math.min(cell.miceInfected, cell.mice);
  cell.deer *= mods.deerDensityMul;

  // 1a. Annual mouse turnover for the infected subset. P. leucopus has high
  // annual mortality (~65%); infected individuals die at the same rate as
  // susceptibles, while births (captured implicitly in the logistic step
  // below) restock the population as susceptible. Net: M stays at its
  // equilibrium under logistic dynamics, but Minf decays toward zero each
  // year unless replenished by new acquisitions. Without this Minf ratchets
  // up indefinitely and biases all downstream infection.
  cell.miceInfected *= MOUSE.annualSurv;

  // 1b. Host logistic growth runs BEFORE tick/host interactions so larval
  // feeding, mouse infection acquisition, and case generation all see the
  // same mouse pool for the year. (Was previously between steps 5 and
  // updateMouseInfection — mismatched M between fracNewNymphInfected and
  // updateMouseInfection.)
  cell.mice = Math.max(0, cell.mice + MOUSE.r * cell.mice * (1 - cell.mice / MOUSE.K));
  cell.miceInfected = Math.min(cell.miceInfected, cell.mice);
  cell.deer = Math.max(0, cell.deer + DEER.r * cell.deer * (1 - cell.deer / DEER.K));

  // 2. Tick reproduction: eggs from adults need deer for blood meal.
  // Hard threshold near 0.05 deer/ha (Monhegan-style collapse) via Hill-3.
  const adultFeedSat = adultFeedSaturation(cell.deer);
  // NOTE: larvaSurvivalMul is applied at larva->nymph only; applying it here
  // would double-count tick-tube kill on the same cohort.
  const eggsToLarvae =
    cell.adults * adultFeedSat * TICK.eggsPerAdult * TICK.sEggToLarva *
    mods.tickSurvivalMul * cell.habitat *
    (rng ? lognormalNoise(rng) : 1);

  // 3. Larva -> nymph: needs mouse availability. Tick-tube larva kill applies
  // here (larvae die feeding on permethrin-treated mice). nymphSurvivalMul
  // also lands here because the molted cohort is what becomes questing nymphs.
  const mouseSat = saturation(cell.mice, TICK.kMouseHalf);
  const larvaToNymph = cell.larvae * TICK.sLarvaToNymph * mouseSat *
    mods.tickSurvivalMul * mods.larvaSurvivalMul * mods.nymphSurvivalMul * cell.habitat *
    (rng ? lognormalNoise(rng) : 1);

  // Fraction of new nymphs that are infected (from feeding on infected mice).
  const newNymphInfFrac = fracNewNymphInfected(cell, mods.mouseInfectivityMul);

  // 4. Nymph -> adult: also needs hosts (mice + deer combined). adultSurvivalMul
  // applies here so fourPoster (deer-applied permethrin) also kills nymphs
  // taking their blood meal on treated deer, not only standing overwintered adults.
  const nymphFeedSat = 0.5 * mouseSat + 0.5 * adultFeedSat;
  const nymphToAdult = cell.nymphs * TICK.sNymphToAdult * nymphFeedSat *
    mods.tickSurvivalMul * mods.adultSurvivalMul * cell.habitat *
    (rng ? lognormalNoise(rng) : 1);
  // Infected nymphs that advance carry infection forward.
  const nymphInfRatio = cell.nymphs > 0 ? cell.nymphsInfected / cell.nymphs : 0;

  // 5. Adult overwinter survival (fraction that survives to next year still as adult,
  // before reproducing again — simplified: we treat adults as a standing pool).
  const adultSurv = cell.adults * TICK.sAdultOverwinter * mods.tickSurvivalMul * mods.adultSurvivalMul;
  const adultInfRatio = cell.adults > 0 ? cell.adultsInfected / cell.adults : 0;

  // Build new stage values.
  const newLarvae = eggsToLarvae;
  const newNymphs = larvaToNymph;
  const newAdults = adultSurv + nymphToAdult;  // surviving adults + freshly molted

  // Infected counts.
  const newLarvaeInfected = 0; // vertical transmission ~0
  const newNymphsInfected = newNymphs * newNymphInfFrac; // freshly molted nymphs carry infection from larval feeding
  const newAdultsInfected = adultSurv * adultInfRatio + nymphToAdult * nymphInfRatio;

  // 6. Update Lyme in mice + accrue human cases. Uses last year's nymph pool
  // (cell.nymphs/nymphsInfected, pre-overwrite) for human exposure; mouse
  // growth already ran in step 1b so mice/miceInfected are this year's pool.
  const cases = updateMouseInfection(
    cell,
    mods.humanTransmissionMul,
    mods.propertyScaleActive,
    mods.mouseAcquisitionMul,
  );

  // Commit new tick stages.
  cell.larvae = newLarvae;
  cell.larvaeInfected = newLarvaeInfected;
  cell.nymphs = newNymphs;
  cell.nymphsInfected = newNymphsInfected;
  cell.adults = newAdults;
  cell.adultsInfected = newAdultsInfected;

  return cases;
}

export function advanceYear(grid: Grid, deployments: Deployments, rng?: Rng): YearResult {
  const next: Grid = grid.map(cloneCell);
  const casesByCell: number[] = new Array(next.length).fill(0);
  const preTickTotals = grid.map((c) => c.larvae + c.nymphs + c.adults);
  const flows: Flow[] = [];
  let total = 0;
  let spend = 0;

  // Pre-compute cluster sizes for each gated intervention. Active cells =
  // fresh deploy this year OR carry-over from prior years.
  const gates: GateMap = {};
  for (const iv of Object.values(INTERVENTIONS)) {
    if (!iv.minContiguousCells) continue;
    const active = new Set<number>();
    for (let i = 0; i < next.length; i++) {
      if (deployments[i]?.has(iv.id) || (next[i].persistEffects[iv.id] ?? 0) > 0) {
        active.add(i);
      }
    }
    gates[iv.id] = clusterSizes(active);
  }

  for (let i = 0; i < next.length; i++) {
    const deploys = deployments[i];
    // Charge cost on fresh deploy regardless of gate — player learns the rule.
    if (deploys) for (const id of deploys) spend += INTERVENTIONS[id].cost;
    const c = stepCell(next[i], i, deploys, gates, rng);
    casesByCell[i] = c;
    total += c;
  }

  // Deer fencing: cells with active deerFencing (fresh deploy this year OR
  // persisting carry-over) block deer in/out. Built after stepCell so
  // persistEffects reflects this year's bookkeeping.
  const fenced: boolean[] = next.map((c, i) =>
    deployments[i]?.has('deerFencing') || (c.persistEffects.deerFencing ?? 0) > 0,
  );

  // Fall rut pulse: extra deer-only mixing before year-end dispersal. Aligns
  // deer redistribution with autumn rut, when adult I. scapularis quest.
  applyDeerHabitatDrift(next, DISPERSAL.deerRutFrac, flows, fenced);

  applyDispersal(next, flows, fenced);

  // Quantize populations to integers. Compartmental math runs continuously
  // through the year (preserves rate-based dynamics); committed state is
  // integer so the UI never shows "0 adults, 11% infected" from sub-integer
  // residuals. Deer stays fractional — Hill-3 adult-feed saturation has a
  // 0.05/ha floor and depends on sub-unit densities.
  for (const cell of next) {
    cell.larvae = Math.round(cell.larvae);
    cell.nymphs = Math.round(cell.nymphs);
    cell.adults = Math.round(cell.adults);
    cell.mice = Math.round(cell.mice);
    cell.larvaeInfected = Math.min(cell.larvae, Math.round(cell.larvaeInfected));
    cell.nymphsInfected = Math.min(cell.nymphs, Math.round(cell.nymphsInfected));
    cell.adultsInfected = Math.min(cell.adults, Math.round(cell.adultsInfected));
    cell.miceInfected = Math.min(cell.mice, Math.round(cell.miceInfected));
  }

  const tickDeltaByCell = next.map((c, i) => (c.larvae + c.nymphs + c.adults) - preTickTotals[i]);
  const tickPctChangeByCell = tickDeltaByCell.map((d, i) =>
    preTickTotals[i] > 0 ? d / preTickTotals[i] : 0,
  );

  return { grid: next, casesThisYear: total, casesByCell, spend, flows, tickDeltaByCell, tickPctChangeByCell };
}

export function totalCost(deployments: Deployments): number {
  let s = 0;
  for (const k of Object.keys(deployments)) {
    const set = deployments[Number(k)];
    if (!set) continue;
    for (const id of set) s += INTERVENTIONS[id].cost;
  }
  return s;
}
