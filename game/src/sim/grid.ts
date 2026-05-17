import { GRID_SIZE, DISPERSAL } from './params';
import type { CellState } from './cell';

export type Grid = CellState[];

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
function disperseField(grid: Grid, get: (c: CellState) => number, set: (c: CellState, v: number) => void, frac: number) {
  const before = grid.map(get);
  const delta = new Array(grid.length).fill(0);
  for (let i = 0; i < grid.length; i++) {
    const out = before[i] * frac;
    // Outflux split into 4 directions regardless of edge (edges lose to sink).
    const share = out / 4;
    delta[i] -= out;
    for (const n of neighbors(i)) delta[n] += share;
  }
  for (let i = 0; i < grid.length; i++) set(grid[i], before[i] + delta[i]);
}

export function applyDispersal(grid: Grid) {
  // Adults (with proportional infected fraction).
  disperseField(grid, (c) => c.A, (c, v) => { const ratio = c.A > 0 ? c.Ainf / c.A : 0; c.A = v; c.Ainf = v * ratio; }, DISPERSAL.tickAdultFrac);
  // Mice.
  disperseField(grid, (c) => c.M, (c, v) => { const ratio = c.M > 0 ? c.Minf / c.M : 0; c.M = v; c.Minf = v * ratio; }, DISPERSAL.mouseFrac);
  // Deer: pull each cell toward 4-neighbor mean.
  const before = grid.map((c) => c.D);
  for (let i = 0; i < grid.length; i++) {
    const ns = neighbors(i);
    const mean = ns.reduce((s, n) => s + before[n], 0) / ns.length;
    grid[i].D = before[i] + DISPERSAL.deerMixFrac * (mean - before[i]);
  }
}
