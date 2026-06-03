// Strategy search: which intervention combinations actually drive ticks +
// Lyme to local extinction within a 15-year horizon? Run as part of the
// suite (`npm test`); also prints a sorted report when STRATEGY_REPORT=1.
//
// Eradication criteria (per run):
//   - terminal total nymphs across grid < 5 (≈ 0 ticks/ha given 25 cells)
//   - terminal total adults < 5
//   - terminal cumulative cases in last year == 0 (rounded)
//
// We use a deterministic RNG seed so the same strategy returns the same
// outcome every run; this makes the report stable and CI-friendly.

import { describe, it, expect } from 'vitest';
import { advanceYear, makeInitialGrid, makeRng, type Deployments } from '../engine';
import { GRID_SIZE } from '../params';
import { INTERVENTIONS, type InterventionId } from '../interventions';

const N_CELLS = GRID_SIZE * GRID_SIZE;
const allCells = () => Array.from({ length: N_CELLS }, (_, i) => i);

interface Strategy {
  name: string;
  // Year-by-year deployment plan. ids[yearIdx] = set deployed in every cell.
  // Undefined => no deployments that year.
  perYear: (Array<InterventionId> | undefined)[];
}

function runStrategy(s: Strategy, years: number, seed = 42) {
  const rng = makeRng(seed);
  let g = makeInitialGrid();
  let totalCases = 0;
  let totalSpend = 0;
  let lastYearCases = 0;
  for (let y = 0; y < years; y++) {
    const ids = s.perYear[y];
    const deploys: Deployments = {};
    if (ids && ids.length > 0) {
      for (const i of allCells()) deploys[i] = new Set(ids);
    }
    const r = advanceYear(g, deploys, rng);
    g = r.grid;
    totalCases += r.casesThisYear;
    totalSpend += r.spend;
    lastYearCases = r.casesThisYear;
  }
  const N = g.reduce((s, c) => s + c.nymphs, 0);
  const A = g.reduce((s, c) => s + c.adults, 0);
  const L = g.reduce((s, c) => s + c.larvae, 0);
  return { N, A, L, totalCases, totalSpend, lastYearCases };
}

function eradicated(r: ReturnType<typeof runStrategy>) {
  return r.N < 5 && r.A < 5 && Math.round(r.lastYearCases) === 0;
}

// Helper builders for plans.
const sustained = (ids: InterventionId[], years: number): Strategy['perYear'] =>
  Array.from({ length: years }, () => ids);
const frontLoaded = (
  heavy: InterventionId[],
  heavyYears: number,
  taper: InterventionId[],
  totalYears: number,
): Strategy['perYear'] => {
  const out: Strategy['perYear'] = [];
  for (let y = 0; y < totalYears; y++) out.push(y < heavyYears ? heavy : taper);
  return out;
};

const HORIZON = 15;

const STRATEGIES: Strategy[] = [
  { name: 'baseline (no intervention)', perYear: sustained([], HORIZON) },
  { name: 'acaricide every year', perYear: sustained(['acaricide'], HORIZON) },
  { name: 'tickTubes every year', perYear: sustained(['tickTubes'], HORIZON) },
  { name: 'fungal every year', perYear: sustained(['fungalBiocontrol'], HORIZON) },
  { name: 'deerCull every year', perYear: sustained(['deerCull'], HORIZON) },
  { name: 'deerFencing (1-shot, persists 10y)', perYear: [['deerFencing'], ...Array(HORIZON - 1).fill(undefined)] as Strategy['perYear'] },
  {
    name: 'property stack: acaricide + tubes + baitBox',
    perYear: sustained(['acaricide', 'tickTubes', 'baitBox'], HORIZON),
  },
  {
    name: 'biocontrol stack: fungal + tubes + baitBox',
    perYear: sustained(['fungalBiocontrol', 'tickTubes', 'baitBox'], HORIZON),
  },
  {
    name: 'host crash: deerCull + 4poster + fungal',
    perYear: sustained(['deerCull', 'fourPoster', 'fungalBiocontrol'], HORIZON),
  },
  {
    name: 'kitchen-sink (all tick-targeting)',
    perYear: sustained(
      ['acaricide', 'tickTubes', 'baitBox', 'fourPoster', 'fungalBiocontrol', 'habitatMgmt', 'deerCull'],
      HORIZON,
    ),
  },
  {
    name: 'front-loaded crash → fungal maintenance',
    perYear: frontLoaded(
      ['acaricide', 'deerCull', 'fourPoster', 'tickTubes', 'fungalBiocontrol'],
      4,
      ['fungalBiocontrol', 'tickTubes'],
      HORIZON,
    ),
  },
  {
    name: 'fence + cull + biocontrol (perimeter strategy)',
    perYear: [
      ['deerFencing', 'deerCull', 'fourPoster', 'fungalBiocontrol', 'tickTubes'],
      ...Array.from({ length: HORIZON - 1 }, () => ['fungalBiocontrol', 'tickTubes'] as InterventionId[]),
    ],
  },
];

describe('eradication strategy search', () => {
  const results = STRATEGIES.map((s) => ({ s, r: runStrategy(s, HORIZON) }));

  it('produces a result for every strategy', () => {
    expect(results.length).toBe(STRATEGIES.length);
  });

  it('baseline does NOT eradicate (sanity)', () => {
    const base = results.find((x) => x.s.name.startsWith('baseline'))!;
    expect(eradicated(base.r)).toBe(false);
  });

  it('fungal-only eradication is robust across RNG seeds', () => {
    const strat = STRATEGIES.find((s) => s.name === 'fungal every year')!;
    const seeds = [1, 7, 42, 1234, 99999];
    for (const seed of seeds) {
      const r = runStrategy(strat, HORIZON, seed);
      expect(eradicated(r), `seed=${seed} N=${r.N} A=${r.A} cases=${r.lastYearCases}`).toBe(true);
    }
  });

  it('property-scale-only strategies CANNOT eradicate cases (spillover floor)', () => {
    // Hinckley 2016 finding encoded: in-yard QN can crash to 0 but residents
    // are still bitten on hikes/parks. Confirms the sim faithfully reproduces
    // the "QN ↓ but HC null" RCT result.
    const propOnly = results.find((x) => x.s.name.startsWith('property stack'))!;
    expect(propOnly.r.N).toBeLessThan(50);
    expect(Math.round(propOnly.r.lastYearCases)).toBeGreaterThan(0);
  });

  it('at least one strategy achieves full eradication within horizon', () => {
    const wins = results.filter((x) => eradicated(x.r));
    if (wins.length === 0) {
      const summary = results
        .slice()
        .sort((a, b) => a.r.N + a.r.A - (b.r.N + b.r.A))
        .map((x) => `  ${x.s.name}: N=${x.r.N.toFixed(0)} A=${x.r.A.toFixed(0)} cases/yr=${x.r.lastYearCases.toFixed(1)}`)
        .join('\n');
      throw new Error(`No strategy eradicated within ${HORIZON} years.\n${summary}`);
    }
    expect(wins.length).toBeGreaterThan(0);
  });

  it('REPORT: ranked strategy outcomes', () => {
    const sorted = results.slice().sort((a, b) => {
      const ae = eradicated(a.r) ? 0 : 1;
      const be = eradicated(b.r) ? 0 : 1;
      if (ae !== be) return ae - be;
      // tiebreak: lower N+A wins, then lower cost
      const aRem = a.r.N + a.r.A;
      const bRem = b.r.N + b.r.A;
      if (aRem !== bRem) return aRem - bRem;
      return a.r.totalSpend - b.r.totalSpend;
    });
    const lines = [
      '',
      `Eradication strategy search — ${HORIZON}-yr horizon, ${N_CELLS}-cell grid, seed=42`,
      '─'.repeat(96),
      'rank  ✓  strategy                                                  N       A     cases  $M',
      '─'.repeat(96),
      ...sorted.map((x, i) => {
        const ok = eradicated(x.r) ? '✓' : ' ';
        const name = x.s.name.padEnd(55);
        const N = x.r.N.toFixed(0).padStart(8);
        const A = x.r.A.toFixed(0).padStart(6);
        const cs = x.r.lastYearCases.toFixed(1).padStart(7);
        const spend = (x.r.totalSpend / 1e6).toFixed(1).padStart(5);
        return `${String(i + 1).padStart(3)}.  ${ok}  ${name} ${N} ${A} ${cs} ${spend}`;
      }),
      '─'.repeat(96),
      `Interventions referenced: ${Object.keys(INTERVENTIONS).join(', ')}`,
      '',
    ];
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    if (proc?.env?.STRATEGY_REPORT === '1') console.log(lines.join('\n'));
    expect(sorted.length).toBe(STRATEGIES.length);
  });
});
