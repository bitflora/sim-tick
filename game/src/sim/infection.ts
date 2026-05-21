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
  const nymphsInfected = cell.nymphsInfected;
  const mice = cell.mice;
  if (mice <= 0) { cell.miceInfected = 0; return 0; }

  // Density-based annual hazard on susceptible mice:
  //   h = pNymphToMouse · nymphContactRate · (nymphsInfected / mice)
  // Scales with absolute infected-nymph density per mouse, so interventions
  // that cut nymph numbers (acaricide, tick tubes, bait boxes) correctly
  // reduce mouse FOI — not just ones that shift the infected fraction.
  // mouseAcquisitionMul applies the RTV antibody block at the mouse→tick
  // interface (anti-OspA neutralizes spirochetes in the feeding nymph).
  const hazardMouse = LYME.pNymphToMouse * mouseAcquisitionMul * LYME.nymphContactRate * (nymphsInfected / mice);
  const newInfFrac = 1 - Math.exp(-hazardMouse);
  const susceptible = mice - cell.miceInfected;
  const newMouseInf = susceptible * newInfFrac;
  cell.miceInfected = Math.min(mice, cell.miceInfected + newMouseInf);

  // Human cases: blend in-yard infected nymphs with an untreatable off-site
  // background when property-scale interventions are active. See
  // LYME.spilloverDiscount and the Tick Project / Hinckley RCT "QN ↓ but HC
  // null" finding.
  const effectiveNymphsInfected = propertyScaleActive
    ? (1 - LYME.spilloverDiscount) * nymphsInfected + LYME.spilloverDiscount * LYME.spilloverBaselineInfectedNymphs
    : nymphsInfected;
  const cases = LYME.humansPerCell * LYME.humanBitesPerNymph * effectiveNymphsInfected * LYME.pNymphToHuman * humanTransmissionMul;
  return cases;
}

// Compute fraction of newly-molted nymphs that are infected, based on larval
// feeding on mice this year. Called in engine when larvae advance to nymphs.
export function fracNewNymphInfected(cell: CellState, mouseInfectivityMul: number): number {
  const mice = cell.mice;
  if (mice <= 0) return 0;
  const miceInfFrac = cell.miceInfected / mice;
  // Per-larva probability of acquiring infection. mouseInfectivityMul applies
  // the RTV antibody block at the mouse→larva interface.
  const hazard = LYME.pMouseToLarva * mouseInfectivityMul * LYME.larvaBitesPerMouse * miceInfFrac;
  return 1 - Math.exp(-hazard);
}
