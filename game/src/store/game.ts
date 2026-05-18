import { defineStore } from 'pinia';
import { advanceYear, makeInitialGrid, totalCost, type Deployments } from '../sim/engine';
import { ECON, GRID_SIZE } from '../sim/params';
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
  history: YearRecord[];
  cumulativeCases: number;
  cumulativeSpend: number;
  gameOver: boolean;
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    grid: makeInitialGrid(),
    year: 0,
    selectedCell: 0,
    pendingDeployments: {},
    history: [],
    cumulativeCases: 0,
    cumulativeSpend: 0,
    gameOver: false,
  }),
  getters: {
    pendingCost: (s): number => totalCost(s.pendingDeployments),
    yearsRemaining(): number { return ECON.gameYears - this.year; },
    gridSize: () => GRID_SIZE,
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
      if (this.gameOver) return;
      const r = advanceYear(this.grid, this.pendingDeployments);
      this.grid = r.grid;
      this.year += 1;
      this.cumulativeCases += r.casesThisYear;
      this.cumulativeSpend += r.spend;
      this.history.push({ year: this.year, cases: r.casesThisYear, spend: r.spend });
      this.pendingDeployments = {};
      if (this.year >= ECON.gameYears) this.gameOver = true;
    },
    reset() {
      this.grid = makeInitialGrid();
      this.year = 0;
      this.selectedCell = 0;
      this.pendingDeployments = {};
      this.history = [];
      this.cumulativeCases = 0;
      this.cumulativeSpend = 0;
      this.gameOver = false;
    },
  },
});
