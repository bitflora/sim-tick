<script setup lang="ts">
import GridView from './components/GridView.vue';
import InterventionToolbar from './components/InterventionToolbar.vue';
import CellInspector from './components/CellInspector.vue';
import BudgetBar from './components/BudgetBar.vue';
import YearControls from './components/YearControls.vue';
import HistoryChart from './components/HistoryChart.vue';
import TickCrawlers from './components/TickCrawlers.vue';
</script>

<template>
  <div class="app">
    <header>
      <h1>Sim Tick <small>— Eradicate Lyme disease</small></h1>
      <YearControls />
    </header>
    <BudgetBar />
    <InterventionToolbar />
    <div class="row">
      <div class="grid-col">
        <GridView />
        <HistoryChart />
      </div>
      <CellInspector />
    </div>
    <TickCrawlers />
  </div>
</template>

<style scoped>
.app { max-width: 1200px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
header h1 { font-size: 20px; }
header small { color: var(--muted); font-weight: 400; }
.row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.grid-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
</style>
