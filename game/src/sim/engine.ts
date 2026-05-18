import { TICK, MOUSE, DEER, GRID_SIZE } from './params';
import type { CellState } from './cell';
import { cloneCell, makeInitialCell } from './cell';
import {
  INTERVENTIONS,
  emptyModifiers,
  type InterventionId,
  type Modifiers,
} from './interventions';
import { applyDispersal, type Grid } from './grid';
import { updateMouseInfection, fracNewNymphInfected } from './infection';

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

function modifiersFor(cell: CellState, deploys: Set<InterventionId> | undefined): Modifiers {
  const m = emptyModifiers();
  // Apply this year's fresh deployments.
  if (deploys) {
    for (const id of deploys) INTERVENTIONS[id].apply(m);
  }
  // Apply carry-over from prior years' multi-year interventions. Skip any
  // intervention that was also deployed fresh this year (already applied).
  for (const [id, years] of Object.entries(cell.persistEffects) as [InterventionId, number][]) {
    if (years > 0 && !deploys?.has(id)) {
      INTERVENTIONS[id].apply(m);
    }
  }
  return m;
}

function saturation(host: number, kHalf: number): number {
  return host / (kHalf + host);
}

function stepCell(cell: CellState, deploys: Set<InterventionId> | undefined): number {
  const mods = modifiersFor(cell, deploys);

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

  // 2. Tick reproduction: eggs from adults need deer for blood meal.
  const adultFeedSat = saturation(cell.D, TICK.kDeerHalf);
  const eggsToLarvae =
    cell.A * adultFeedSat * TICK.eggsPerAdult * TICK.sEggToLarva *
    mods.tickSurvivalMul * mods.larvaSurvivalMul * cell.hab;

  // 3. Larva -> nymph: needs mouse availability.
  const mouseSat = saturation(cell.M, TICK.kMouseHalf);
  const larvaToNymph = cell.L * TICK.sLarvaToNymph * mouseSat *
    mods.tickSurvivalMul * mods.nymphSurvivalMul * cell.hab;

  // Fraction of new nymphs that are infected (from feeding on infected mice).
  const newNymphInfFrac = fracNewNymphInfected(cell);

  // 4. Nymph -> adult: also needs hosts (mice + deer combined).
  const nymphFeedSat = 0.5 * mouseSat + 0.5 * adultFeedSat;
  const nymphToAdult = cell.N * TICK.sNymphToAdult * nymphFeedSat *
    mods.tickSurvivalMul * cell.hab;
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

  // 6. Mouse + deer logistic.
  cell.M = Math.max(0, cell.M + MOUSE.r * cell.M * (1 - cell.M / MOUSE.K));
  // Lose proportional infected mice if total declines.
  cell.Minf = Math.min(cell.Minf, cell.M);
  cell.D = Math.max(0, cell.D + DEER.r * cell.D * (1 - cell.D / DEER.K));

  // Update Lyme in mice + accrue human cases (uses NEW nymph counts? No — uses
  // last year's nymph pool for exposure; we update mouse infection BEFORE
  // overwriting N to keep this clear.)
  const cases = updateMouseInfection(cell, mods.humanTransmissionMul);

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

  for (let i = 0; i < next.length; i++) {
    const deploys = deployments[i];
    if (deploys) for (const id of deploys) spend += INTERVENTIONS[id].cost;
    const c = stepCell(next[i], deploys);
    casesByCell[i] = c;
    total += c;
  }

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
