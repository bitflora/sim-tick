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

export function updateMouseInfection(
  cell: CellState,
  humanTransmissionMul: number,
  propertyScaleActive: boolean,
  mouseAcquisitionMul: number,
): number {
  const Ninf = cell.Ninf;
  const M = cell.M;
  if (M <= 0) { cell.Minf = 0; return 0; }

  // Density-based annual hazard on susceptible mice:
  //   h = pNymphToMouse · nymphContactRate · (Ninf / M)
  // Scales with absolute infected-nymph density per mouse, so interventions
  // that cut nymph numbers (acaricide, tick tubes, bait boxes) correctly
  // reduce mouse FOI — not just ones that shift the infected fraction.
  // mouseAcquisitionMul applies the RTV antibody block at the mouse→tick
  // interface (anti-OspA neutralizes spirochetes in the feeding nymph).
  const hazardMouse = LYME.pNymphToMouse * mouseAcquisitionMul * LYME.nymphContactRate * (Ninf / M);
  const newInfFrac = 1 - Math.exp(-hazardMouse);
  const susceptible = M - cell.Minf;
  const newMouseInf = susceptible * newInfFrac;
  cell.Minf = Math.min(M, cell.Minf + newMouseInf);

  // Human cases: blend in-yard Ninf with an untreatable off-site background
  // when property-scale interventions are active. See LYME.spilloverDiscount
  // and the Tick Project / Hinckley RCT "QN ↓ but HC null" finding.
  const effectiveNinf = propertyScaleActive
    ? (1 - LYME.spilloverDiscount) * Ninf + LYME.spilloverDiscount * LYME.spilloverBaselineInfectedNymphs
    : Ninf;
  const cases = LYME.humansPerCell * LYME.humanBitesPerNymph * effectiveNinf * LYME.pNymphToHuman * humanTransmissionMul;
  return cases;
}

// Compute fraction of newly-molted nymphs that are infected, based on larval
// feeding on mice this year. Called in engine when larvae advance to nymphs.
export function fracNewNymphInfected(cell: CellState, mouseInfectivityMul: number): number {
  const M = cell.M;
  if (M <= 0) return 0;
  const infFracM = cell.Minf / M;
  // Per-larva probability of acquiring infection. mouseInfectivityMul applies
  // the RTV antibody block at the mouse→larva interface.
  const hazard = LYME.pMouseToLarva * mouseInfectivityMul * LYME.larvaBitesPerMouse * infFracM;
  return 1 - Math.exp(-hazard);
}
