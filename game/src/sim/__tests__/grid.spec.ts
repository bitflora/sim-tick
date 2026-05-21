import { describe, it, expect } from 'vitest';
import { applyDeerHabitatDrift, applyDeerLongRangeJumps } from '../grid';
import { GRID_SIZE } from '../params';
import { makeInitialCell } from '../cell';
import { advanceYear, makeInitialGrid } from '../engine';

function grid(set: (i: number, c: ReturnType<typeof makeInitialCell>) => void) {
  const g = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const c = makeInitialCell();
    set(i, c);
    g.push(c);
  }
  return g;
}

describe('grid — deer dispersal', () => {
  it('habitat drift conserves total deer (no off-map sink)', () => {
    const g = grid((i, c) => { c.deer = 5 + (i % 3); c.habitat = 0.3 + 0.1 * (i % 5); });
    const before = g.reduce((s, c) => s + c.deer, 0);
    applyDeerHabitatDrift(g, 0.4);
    const after = g.reduce((s, c) => s + c.deer, 0);
    expect(Math.abs(after - before)).toBeLessThan(1e-9);
  });

  it('habitat drift biases flow toward high-habitat neighbors', () => {
    // Two interior cells side by side with equal deer but unequal habitat.
    // Net movement should favor the higher-habitat cell.
    const g = grid((_, c) => { c.deer = 0; c.habitat = 0.001; });
    // Use cells (2,2) and (2,3) — both interior on default 5x5 grid.
    const a = 2 * GRID_SIZE + 2;
    const b = 2 * GRID_SIZE + 3;
    g[a].deer = 10; g[a].habitat = 0.2;
    g[b].deer = 10; g[b].habitat = 0.8;
    applyDeerHabitatDrift(g, 0.5);
    expect(g[b].deer).toBeGreaterThan(g[a].deer);
  });

  it('long-range jumps reach far cells (global redistribution)', () => {
    const g = grid((_, c) => { c.deer = 0; c.habitat = 0.5; });
    g[0].deer = 100;
    const farIdx = (GRID_SIZE - 1) * GRID_SIZE + (GRID_SIZE - 1);
    expect(g[farIdx].deer).toBe(0);
    applyDeerLongRangeJumps(g, 0.02);
    expect(g[farIdx].deer).toBeGreaterThan(0);
    // Mass conserved.
    const total = g.reduce((s, c) => s + c.deer, 0);
    expect(Math.abs(total - 100)).toBeLessThan(1e-9);
  });

  it('long-range jumps weight by habitat', () => {
    const g = grid((_, c) => { c.deer = 0; c.habitat = 0.1; });
    g[0].deer = 100;
    const low = 12;
    const high = 13;
    g[low].habitat = 0.1;
    g[high].habitat = 1.0;
    applyDeerLongRangeJumps(g, 0.05);
    expect(g[high].deer).toBeGreaterThan(g[low].deer);
  });

  it('rut pulse (via advanceYear) only mixes deer, not ticks/mice', () => {
    // Compare a custom advance: tick/mouse pools should be unaffected by the
    // rut pulse since it calls applyDeerHabitatDrift, which only touches deer.
    // Easier to test the helper directly: pre/post tick & mouse pools equal.
    const g = grid((_, c) => { c.deer = 5; });
    const larvaeBefore = g.map((c) => c.larvae);
    const nymphsBefore = g.map((c) => c.nymphs);
    const adultsBefore = g.map((c) => c.adults);
    const miceBefore = g.map((c) => c.mice);
    applyDeerHabitatDrift(g, 0.1);
    for (let i = 0; i < g.length; i++) {
      expect(g[i].larvae).toBe(larvaeBefore[i]);
      expect(g[i].nymphs).toBe(nymphsBefore[i]);
      expect(g[i].adults).toBe(adultsBefore[i]);
      expect(g[i].mice).toBe(miceBefore[i]);
    }
  });

  it('full advanceYear still produces nonzero cases (regression guard)', () => {
    let g = makeInitialGrid();
    let cases = 0;
    for (let y = 0; y < 3; y++) {
      const r = advanceYear(g, {});
      g = r.grid;
      cases += r.casesThisYear;
    }
    expect(cases).toBeGreaterThan(0);
  });
});
