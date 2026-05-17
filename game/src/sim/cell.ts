import { INIT, MOUSE, DEER } from './params';

export interface CellState {
  // Ticks (per ha): total counts. Infected subset tracked separately.
  L: number; Linf: number;
  N: number; Ninf: number;
  A: number; Ainf: number;
  // Hosts.
  M: number; Minf: number;
  D: number;
  // Habitat quality multiplier on tick survival (0..1).
  hab: number;
  // Persistent intervention state (years of remaining effect for multi-year items).
  habMgmtYearsLeft: number;
}

export function makeInitialCell(): CellState {
  return {
    L: INIT.L,
    Linf: INIT.L * INIT.fracLarvaInf,
    N: INIT.N,
    Ninf: INIT.N * INIT.fracNymphInf,
    A: INIT.A,
    Ainf: INIT.A * INIT.fracAdultInf,
    M: MOUSE.init,
    Minf: MOUSE.init * INIT.fracMouseInf,
    D: DEER.init,
    hab: 1.0,
    habMgmtYearsLeft: 0,
  };
}

export function cloneCell(c: CellState): CellState {
  return { ...c };
}
