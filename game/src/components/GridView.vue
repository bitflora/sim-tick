<script setup lang="ts">
import { useGameStore } from '../store/game';
import { GRID_SIZE, INIT } from '../sim/params';
import { INTERVENTIONS, type InterventionId } from '../sim/interventions';
import type { CellState } from '../sim/cell';
import GridAnimationOverlay from './GridAnimationOverlay.vue';

interface PersistGlyph { id: InterventionId; opacity: number }

const store = useGameStore();

const INIT_TICK_TOTAL = INIT.L + INIT.N + INIT.A;
const INIT_NINF = INIT.N * INIT.fracNymphInf;

function rampColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const r = Math.round(255 * Math.min(1, clamped * 2));
  const g = Math.round(255 * Math.min(1, (1 - clamped) * 2));
  return `rgb(${r},${g},60)`;
}

function lymeEradicated(c: CellState): boolean {
  return c.Linf + c.Ninf + c.Ainf + c.Minf === 0;
}

function gradientFor(c: CellState): string {
  const tickT = (c.L + c.N + c.A) / INIT_TICK_TOTAL;
  const ninfT = c.Ninf / INIT_NINF;
  return `linear-gradient(135deg, ${rampColor(tickT)}, ${rampColor(ninfT)})`;
}

function pendingFor(i: number): InterventionId[] {
  const s = store.pendingDeployments[i];
  return s ? Array.from(s) : [];
}

function persistentFor(i: number): PersistGlyph[] {
  const cell = store.grid[i];
  const pending = store.pendingDeployments[i];
  const out: PersistGlyph[] = [];
  for (const [id, yearsLeft] of Object.entries(cell.persistEffects) as [InterventionId, number][]) {
    if (yearsLeft <= 0) continue;
    if (pending?.has(id)) continue;
    const total = INTERVENTIONS[id].persistsYears ?? 1;
    // yearsLeft is years AFTER this turn; +1 gives total active turns remaining
    // including the current one. Fade linearly from ~0.9 (fresh) to ~0.15 (last).
    const t = Math.min(1, (yearsLeft + 1) / total);
    out.push({ id, opacity: 0.15 + 0.75 * t });
  }
  // One-shot interventions deployed last year, not persisting: show ghosted.
  const last = store.lastDeployments[i];
  if (last) {
    for (const id of last) {
      if (pending?.has(id)) continue;
      if (cell.persistEffects[id]) continue;
      out.push({ id, opacity: 0.35 });
    }
  }
  return out;
}

function hasDeploy(i: number): boolean {
  return !!store.pendingDeployments[i] && store.pendingDeployments[i].size > 0;
}

function onCellClick(i: number) {
  store.selectCell(i);
  if (store.activeTool) store.toggleIntervention(i, store.activeTool);
}
</script>

<template>
  <div class="grid-wrap panel">
    <h3>Ecosystem grid <small>— ↘ gradient: total ticks → infected nymphs</small></h3>
    <div class="grid-stack">
    <div class="grid" :class="{ painting: !!store.activeTool }" :style="{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(64px, 1fr))` }">
      <div
        v-for="(c, i) in store.grid"
        :key="i"
        class="cell"
        :class="{ selected: store.selectedCell === i, deploy: hasDeploy(i) }"
        :style="{ background: gradientFor(c) }"
        :title="`Cell ${i}: ticks=${(c.L + c.N + c.A).toFixed(0)} Ninf=${c.Ninf.toFixed(1)}`"
        @click="onCellClick(i)"
      >
        <div v-if="lymeEradicated(c)" class="eradicated-check">✓</div>
        <div class="glyphs">
          <span
            v-for="p in persistentFor(i)"
            :key="'p' + p.id"
            class="glyph faded"
            :style="{ opacity: p.opacity }"
          >{{ INTERVENTIONS[p.id].icon }}</span>
          <span v-for="id in pendingFor(i)" :key="'n' + id" class="glyph">{{ INTERVENTIONS[id].icon }}</span>
        </div>
      </div>
    </div>
    <GridAnimationOverlay />
    </div>
    <div class="legend">
      <span class="sw" style="background: rgb(0,255,60)" /> low
      <span class="sw" style="background: rgb(255,255,60)" /> mid
      <span class="sw" style="background: rgb(255,0,60)" /> high
      <span class="deploy-marker" /> deployment planned
      <span class="glyph-marker"><span class="glyph">🧪</span><span class="glyph faded">🚧</span></span> pending / active
    </div>
  </div>
</template>

<style scoped>
.grid-wrap { flex: 1 1 auto; min-width: 0; }
.grid-stack { position: relative; }
.grid {
  display: grid; gap: 2px; padding: 4px; background: var(--border); border-radius: 4px;
  width: 100%;
}
.cell {
  position: relative;
  width: 100%; aspect-ratio: 1 / 1;
  cursor: pointer; border: 2px solid transparent;
  border-radius: 2px; transition: transform 0.05s;
  overflow: hidden;
}
.cell:hover { transform: scale(1.1); z-index: 1; border-color: #fff; }
.grid.painting .cell { cursor: crosshair; }
.cell.selected { border-color: var(--accent); }
.cell.selected:hover { border-color: var(--accent); }
.cell.deploy { box-shadow: inset 0 0 0 2px #fff; }
.glyphs {
  position: absolute; left: 1px; bottom: 0; right: 1px;
  display: flex; flex-wrap: wrap; gap: 0; line-height: 1;
  font-size: 32px; pointer-events: none;
}
.glyph { display: inline-block; }
.eradicated-check {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 56px; font-weight: 900; color: #16a34a;
  text-shadow: 0 0 4px #000, 0 0 2px #000;
  pointer-events: none; z-index: 2;
}
.glyph.faded { opacity: 0.35; filter: grayscale(0.5); }
.legend { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-top: 8px; color: var(--muted); }
.sw { display: inline-block; width: 14px; height: 14px; border-radius: 2px; margin-left: 6px; }
.deploy-marker { display: inline-block; width: 14px; height: 14px; border-radius: 2px; margin-left: 6px; background: var(--panel); box-shadow: inset 0 0 0 2px #fff; }
.glyph-marker { display: inline-flex; gap: 2px; margin-left: 6px; font-size: 12px; line-height: 1; }
</style>
