import { TICK, MOUSE, DEER, LYME, GRID_SIZE, DISPERSAL } from './params';
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
import { applyDispersal, applyDeerHabitatDrift, type Grid } from './grid';
import { updateMouseInfection, fracNewNymphInfected } from './infection';
import { clusterSizes } from './clustering';

export interface Deployments {
  // cellIndex -> set of interventions deployed THIS year
  [cellIndex: number]: Set<InterventionId>;
}

export interface YearResult {
  grid: Grid;
  casesThisYear: number;
  casesByCell: number[];
  spend: number;
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
function adultFeedSaturation(D: number): number {
  if (D < 0.05) return 0;
  const k = TICK.kDeerHalf;
  const D3 = D * D * D;
  return D3 / (k * k * k + D3);
}

function stepCell(
  cell: CellState,
  cellIdx: number,
  deploys: Set<InterventionId> | undefined,
  gates: GateMap,
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
  cell.hab = mods.habMul;

  // 1. One-shot host density adjustments (cull / mouse reduction) applied first.
  cell.M *= mods.mouseDensityMul;
  cell.Minf = Math.min(cell.Minf, cell.M);
  cell.D *= mods.deerDensityMul;

  // 1b. Host logistic growth runs BEFORE tick/host interactions so larval
  // feeding, mouse infection acquisition, and case generation all see the
  // same mouse pool for the year. (Was previously between steps 5 and
  // updateMouseInfection — mismatched M between fracNewNymphInfected and
  // updateMouseInfection.)
  cell.M = Math.max(0, cell.M + MOUSE.r * cell.M * (1 - cell.M / MOUSE.K));
  cell.Minf = Math.min(cell.Minf, cell.M);
  cell.D = Math.max(0, cell.D + DEER.r * cell.D * (1 - cell.D / DEER.K));

  // 2. Tick reproduction: eggs from adults need deer for blood meal.
  // Hard threshold near 0.05 deer/ha (Monhegan-style collapse) via Hill-3.
  const adultFeedSat = adultFeedSaturation(cell.D);
  // NOTE: larvaSurvivalMul is applied at larva->nymph only; applying it here
  // would double-count tick-tube kill on the same cohort.
  const eggsToLarvae =
    cell.A * adultFeedSat * TICK.eggsPerAdult * TICK.sEggToLarva *
    mods.tickSurvivalMul * cell.hab;

  // 3. Larva -> nymph: needs mouse availability. Tick-tube larva kill applies
  // here (larvae die feeding on permethrin-treated mice). nymphSurvivalMul
  // also lands here because the molted cohort is what becomes questing nymphs.
  const mouseSat = saturation(cell.M, TICK.kMouseHalf);
  const larvaToNymph = cell.L * TICK.sLarvaToNymph * mouseSat *
    mods.tickSurvivalMul * mods.larvaSurvivalMul * mods.nymphSurvivalMul * cell.hab;

  // Fraction of new nymphs that are infected (from feeding on infected mice).
  const newNymphInfFrac = fracNewNymphInfected(cell, mods.mouseInfectivityMul);

  // 4. Nymph -> adult: also needs hosts (mice + deer combined). adultSurvivalMul
  // applies here so fourPoster (deer-applied permethrin) also kills nymphs
  // taking their blood meal on treated deer, not only standing overwintered adults.
  const nymphFeedSat = 0.5 * mouseSat + 0.5 * adultFeedSat;
  const nymphToAdult = cell.N * TICK.sNymphToAdult * nymphFeedSat *
    mods.tickSurvivalMul * mods.adultSurvivalMul * cell.hab;
  // Infected nymphs that advance carry infection forward.
  const nymphInfRatio = cell.N > 0 ? cell.Ninf / cell.N : 0;

  // 5. Adult overwinter survival (fraction that survives to next year still as adult,
  // before reproducing again — simplified: we treat A as a standing pool).
  const adultSurv = cell.A * TICK.sAdultOverwinter * mods.tickSurvivalMul * mods.adultSurvivalMul;
  const adultInfRatio = cell.A > 0 ? cell.Ainf / cell.A : 0;

  // Build new stage values.
  const newL = eggsToLarvae;
  const newN = larvaToNymph;
  const newA = adultSurv + nymphToAdult;  // surviving adults + freshly molted

  // Infected counts.
  const newLinf = 0; // vertical transmission ~0
  const newNinf = newN * newNymphInfFrac; // freshly molted nymphs carry infection from larval feeding
  const newAinf = adultSurv * adultInfRatio + nymphToAdult * nymphInfRatio;

  // 6. Update Lyme in mice + accrue human cases. Uses last year's nymph pool
  // (cell.N/Ninf, pre-overwrite) for human exposure; mouse growth already ran
  // in step 1b so M/Minf are this year's pool.
  const cases = updateMouseInfection(
    cell,
    mods.humanTransmissionMul,
    mods.propertyScaleActive,
    mods.mouseAcquisitionMul,
  );

  // Commit new tick stages.
  cell.L = newL;
  cell.Linf = newLinf;
  cell.N = newN;
  cell.Ninf = newNinf;
  cell.A = newA;
  cell.Ainf = newAinf;

  return cases;
}

export function advanceYear(grid: Grid, deployments: Deployments): YearResult {
  const next: Grid = grid.map(cloneCell);
  const casesByCell: number[] = new Array(next.length).fill(0);
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
    const c = stepCell(next[i], i, deploys, gates);
    casesByCell[i] = c;
    total += c;
  }

  // Fall rut pulse: extra deer-only mixing before year-end dispersal. Aligns
  // deer redistribution with autumn rut, when adult I. scapularis quest.
  applyDeerHabitatDrift(next, DISPERSAL.deerRutFrac);

  applyDispersal(next);

  return { grid: next, casesThisYear: total, casesByCell, spend };
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
