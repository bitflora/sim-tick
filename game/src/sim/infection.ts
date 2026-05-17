import type { CellState } from './cell';
import { LYME } from './params';

// Update infected fractions in mice and ticks for the current year, then
// return human cases generated this year in this cell.
//
// Logic:
//   - Mice: force-of-infection from infected nymphs (current N stage).
//   - Larvae: acquire infection from infected mice; carry forward to nymph stage.
//   - Nymph/adult infection is set when they advance from the prior stage in
//     engine.ts; here we only update *mouse* infection state + larval infections.
// Human cases driven by infected-nymph density and humansPerCell.

export function updateMouseInfection(cell: CellState, humanTransmissionMul: number): number {
  const N = cell.N;
  const Ninf = cell.Ninf;
  const M = cell.M;
  if (M <= 0) { cell.Minf = 0; return 0; }

  // Fraction of nymphs that are infected.
  const infFracN = N > 0 ? Ninf / N : 0;

  // Susceptible mice get bitten by nymphs. Annual hazard:
  //   h = pNymphToMouse * bites * fracInfectedNymphs
  const hazardMouse = LYME.pNymphToMouse * LYME.nymphBitesPerMouse * infFracN;
  const newInfFrac = 1 - Math.exp(-hazardMouse);
  const susceptible = M - cell.Minf;
  const newMouseInf = susceptible * newInfFrac;
  cell.Minf = Math.min(M, cell.Minf + newMouseInf);

  // Human cases = humans * exposure * infected-nymph density * transmission prob.
  const cases = LYME.humansPerCell * LYME.humanBitesPerNymph * Ninf * LYME.pNymphToHuman * humanTransmissionMul;
  return cases;
}

// Compute fraction of newly-molted nymphs that are infected, based on larval
// feeding on mice this year. Called in engine when larvae advance to nymphs.
export function fracNewNymphInfected(cell: CellState): number {
  const M = cell.M;
  if (M <= 0) return 0;
  const infFracM = cell.Minf / M;
  // Per-larva probability of acquiring infection.
  const hazard = LYME.pMouseToLarva * LYME.larvaBitesPerMouse * infFracM;
  return 1 - Math.exp(-hazard);
}
