<script setup lang="ts">
import GridView from './components/GridView.vue';
import CellInspector from './components/CellInspector.vue';
import BudgetBar from './components/BudgetBar.vue';
import YearControls from './components/YearControls.vue';
import HistoryChart from './components/HistoryChart.vue';
</script>

<template>
  <div class="app">
    <header>
      <h1>Tick Mitigation <small>— Lyme disease across a 10×10 ecosystem</small></h1>
    </header>
    <BudgetBar />
    <div class="row">
      <GridView />
      <CellInspector />
    </div>
    <div class="row">
      <YearControls />
      <HistoryChart />
    </div>
  </div>
</template>

<style scoped>
.app { max-width: 1200px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
header h1 { font-size: 20px; }
header small { color: var(--muted); font-weight: 400; }
.row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
</style>
