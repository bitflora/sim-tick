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
    const g = grid((i, c) => { c.D = 5 + (i % 3); c.hab = 0.3 + 0.1 * (i % 5); });
    const before = g.reduce((s, c) => s + c.D, 0);
    applyDeerHabitatDrift(g, 0.4);
    const after = g.reduce((s, c) => s + c.D, 0);
    expect(Math.abs(after - before)).toBeLessThan(1e-9);
  });

  it('habitat drift biases flow toward high-hab neighbors', () => {
    // Two interior cells side by side with equal D but unequal hab. Net
    // movement should favor the higher-hab cell.
    const g = grid((_, c) => { c.D = 0; c.hab = 0.001; });
    // Use cells (2,2) and (2,3) — both interior on default 5x5 grid.
    const a = 2 * GRID_SIZE + 2;
    const b = 2 * GRID_SIZE + 3;
    g[a].D = 10; g[a].hab = 0.2;
    g[b].D = 10; g[b].hab = 0.8;
    applyDeerHabitatDrift(g, 0.5);
    expect(g[b].D).toBeGreaterThan(g[a].D);
  });

  it('long-range jumps reach far cells (global redistribution)', () => {
    const g = grid((_, c) => { c.D = 0; c.hab = 0.5; });
    g[0].D = 100;
    const farIdx = (GRID_SIZE - 1) * GRID_SIZE + (GRID_SIZE - 1);
    expect(g[farIdx].D).toBe(0);
    applyDeerLongRangeJumps(g, 0.02);
    expect(g[farIdx].D).toBeGreaterThan(0);
    // Mass conserved.
    const total = g.reduce((s, c) => s + c.D, 0);
    expect(Math.abs(total - 100)).toBeLessThan(1e-9);
  });

  it('long-range jumps weight by habitat', () => {
    const g = grid((_, c) => { c.D = 0; c.hab = 0.1; });
    g[0].D = 100;
    const low = 12;
    const high = 13;
    g[low].hab = 0.1;
    g[high].hab = 1.0;
    applyDeerLongRangeJumps(g, 0.05);
    expect(g[high].D).toBeGreaterThan(g[low].D);
  });

  it('rut pulse (via advanceYear) only mixes deer, not ticks/mice', () => {
    // Compare a custom advance: tick/mouse pools should be unaffected by the
    // rut pulse since it calls applyDeerHabitatDrift, which only touches D.
    // Easier to test the helper directly: pre/post tick & mouse pools equal.
    const g = grid((_, c) => { c.D = 5; });
    const Lbefore = g.map((c) => c.L);
    const Nbefore = g.map((c) => c.N);
    const Abefore = g.map((c) => c.A);
    const Mbefore = g.map((c) => c.M);
    applyDeerHabitatDrift(g, 0.1);
    for (let i = 0; i < g.length; i++) {
      expect(g[i].L).toBe(Lbefore[i]);
      expect(g[i].N).toBe(Nbefore[i]);
      expect(g[i].A).toBe(Abefore[i]);
      expect(g[i].M).toBe(Mbefore[i]);
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
