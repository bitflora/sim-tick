import { neighbors } from './grid';

// 4-connected BFS over an active-cell set. Returns a map from cellIndex to
// the size of its connected component. Cells not in `activeCells` have no
// entry. Used to gate area-required interventions (deerFencing, fourPoster)
// where literature shows efficacy fails below a minimum exclosure size.
export function clusterSizes(activeCells: Set<number>): Map<number, number> {
  const sizes = new Map<number, number>();
  const seen = new Set<number>();
  for (const start of activeCells) {
    if (seen.has(start)) continue;
    const component: number[] = [];
    const queue: number[] = [start];
    seen.add(start);
    while (queue.length > 0) {
      const i = queue.shift()!;
      component.push(i);
      for (const n of neighbors(i)) {
        if (activeCells.has(n) && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    for (const c of component) sizes.set(c, component.length);
  }
  return sizes;
}
