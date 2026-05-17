<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/game';
import { GRID_SIZE } from '../sim/params';

const store = useGameStore();

// Color by infected nymph density (DIN — disease risk metric).
const maxDIN = computed(() => Math.max(1, ...store.grid.map((c) => c.Ninf)));

function colorFor(ninf: number): string {
  const t = Math.min(1, ninf / maxDIN.value);
  // green -> yellow -> red
  const r = Math.round(255 * Math.min(1, t * 2));
  const g = Math.round(255 * Math.min(1, (1 - t) * 2));
  return `rgb(${r},${g},60)`;
}

function hasDeploy(i: number): boolean {
  return !!store.pendingDeployments[i] && store.pendingDeployments[i].size > 0;
}
</script>

<template>
  <div class="grid-wrap panel">
    <h3>Ecosystem grid <small>— color: infected nymphs/ha</small></h3>
    <div class="grid" :style="{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }">
      <div
        v-for="(c, i) in store.grid"
        :key="i"
        class="cell"
        :class="{ selected: store.selectedCell === i, deploy: hasDeploy(i) }"
        :style="{ background: colorFor(c.Ninf) }"
        :title="`Cell ${i}: Ninf=${c.Ninf.toFixed(1)} N=${c.N.toFixed(0)}`"
        @click="store.selectCell(i)"
      />
    </div>
    <div class="legend">
      <span class="sw" style="background: rgb(0,255,60)" /> low risk
      <span class="sw" style="background: rgb(255,255,60)" /> mid
      <span class="sw" style="background: rgb(255,0,60)" /> high
      <span class="deploy-marker" /> deployment planned
    </div>
  </div>
</template>

<style scoped>
.grid-wrap { width: fit-content; }
.grid { display: grid; gap: 2px; padding: 4px; background: var(--border); border-radius: 4px; }
.cell {
  width: 32px; height: 32px; cursor: pointer; border: 2px solid transparent;
  border-radius: 2px; transition: transform 0.05s;
}
.cell:hover { transform: scale(1.1); z-index: 1; }
.cell.selected { border-color: var(--accent); }
.cell.deploy { box-shadow: inset 0 0 0 2px #fff; }
.legend { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-top: 8px; color: var(--muted); }
.sw { display: inline-block; width: 14px; height: 14px; border-radius: 2px; margin-left: 6px; }
.deploy-marker { display: inline-block; width: 14px; height: 14px; border-radius: 2px; margin-left: 6px; background: var(--panel); box-shadow: inset 0 0 0 2px #fff; }
</style>
