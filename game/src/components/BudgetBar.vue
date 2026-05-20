<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/game';

const store = useGameStore();

const totalTicks = computed(() =>
  store.grid.reduce((s, c) => s + c.L + c.N + c.A, 0),
);
const infectedTicks = computed(() =>
  store.grid.reduce((s, c) => s + c.Linf + c.Ninf + c.Ainf, 0),
);
</script>

<template>
  <div class="panel bar">
    <div class="stat"><small>Year</small><b>{{ store.year }}</b></div>
    <div class="stat"><small>Ticks (yr)</small><b>{{ totalTicks.toFixed(0) }}</b></div>
    <div class="stat"><small>Infected ticks (yr)</small><b>{{ infectedTicks.toFixed(0) }}</b></div>
    <div class="stat"><small>Infected humans (total)</small><b>{{ store.cumulativeCases.toFixed(1) }}</b></div>
    <div class="stat"><small>Pending spend</small>
      <b>${{ store.pendingCost.toLocaleString() }}</b>
    </div>
    <div class="stat"><small>Total spent</small><b>${{ store.cumulativeSpend.toLocaleString() }}</b></div>
  </div>
</template>

<style scoped>
.bar { display: flex; gap: 24px; align-items: center; }
.stat { display: flex; flex-direction: column; }
.stat b { font-size: 18px; font-variant-numeric: tabular-nums; }
.stat .over { color: var(--danger); }
.stat small { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
</style>
