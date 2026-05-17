<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/game';

const store = useGameStore();
const W = 480, H = 140, PAD = 24;

const pts = computed(() => {
  const h = store.history;
  if (h.length === 0) return { line: '', cumLine: '', max: 0, cumMax: 0 };
  const max = Math.max(1, ...h.map((r) => r.cases));
  let cum = 0;
  const cumVals = h.map((r) => (cum += r.cases));
  const cumMax = Math.max(1, ...cumVals);
  const xStep = (W - 2 * PAD) / Math.max(1, h.length - 1 || 1);
  const line = h.map((r, i) => {
    const x = PAD + i * xStep;
    const y = H - PAD - ((H - 2 * PAD) * r.cases) / max;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const cumLine = cumVals.map((v, i) => {
    const x = PAD + i * xStep;
    const y = H - PAD - ((H - 2 * PAD) * v) / cumMax;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return { line, cumLine, max, cumMax };
});
</script>

<template>
  <div class="panel chart">
    <h3>Lyme cases over time</h3>
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H">
      <line :x1="24" :y1="H - 24" :x2="W - 24" :y2="H - 24" stroke="var(--border)" />
      <path :d="pts.line" stroke="var(--danger)" fill="none" stroke-width="2" />
      <path :d="pts.cumLine" stroke="var(--accent)" fill="none" stroke-width="2" stroke-dasharray="4 3" />
    </svg>
    <div class="legend">
      <span class="sw red" /> annual cases (peak {{ pts.max.toFixed(1) }})
      <span class="sw blue" /> cumulative (now {{ store.cumulativeCases.toFixed(1) }})
    </div>
  </div>
</template>

<style scoped>
.chart { width: fit-content; }
.legend { font-size: 12px; color: var(--muted); display: flex; gap: 16px; }
.sw { display: inline-block; width: 12px; height: 3px; vertical-align: middle; margin-right: 4px; }
.sw.red { background: var(--danger); }
.sw.blue { background: var(--accent); }
</style>
