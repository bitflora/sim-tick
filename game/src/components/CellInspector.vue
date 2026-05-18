<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/game';
import { INTERVENTION_LIST, emptyModifiers, type Intervention, type Modifiers } from '../sim/interventions';

const store = useGameStore();
const cell = computed(() => store.grid[store.selectedCell]);
const deploys = computed(() => store.pendingDeployments[store.selectedCell] ?? new Set());

function pct(num: number, denom: number): string {
  if (denom <= 0) return '—';
  return (100 * num / denom).toFixed(1) + '%';
}

const MOD_LABELS: Record<keyof Modifiers, string> = {
  tickSurvivalMul: 'all ticks',
  adultSurvivalMul: 'adults',
  nymphSurvivalMul: 'nymphs',
  larvaSurvivalMul: 'larvae',
  mouseDensityMul: 'mice',
  deerDensityMul: 'deer',
  habMul: 'habitat',
  humanTransmissionMul: 'human cases',
};

function effects(iv: Intervention): string {
  const m = emptyModifiers();
  iv.apply(m);
  const parts: string[] = [];
  for (const k of Object.keys(m) as (keyof Modifiers)[]) {
    if (m[k] !== 1) {
      const reduction = Math.round((1 - m[k]) * 100);
      parts.push(`−${reduction}% ${MOD_LABELS[k]}`);
    }
  }
  if (iv.persistsYears && iv.persistsYears > 1) parts.push(`${iv.persistsYears}y`);
  return parts.join(' · ');
}
</script>

<template>
  <div class="panel inspector">
    <h3>Cell {{ store.selectedCell }}</h3>
    <div class="stats">
      <div><b>Larvae</b> {{ cell.L.toFixed(0) }} <small>({{ pct(cell.Linf, cell.L) }} inf)</small></div>
      <div><b>Nymphs</b> {{ cell.N.toFixed(0) }} <small>({{ pct(cell.Ninf, cell.N) }} inf)</small></div>
      <div><b>Adults</b> {{ cell.A.toFixed(0) }} <small>({{ pct(cell.Ainf, cell.A) }} inf)</small></div>
      <div><b>Mice</b> {{ cell.M.toFixed(1) }}/ha <small>({{ pct(cell.Minf, cell.M) }} inf)</small></div>
      <div><b>Deer</b> {{ cell.D.toFixed(2) }}/ha</div>
      <div><b>Habitat</b> {{ cell.hab.toFixed(2) }} <small v-if="cell.habMgmtYearsLeft > 0">(mgmt: {{ cell.habMgmtYearsLeft }}y left)</small></div>
    </div>

    <h4>Deploy next year</h4>
    <div class="iv-list">
      <label v-for="iv in INTERVENTION_LIST" :key="iv.id" class="iv">
        <input
          type="checkbox"
          :checked="deploys.has(iv.id)"
          @change="store.toggleIntervention(store.selectedCell, iv.id)"
        />
        <div class="iv-body">
          <div class="iv-head">
            <span class="iv-name"><span class="iv-icon">{{ iv.icon }}</span>{{ iv.name }}</span>
            <span class="iv-cost">${{ iv.cost }}</span>
          </div>
          <small class="iv-effects">{{ effects(iv) }}</small>
          <small>{{ iv.blurb }}</small>
        </div>
      </label>
    </div>
    <button v-if="deploys.size > 0" @click="store.clearCellDeployments(store.selectedCell)">Clear cell</button>
  </div>
</template>

<style scoped>
.inspector { min-width: 320px; max-width: 360px; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-bottom: 12px; font-size: 13px; }
.stats b { color: var(--muted); font-weight: 500; }
h4 { margin: 12px 0 6px 0; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.iv-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.iv { display: flex; align-items: flex-start; gap: 8px; padding: 6px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; }
.iv:hover { border-color: var(--accent); }
.iv input { margin-top: 3px; }
.iv-body { flex: 1; }
.iv-head { display: flex; justify-content: space-between; font-size: 13px; }
.iv-cost { color: var(--accent); font-variant-numeric: tabular-nums; }
.iv-name { font-weight: 500; }
.iv-icon { margin-right: 6px; }
.iv-effects { color: var(--accent); font-variant-numeric: tabular-nums; margin-bottom: 2px; }
small { font-size: 11px; line-height: 1.3; display: block; }
</style>
