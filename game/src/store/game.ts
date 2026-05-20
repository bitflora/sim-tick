import { defineStore } from 'pinia';
import { advanceYear, makeInitialGrid, totalCost, type Deployments } from '../sim/engine';
import { GRID_SIZE, INIT } from '../sim/params';
import type { InterventionId } from '../sim/interventions';
import type { Grid } from '../sim/grid';

interface YearRecord {
  year: number;
  cases: number;
  spend: number;
}

interface State {
  grid: Grid;
  year: number;
  selectedCell: number;
  pendingDeployments: Deployments;
  lastDeployments: Deployments;
  history: YearRecord[];
  cumulativeCases: number;
  cumulativeSpend: number;
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    grid: makeInitialGrid(),
    year: 0,
    selectedCell: 0,
    pendingDeployments: {},
    lastDeployments: {},
    history: [],
    cumulativeCases: 0,
    cumulativeSpend: 0,
  }),
  getters: {
    pendingCost: (s): number => totalCost(s.pendingDeployments),
    gridSize: () => GRID_SIZE,
    tickPopulationFraction: (s): number => {
      let total = 0;
      for (const c of s.grid) total += c.L + c.N + c.A;
      const baseline = (INIT.L + INIT.N + INIT.A) * s.grid.length;
      return baseline > 0 ? Math.min(1, total / baseline) : 0;
    },
  },
  actions: {
    selectCell(i: number) { this.selectedCell = i; },
    toggleIntervention(cellIdx: number, id: InterventionId) {
      const set = this.pendingDeployments[cellIdx] ?? new Set<InterventionId>();
      if (set.has(id)) set.delete(id); else set.add(id);
      if (set.size === 0) delete this.pendingDeployments[cellIdx];
      else this.pendingDeployments[cellIdx] = set;
    },
    clearCellDeployments(cellIdx: number) {
      delete this.pendingDeployments[cellIdx];
    },
    advance() {
      const r = advanceYear(this.grid, this.pendingDeployments);
      this.grid = r.grid;
      this.year += 1;
      this.cumulativeCases += r.casesThisYear;
      this.cumulativeSpend += r.spend;
      this.history.push({ year: this.year, cases: r.casesThisYear, spend: r.spend });
      const snapshot: Deployments = {};
      for (const [k, v] of Object.entries(this.pendingDeployments)) {
        snapshot[Number(k)] = new Set<InterventionId>(v);
      }
      this.lastDeployments = snapshot;
      this.pendingDeployments = {};
    },
    reset() {
      this.grid = makeInitialGrid();
      this.year = 0;
      this.selectedCell = 0;
      this.pendingDeployments = {};
      this.lastDeployments = {};
      this.history = [];
      this.cumulativeCases = 0;
      this.cumulativeSpend = 0;
    },
  },
});
