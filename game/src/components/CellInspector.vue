<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/game';
import {
  INTERVENTION_LIST,
  METRIC_LEGEND,
  emptyModifiers,
  type Intervention,
  type Modifiers,
  type InterventionId,
} from '../sim/interventions';
import { clusterSizes } from '../sim/clustering';

const store = useGameStore();
const cell = computed(() => store.grid[store.selectedCell]);
const deploys = computed(() => store.pendingDeployments[store.selectedCell] ?? new Set());

function pct(num: number, denom: number, denomEpsilon = 0.5): string {
  // Suppress when denom rounds to displayed zero — otherwise tiny sub-integer
  // populations produce misleading "11% infected of 0 adults" readouts.
  if (denom < denomEpsilon) return '—';
  return (100 * num / denom).toFixed(1) + '%';
}

type NumericModKey = Exclude<keyof Modifiers, 'propertyScaleActive'>;

const MOD_LABELS: Record<NumericModKey, string> = {
  tickSurvivalMul: 'all ticks',
  adultSurvivalMul: 'adults',
  nymphSurvivalMul: 'nymphs',
  larvaSurvivalMul: 'larvae',
  mouseDensityMul: 'mice',
  deerDensityMul: 'deer',
  habMul: 'habitat',
  humanTransmissionMul: 'human cases',
  mouseAcquisitionMul: 'mouse acquires from nymphs',
  mouseInfectivityMul: 'mouse infects larvae',
};

function modEffects(iv: Intervention): string {
  const m = emptyModifiers();
  // Display: show full-effect (yr3+) for ramp interventions.
  const ctx = { consecutiveYears: iv.rampSchedule?.length ?? 1 };
  iv.apply(m, ctx);
  const parts: string[] = [];
  for (const k of Object.keys(MOD_LABELS) as NumericModKey[]) {
    if (m[k] !== 1) {
      const reduction = Math.round((1 - m[k]) * 100);
      parts.push(`−${reduction}% ${MOD_LABELS[k]}`);
    }
  }
  if (iv.persistsYears && iv.persistsYears > 1) parts.push(`${iv.persistsYears}y`);
  if (iv.rampSchedule) parts.push(`ramp ${iv.rampSchedule.length}y`);
  return parts.join(' · ');
}

function carryYears(id: InterventionId): number {
  return cell.value.persistEffects[id] ?? 0;
}

// For each gated intervention, compute the prospective cluster sizes given
// current pending deploys + existing carry-over. Used to surface ⚠ when a
// pending deploy on this cell would fall below the spatial threshold.
const gateSizes = computed(() => {
  const result: Partial<Record<InterventionId, Map<number, number>>> = {};
  for (const iv of INTERVENTION_LIST) {
    if (!iv.minContiguousCells) continue;
    const active = new Set<number>();
    for (let i = 0; i < store.grid.length; i++) {
      const pending = store.pendingDeployments[i]?.has(iv.id);
      const carry = (store.grid[i].persistEffects[iv.id] ?? 0) > 0;
      if (pending || carry) active.add(i);
    }
    result[iv.id] = clusterSizes(active);
  }
  return result;
});

function gateStatus(iv: Intervention): { ok: boolean; size: number; need: number } | null {
  if (!iv.minContiguousCells) return null;
  const pending = deploys.value.has(iv.id);
  const carry = carryYears(iv.id) > 0;
  if (!pending && !carry) return null;
  const size = gateSizes.value[iv.id]?.get(store.selectedCell) ?? 0;
  return { ok: size >= iv.minContiguousCells, size, need: iv.minContiguousCells };
}
</script>

<template>
  <div class="panel inspector">
    <h3>Cell {{ store.selectedCell }}</h3>
    <div class="stats">
      <div><b>Larvae</b> {{ cell.larvae.toFixed(0) }} <small>({{ pct(cell.larvaeInfected, cell.larvae) }} inf)</small></div>
      <div><b>Nymphs</b> {{ cell.nymphs.toFixed(0) }} <small>({{ pct(cell.nymphsInfected, cell.nymphs) }} inf)</small></div>
      <div><b>Adults</b> {{ cell.adults.toFixed(0) }} <small>({{ pct(cell.adultsInfected, cell.adults) }} inf)</small></div>
      <div><b>Mice</b> {{ cell.mice.toFixed(1) }}/ha <small>({{ pct(cell.miceInfected, cell.mice, 0.05) }} inf)</small></div>
      <div><b>Deer</b> {{ cell.deer.toFixed(2) }}/ha</div>
      <div><b>Habitat</b> {{ cell.habitat.toFixed(2) }}</div>
    </div>
    <div v-if="Object.keys(cell.persistEffects).length > 0" class="carry">
      <b>Active carry-over:</b>
      <span v-for="(yrs, id) in cell.persistEffects" :key="id">
        {{ id }} ({{ yrs }}y)
      </span>
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
          <div class="iv-effect" :title="METRIC_LEGEND[iv.effect.metric]">
            −{{ iv.effect.medianPct }}% {{ iv.effect.metric }}
            <span class="range">(range {{ iv.effect.rangePct[0] }}–{{ iv.effect.rangePct[1] }}%)</span>
            <span v-if="iv.persistsYears && iv.persistsYears > 1" class="persist">· {{ iv.persistsYears }}-yr</span>
            <span v-if="carryYears(iv.id) > 0" class="active">· active ({{ carryYears(iv.id) }}y left)</span>
          </div>
          <small class="iv-mods">sim: {{ modEffects(iv) }}</small>
          <small>{{ iv.blurb }}</small>
          <small v-if="iv.effect.note" class="iv-note">⚠ {{ iv.effect.note }}</small>
          <small v-if="gateStatus(iv) && !gateStatus(iv)!.ok" class="iv-gate-fail">
            ⚠ no effect — need {{ gateStatus(iv)!.need - gateStatus(iv)!.size }} more contiguous cells
            (cluster {{ gateStatus(iv)!.size }} of {{ gateStatus(iv)!.need }})
          </small>
          <small v-else-if="gateStatus(iv)?.ok" class="iv-gate-ok">
            ✓ cluster {{ gateStatus(iv)!.size }} cells
          </small>
          <small class="iv-cites">
            <a
              v-for="(c, i) in iv.citations"
              :key="c.url"
              :href="c.url"
              target="_blank"
              rel="noopener"
            >{{ c.label }}<span v-if="i < iv.citations.length - 1">, </span></a>
          </small>
        </div>
      </label>
    </div>
    <small class="legend">
      QN = questing nymph density · HC = human cases · EM = erythema migrans · NIP = nymph infection prevalence
    </small>
    <button v-if="deploys.size > 0" @click="store.clearCellDeployments(store.selectedCell)">Clear cell</button>
  </div>
</template>

<style scoped>
.inspector {
  min-width: 560px;
  max-width: 640px;
  position: sticky;
  top: 8px;
  max-height: calc(100vh - 16px);
  overflow-y: auto;
}
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-bottom: 8px; font-size: 13px; }
.stats b { color: var(--muted); font-weight: 500; }
.carry { font-size: 11px; color: var(--muted); margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.carry b { color: var(--accent); }
h4 { margin: 12px 0 6px 0; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.iv-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.iv { display: flex; align-items: flex-start; gap: 8px; padding: 6px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; }
.iv:hover { border-color: var(--accent); }
.iv input { margin-top: 3px; }
.iv-body { flex: 1; min-width: 0; }
.iv-head { display: flex; justify-content: space-between; font-size: 13px; }
.iv-cost { color: var(--accent); font-variant-numeric: tabular-nums; }
.iv-name { font-weight: 500; }
.iv-icon { margin-right: 6px; }
.iv-effect { font-size: 12px; color: var(--accent); font-variant-numeric: tabular-nums; margin: 2px 0; }
.iv-effect .range { color: var(--muted); font-weight: normal; }
.iv-effect .persist { color: var(--muted); }
.iv-effect .active { color: #2a8; }
.iv-mods { color: var(--muted); font-style: italic; }
.iv-note { color: #c80; }
.iv-gate-fail { color: #d44; font-weight: 500; }
.iv-gate-ok { color: #2a8; }
.iv-cites { margin-top: 2px; }
.iv-cites a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
.iv-cites a:hover { text-decoration: underline; }
small { font-size: 11px; line-height: 1.35; display: block; }
.legend { color: var(--muted); font-size: 10px; margin-bottom: 8px; }
</style>
