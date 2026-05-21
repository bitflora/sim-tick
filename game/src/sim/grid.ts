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
export function applyDeerHabitatDrift(
  grid: Grid,
  frac: number,
  flows?: Flow[],
  fenced?: boolean[],
) {
  const D = grid.map((c) => c.D);
  const delta = new Array(grid.length).fill(0);
  for (let i = 0; i < grid.length; i++) {
    // Fenced cells: no deer in or out. Trapped pop stays put this step.
    if (fenced?.[i]) continue;
    const out = D[i] * frac;
    if (out === 0) continue;
    // Exclude fenced neighbors — they don't accept incoming deer.
    const ns = neighbors(i).filter((n) => !fenced?.[n]);
    if (ns.length === 0) continue; // surrounded by fences: deer stay home
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
      // All eligible neighbors zero-habitat: fall back to uniform split.
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
// Line-of-sight check: does the straight segment from cell `from` to cell `to`
// pass through any fenced cell (other than the endpoints)? Sampled along the
// segment at sub-cell granularity — fences are physical barriers, so a jump
// whose path crosses one is blocked.
function pathBlocked(from: number, to: number, fenced?: boolean[]): boolean {
  if (!fenced) return false;
  const [r0, c0] = rcOf(from);
  const [r1, c1] = rcOf(to);
  const dr = r1 - r0;
  const dc = c1 - c0;
  const span = Math.max(Math.abs(dr), Math.abs(dc));
  if (span === 0) return false;
  const steps = span * 10;
  for (let s = 1; s < steps; s++) {
    const r = Math.round(r0 + (dr * s) / steps);
    const c = Math.round(c0 + (dc * s) / steps);
    const i = idx(r, c);
    if (i !== from && i !== to && fenced[i]) return true;
  }
  return false;
}

export function applyDeerLongRangeJumps(
  grid: Grid,
  frac: number,
  flows?: Flow[],
  fenced?: boolean[],
) {
  // Per-source distribution: each non-fenced cell sends `frac` of its deer
  // to other non-fenced cells, weighted by destination habitat, but only to
  // destinations whose line-of-sight from the source isn't blocked by a fence.
  // If a source has no reachable destinations, its deer stay home.
  const N = grid.length;
  const delta = new Array(N).fill(0);
  const sampledFlows: Flow[] | undefined = flows ? [] : undefined;

  for (let i = 0; i < N; i++) {
    if (fenced?.[i]) continue;
    const out = grid[i].D * frac;
    if (out <= 0) continue;

    // Build reachable destination set with habitat weights.
    const dests: number[] = [];
    const weights: number[] = [];
    let W = 0;
    for (let j = 0; j < N; j++) {
      if (j === i || fenced?.[j]) continue;
      if (pathBlocked(i, j, fenced)) continue;
      dests.push(j);
      const w = grid[j].hab;
      weights.push(w);
      W += w;
    }
    if (dests.length === 0) continue; // no reachable dest: deer stay home
    delta[i] -= out;
    if (W > 0) {
      for (let k = 0; k < dests.length; k++) delta[dests[k]] += out * (weights[k] / W);
    } else {
      const share = out / dests.length;
      for (const d of dests) delta[d] += share;
    }

    // Animation: sample one representative destination.
    if (sampledFlows) {
      let dst = -1;
      if (W > 0) {
        let r = Math.random() * W;
        for (let k = 0; k < dests.length; k++) {
          r -= weights[k];
          if (r <= 0) { dst = dests[k]; break; }
        }
        if (dst === -1) dst = dests[dests.length - 1];
      } else {
        dst = dests[Math.floor(Math.random() * dests.length)];
      }
      sampledFlows.push({ from: i, to: dst, kind: 'deer', amount: out });
    }
  }

  for (let i = 0; i < N; i++) grid[i].D += delta[i];
  if (flows && sampledFlows) flows.push(...sampledFlows);
}

export function applyDispersal(grid: Grid, flows?: Flow[], fenced?: boolean[]) {
  // Adults (with proportional infected fraction).
  disperseField(grid, (c) => c.A, (c, v) => { const ratio = c.A > 0 ? c.Ainf / c.A : 0; c.A = v; c.Ainf = v * ratio; }, DISPERSAL.tickAdultFrac, flows, 'tickA');
  // Mice.
  disperseField(grid, (c) => c.M, (c, v) => { const ratio = c.M > 0 ? c.Minf / c.M : 0; c.M = v; c.Minf = v * ratio; }, DISPERSAL.mouseFrac, flows, 'mouse');
  // Deer: habitat-weighted local drift, then rare long-range jumps.
  // `fenced` blocks deer in/out of marked cells (deerFencing intervention).
  applyDeerHabitatDrift(grid, DISPERSAL.deerMixFrac, flows, fenced);
  applyDeerLongRangeJumps(grid, DISPERSAL.deerJumpFrac, flows, fenced);
}
