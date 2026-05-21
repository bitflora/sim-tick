<script setup lang="ts">
import { useGameStore } from '../store/game';
import { INTERVENTION_LIST } from '../sim/interventions';

const store = useGameStore();
</script>

<template>
  <div class="toolbar panel">
    <button
      v-for="iv in INTERVENTION_LIST"
      :key="iv.id"
      class="tool"
      :class="{ active: store.activeTool === iv.id }"
      :title="iv.blurb"
      @click="store.setActiveTool(iv.id)"
    >
      <span class="icon">{{ iv.icon }}</span>
      <span class="name">{{ iv.name }}</span>
      <span class="cost">${{ iv.cost }}</span>
    </button>
    <button
      v-if="store.activeTool"
      class="tool clear"
      @click="store.setActiveTool(null)"
    >✕ none</button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 8px;
}
.tool {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: var(--panel); color: inherit;
  border: 1px solid var(--border); border-radius: 4px;
  cursor: pointer; font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.tool:hover { border-color: var(--accent); }
.tool.active { border-color: var(--accent); background: var(--accent); color: #fff; }
.tool.active .cost { color: #fff; }
.icon { font-size: 16px; line-height: 1; }
.cost { color: var(--accent); }
.tool.clear { color: var(--muted); }
</style>
