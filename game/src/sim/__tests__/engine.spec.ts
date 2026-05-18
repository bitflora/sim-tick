import { describe, it, expect } from 'vitest';
import { advanceYear, makeInitialGrid, type Deployments } from '../engine';
import { GRID_SIZE, INIT } from '../params';

const allCells = (): number[] => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

describe('engine', () => {
  it('baseline grid advances without crashing and produces cases', () => {
    let g = makeInitialGrid();
    let totalCases = 0;
    for (let y = 0; y < 5; y++) {
      const r = advanceYear(g, {});
      g = r.grid;
      totalCases += r.casesThisYear;
    }
    expect(totalCases).toBeGreaterThan(0);
    expect(g.length).toBe(GRID_SIZE * GRID_SIZE);
  });

  it('acaricide everywhere crashes tick population', () => {
    let g = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['acaricide']);
    for (let y = 0; y < 3; y++) g = advanceYear(g, deploys).grid;
    const totalN = g.reduce((s, c) => s + c.N, 0);
    const baselineN = INIT.N * GRID_SIZE * GRID_SIZE;
    expect(totalN).toBeLessThan(baselineN * 0.2);
  });

  it('messaging only reduces human cases without changing tick density', () => {
    const gBase = makeInitialGrid();
    const gMsg = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['messaging']);
    const rBase = advanceYear(gBase, {});
    const rMsg = advanceYear(gMsg, deploys);
    const nBase = rBase.grid.reduce((s, c) => s + c.N, 0);
    const nMsg = rMsg.grid.reduce((s, c) => s + c.N, 0);
    expect(Math.abs(nBase - nMsg)).toBeLessThan(1e-6);
    expect(rMsg.casesThisYear).toBeLessThan(rBase.casesThisYear);
  });

  it('budget spend matches deployment costs', () => {
    const g = makeInitialGrid();
    const deploys: Deployments = { 0: new Set(['acaricide', 'messaging']) };
    const r = advanceYear(g, deploys);
    expect(r.spend).toBe(700 + 50);
  });

  it('deer fencing persists across years without redeployment', () => {
    let g = makeInitialGrid();
    const deploys: Deployments = { 0: new Set(['deerFencing']) };
    g = advanceYear(g, deploys).grid;
    expect(g[0].persistEffects.deerFencing).toBe(9);
    // Advance 3 more years with no deployments; counter decrements.
    for (let y = 0; y < 3; y++) g = advanceYear(g, {}).grid;
    expect(g[0].persistEffects.deerFencing).toBe(6);
    // Adult ticks should be heavily suppressed compared to baseline.
    const baseline = makeInitialGrid();
    let b = baseline;
    for (let y = 0; y < 4; y++) b = advanceYear(b, {}).grid;
    expect(g[0].A).toBeLessThan(b[0].A * 0.6);
  });
});
