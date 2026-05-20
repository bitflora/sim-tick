<script setup lang="ts">
import { useGameStore } from '../store/game';

const store = useGameStore();
</script>

<template>
  <div class="controls">
    <button @click="store.advance">
      Advance year ▶
    </button>
    <button @click="store.reset">Reset</button>
  </div>
</template>

<style scoped>
.controls { display: flex; gap: 12px; align-items: center; }
</style>
