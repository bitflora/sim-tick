<script setup lang="ts">
import { useGameStore } from '../store/game';
import { ECON } from '../sim/params';

const store = useGameStore();
</script>

<template>
  <div class="panel bar">
    <div class="stat"><small>Year</small><b>{{ store.year }} / {{ ECON.gameYears }}</b></div>
    <div class="stat"><small>Cumulative cases</small><b>{{ store.cumulativeCases.toFixed(1) }}</b></div>
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
