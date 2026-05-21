import { describe, it, expect } from 'vitest';
import { advanceYear, makeInitialGrid, makeRng, type Deployments } from '../engine';
import { GRID_SIZE, INIT, LYME } from '../params';
import { makeInitialCell } from '../cell';

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
    expect(r.spend).toBe(181_300 + 12_950);
  });

  it('A1: property-scale interventions show spillover-discounted case reduction', () => {
    // With acaricide everywhere, Ninf crashes (~70% kill via tickSurvivalMul).
    // Naive linear model: cases drop ~70%. With spilloverDiscount=0.5 and a
    // baseline reservoir, cases should drop noticeably less than the Ninf cut.
    let gBase = makeInitialGrid();
    let gTrt = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['acaricide']);
    for (let y = 0; y < 3; y++) {
      gBase = advanceYear(gBase, {}).grid;
      gTrt = advanceYear(gTrt, deploys).grid;
    }
    const baseN = gBase.reduce((s, c) => s + c.Ninf, 0);
    const trtN = gTrt.reduce((s, c) => s + c.Ninf, 0);
    const ninfFrac = trtN / baseN;
    // Run year 4 to compare case counts under same Ninf trajectory.
    const rBase = advanceYear(gBase, {});
    const rTrt = advanceYear(gTrt, deploys);
    const caseFrac = rTrt.casesThisYear / rBase.casesThisYear;
    // Cases should be reduced LESS than Ninf — spillover protects floor.
    expect(caseFrac).toBeGreaterThan(ninfFrac);
    // Sanity: spillover discount of 0.5 means cases can't drop below ~half
    // the baseline-encounter floor even if Ninf hits zero.
    expect(LYME.spilloverDiscount).toBeGreaterThan(0);
  });

  it('A2: fourPoster ramps up over consecutive years', () => {
    // Deploy fourPoster on a cluster ≥ minContiguousCells (A10 gate) so the
    // spatial check doesn't zero it out. Compare yr3 vs yr1+gap.
    const cluster = (): Deployments => {
      const d: Deployments = {};
      for (const i of allCells()) d[i] = new Set(['fourPoster']);
      return d;
    };
    let g1 = makeInitialGrid();
    g1 = advanceYear(g1, cluster()).grid;
    expect(g1[0].consecutiveYears.fourPoster).toBe(1);

    let g3 = makeInitialGrid();
    for (let y = 0; y < 3; y++) g3 = advanceYear(g3, cluster()).grid;
    expect(g3[0].consecutiveYears.fourPoster).toBe(3);
    // After 3 consecutive years, adult pool should be more suppressed than
    // after 1 year of deployment alone (compare cell 0 only).
    let g1cmp = makeInitialGrid();
    // First-year only, then 2 more skipped years.
    g1cmp = advanceYear(g1cmp, cluster()).grid;
    for (let y = 0; y < 2; y++) g1cmp = advanceYear(g1cmp, {}).grid;
    expect(g3[0].A).toBeLessThan(g1cmp[0].A);
  });

  it('A2: fourPoster consecutiveYears resets on skipped year', () => {
    let g = makeInitialGrid();
    const deploys: Deployments = { 0: new Set(['fourPoster']) };
    g = advanceYear(g, deploys).grid;
    g = advanceYear(g, deploys).grid;
    expect(g[0].consecutiveYears.fourPoster).toBe(2);
    g = advanceYear(g, {}).grid;
    expect(g[0].consecutiveYears.fourPoster).toBeUndefined();
    g = advanceYear(g, deploys).grid;
    expect(g[0].consecutiveYears.fourPoster).toBe(1);
  });

  it('A3: tickTubes does not double-count larva kill at egg->larva step', () => {
    // Solo tick tubes deploy. Year-over-year nymph reduction should reflect
    // ONE 60% kill on the larva->nymph cohort, not two compounded kills.
    let gBase = makeInitialGrid();
    let gTube = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['tickTubes']);
    gBase = advanceYear(gBase, {}).grid;
    gTube = advanceYear(gTube, deploys).grid;
    const baseN = gBase.reduce((s, c) => s + c.N, 0);
    const tubeN = gTube.reduce((s, c) => s + c.N, 0);
    // tubes apply larvaSurvivalMul=0.40 and nymphSurvivalMul=0.55 once on the
    // L->N transition. Ratio should be near 0.40*0.55=0.22 of baseline (modulo
    // saturation effects). With the old double-count bug it was 0.40*0.22~0.09.
    expect(tubeN / baseN).toBeGreaterThan(0.15);
    expect(tubeN / baseN).toBeLessThan(0.30);
  });

  it('A5: deer feeding collapses below 0.05 deer/ha', () => {
    // Set deer near zero on cell 0 and advance — eggs->larva should be ~0
    // (hard floor); the L cohort next year crashes.
    const g = makeInitialGrid();
    g[0] = makeInitialCell();
    g[0].D = 0.04; // below threshold
    const r = advanceYear(g, {});
    // New larvae for cell 0 should be ~zero (no egg production allowed).
    expect(r.grid[0].L).toBeLessThan(1);
  });

  it('deer fencing persists across years without redeployment', () => {
    // Deploy on whole grid (clears A10 gate threshold of 6).
    let g = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['deerFencing']);
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

  it('deerFencing on a single cell now works (1 sq mi >> 15-ac threshold)', () => {
    let gFence = makeInitialGrid();
    let gBase = makeInitialGrid();
    const single: Deployments = { 0: new Set(['deerFencing']) };
    gFence = advanceYear(gFence, single).grid;
    gBase = advanceYear(gBase, {}).grid;
    expect(gFence[0].persistEffects.deerFencing).toBe(9);
    expect(gFence[0].A).toBeLessThan(gBase[0].A * 0.6);
  });

  it('deerFencing cost is charged on deploy', () => {
    const g = makeInitialGrid();
    const r = advanceYear(g, { 0: new Set(['deerFencing']) });
    expect(r.spend).toBe(240_000);
  });

  it('D5: combined messaging+doxy+vaccine clamped at humanTransmissionFloor', () => {
    // 0.80 × 0.65 × 0.27 = 0.140 raw; floor at 0.20 caps it.
    const gBase = makeInitialGrid();
    const gAll = makeInitialGrid();
    const stack: Deployments = {};
    for (const i of allCells()) stack[i] = new Set(['messaging', 'doxyProphylaxis', 'lymeVaccine']);
    const rBase = advanceYear(gBase, {});
    const rStack = advanceYear(gAll, stack);
    const ratio = rStack.casesThisYear / rBase.casesThisYear;
    // Floor 0.20 → at least 20% of baseline cases survive.
    expect(ratio).toBeGreaterThan(0.19);
    // But should be at or near floor (not 14%).
    expect(ratio).toBeLessThan(0.22);
  });

  it('A11: reservoirVaccine reduces transmission without affecting tick density', () => {
    // RTV blocks transmission at the mouse-tick interface. Compare year-1
    // mouse infection acquisition (pre-saturation) and confirm direction.
    const gBase = makeInitialGrid();
    const gRtv = makeInitialGrid();
    const deploys: Deployments = {};
    for (const i of allCells()) deploys[i] = new Set(['reservoirVaccine']);
    let gB = gBase, gR = gRtv;
    let casesB = 0, casesR = 0;
    for (let y = 0; y < 3; y++) {
      const rB = advanceYear(gB, {});
      const rR = advanceYear(gR, deploys);
      gB = rB.grid; gR = rR.grid;
      casesB += rB.casesThisYear; casesR += rR.casesThisYear;
    }
    // Nymph density unchanged (within 1%) — no tick-survival effect.
    const nBase = gB.reduce((s, c) => s + c.N, 0);
    const nRtv = gR.reduce((s, c) => s + c.N, 0);
    expect(Math.abs(nRtv - nBase) / nBase).toBeLessThan(0.01);
    // Mouse infection grew less under RTV.
    const minfBase = gB.reduce((s, c) => s + c.Minf, 0);
    const minfRtv = gR.reduce((s, c) => s + c.Minf, 0);
    expect(minfRtv).toBeLessThan(minfBase);
    // Cumulative cases lower under RTV (yr2+ via less-infected nymphs).
    expect(casesR).toBeLessThan(casesB);
  });

  it('calibration: 20-yr no-intervention run holds nymph density within ±30% of INIT', () => {
    // R0 ≈ 1 at endemic host densities (research/tick-growth.md §2). Verify
    // behaviorally: total nymphs across grid stay bounded over a long run.
    const rng = makeRng(42);
    let g = makeInitialGrid();
    const baselineN = INIT.N * GRID_SIZE * GRID_SIZE;
    let minN = Infinity, maxN = -Infinity;
    for (let y = 0; y < 20; y++) {
      g = advanceYear(g, {}, rng).grid;
      const totalN = g.reduce((s, c) => s + c.N, 0);
      if (totalN < minN) minN = totalN;
      if (totalN > maxN) maxN = totalN;
    }
    expect(minN).toBeGreaterThan(baselineN * 0.7);
    expect(maxN).toBeLessThan(baselineN * 1.3);
  });

  it('calibration: stochastic noise produces per-cell year-to-year fluctuation', () => {
    // Coefficient of variation of per-cell nymph counts across years should be
    // in [0.05, 0.5] — i.e. visible but bounded. Lit CV 0.3–0.6 (research §6).
    const rng = makeRng(7);
    let g = makeInitialGrid();
    const seriesByCell: number[][] = Array.from({ length: g.length }, () => []);
    // Warm up a couple of years so transient initial dynamics settle.
    for (let y = 0; y < 3; y++) g = advanceYear(g, {}, rng).grid;
    for (let y = 0; y < 15; y++) {
      g = advanceYear(g, {}, rng).grid;
      g.forEach((c, i) => seriesByCell[i].push(c.N));
    }
    const cvs: number[] = [];
    for (const s of seriesByCell) {
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      const variance = s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length;
      cvs.push(Math.sqrt(variance) / mean);
    }
    const avgCv = cvs.reduce((a, b) => a + b, 0) / cvs.length;
    expect(avgCv).toBeGreaterThan(0.05);
    expect(avgCv).toBeLessThan(0.5);
  });

  it('calibration: Monhegan threshold — cell with zero deer collapses adult ticks', () => {
    // With DEER.K=0.5/ha and kDeerHalf=0.15, a cell with D forced to ~0 should
    // see its adult cohort decay toward zero within a few years (no reproduction,
    // adult overwinter survival 0.40 compounding).
    let g = makeInitialGrid();
    g[0].D = 0;
    g[0].M = 0; // also kill mice so dispersal can't reseed too fast
    for (let y = 0; y < 5; y++) {
      g = advanceYear(g, {}).grid;
      g[0].D = 0; // hold deer at zero (override dispersal pull)
    }
    // Compare to baseline cell on a separate grid (not contaminated by
    // dispersal from cell 0).
    let baseline = makeInitialGrid();
    for (let y = 0; y < 5; y++) baseline = advanceYear(baseline, {}).grid;
    expect(g[0].A).toBeLessThan(baseline[0].A * 0.2);
  });

  it('A10: deerFencing on contiguous row of 6 cells clears gate', () => {
    // 6-cell horizontal line in a 5x5 grid → wraps into 2 rows? GRID_SIZE=5
    // default → row 0 cells [0..4] + cell 5 (row 1 col 0). Connected via
    // cell 0-5 (col 0). So 6 cells: 0,1,2,3,4,5. All connected.
    let g = makeInitialGrid();
    const deploys: Deployments = { 0: new Set(['deerFencing']) };
    for (let i = 1; i <= 5; i++) deploys[i] = new Set(['deerFencing']);
    g = advanceYear(g, deploys).grid;
    // After deploy, cell 0 should see fencing effect: adult survival cut to
    // ~0.20 × 0.30 = 0.06 of baseline tickSurvival contribution.
    const baseline = makeInitialGrid();
    const b = advanceYear(baseline, {}).grid;
    expect(g[0].A).toBeLessThan(b[0].A * 0.6);
  });
});
