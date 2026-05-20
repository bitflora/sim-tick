import { GRID_SIZE, DISPERSAL } from './params';
import type { CellState } from './cell';

export type Grid = CellState[];

export type FlowKind = 'tickA' | 'mouse' | 'deer';
export interface Flow {
  from: number;
  to: number;
  kind: FlowKind;
  amount: number;
}

export function idx(r: number, c: number): number {
  return r * GRID_SIZE + c;
}

export function rcOf(i: number): [number, number] {
  return [Math.floor(i / GRID_SIZE), i % GRID_SIZE];
}

export function neighbors(i: number): number[] {
  const [r, c] = rcOf(i);
  const out: number[] = [];
  if (r > 0) out.push(idx(r - 1, c));
  if (r < GRID_SIZE - 1) out.push(idx(r + 1, c));
  if (c > 0) out.push(idx(r, c - 1));
  if (c < GRID_SIZE - 1) out.push(idx(r, c + 1));
  return out;
}

// In-place dispersal: redistribute a fraction of each cell's quantity equally
// among its 4 neighbors. Boundary cells lose flux off-map (sink).
function disperseField(
  grid: Grid,
  get: (c: CellState) => number,
  set: (c: CellState, v: number) => void,
  frac: number,
  flows?: Flow[],
  kind?: FlowKind,
) {
  const before = grid.map(get);
  const delta = new Array(grid.length).fill(0);
  for (let i = 0; i < grid.length; i++) {
    const out = before[i] * frac;
    // Outflux split into 4 directions regardless of edge (edges lose to sink).
    const share = out / 4;
    delta[i] -= out;
    for (const n of neighbors(i)) {
      delta[n] += share;
      if (flows && kind && share > 0) flows.push({ from: i, to: n, kind, amount: share });
    }
  }
  for (let i = 0; i < grid.length; i++) set(grid[i], before[i] + delta[i]);
}

// Habitat-weighted local drift for deer. Mass-conserving within the grid
// (no off-map sink): deer leaving cell i are split across in-bounds 4-neighbors
// in proportion to neighbor habitat. Matches yarding + edge-selection
// behavior — deer drift toward higher-habitat cells rather than smoothing
// uniformly toward the neighbor mean.
export function applyDeerHabitatDrift(grid: Grid, frac: number, flows?: Flow[]) {
  const D = grid.map((c) => c.D);
  const delta = new Array(grid.length).fill(0);
  for (let i = 0; i < grid.length; i++) {
    const out = D[i] * frac;
    if (out === 0) continue;
    const ns = neighbors(i);
    let W = 0;
    for (const n of ns) W += grid[n].hab;
    delta[i] -= out;
    if (W > 0) {
      for (const n of ns) {
        const amt = out * (grid[n].hab / W);
        delta[n] += amt;
        if (flows && amt > 0) flows.push({ from: i, to: n, kind: 'deer', amount: amt });
      }
    } else {
      // All neighbors zero-habitat: fall back to uniform split (still in-bounds).
      const share = out / ns.length;
      for (const n of ns) {
        delta[n] += share;
        if (flows && share > 0) flows.push({ from: i, to: n, kind: 'deer', amount: share });
      }
    }
  }
  for (let i = 0; i < grid.length; i++) grid[i].D = D[i] + delta[i];
}

// Long-range deer jumps: a small share of each cell's deer enter a global
// pool, then redistribute across the whole grid weighted by habitat. Captures
// yearling-buck natal dispersal (median 5.77 km) and rut excursions that
// reseed adult-tick (and pathogen) supply into cells the local kernel
// never reaches.
export function applyDeerLongRangeJumps(grid: Grid, frac: number) {
  let pool = 0;
  let habTotal = 0;
  for (const c of grid) {
    pool += c.D * frac;
    habTotal += c.hab;
  }
  if (pool === 0) return;
  for (const c of grid) c.D *= 1 - frac;
  if (habTotal > 0) {
    for (const c of grid) c.D += pool * (c.hab / habTotal);
  } else {
    const share = pool / grid.length;
    for (const c of grid) c.D += share;
  }
}

export function applyDispersal(grid: Grid, flows?: Flow[]) {
  // Adults (with proportional infected fraction).
  disperseField(grid, (c) => c.A, (c, v) => { const ratio = c.A > 0 ? c.Ainf / c.A : 0; c.A = v; c.Ainf = v * ratio; }, DISPERSAL.tickAdultFrac, flows, 'tickA');
  // Mice.
  disperseField(grid, (c) => c.M, (c, v) => { const ratio = c.M > 0 ? c.Minf / c.M : 0; c.M = v; c.Minf = v * ratio; }, DISPERSAL.mouseFrac, flows, 'mouse');
  // Deer: habitat-weighted local drift, then rare long-range jumps.
  applyDeerHabitatDrift(grid, DISPERSAL.deerMixFrac, flows);
  // Long-range jumps are global redistribution, not per-cell flows; skip in animation.
  applyDeerLongRangeJumps(grid, DISPERSAL.deerJumpFrac);
}
