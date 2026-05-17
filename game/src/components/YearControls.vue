<script setup lang="ts">
import { useGameStore } from '../store/game';

const store = useGameStore();
</script>

<template>
  <div class="panel controls">
    <button :disabled="store.overBudget || store.gameOver" @click="store.advance">
      Advance year ▶
    </button>
    <button @click="store.reset">Reset</button>
    <span v-if="store.gameOver" class="game-over">
      Game over — final cases: <b>{{ store.cumulativeCases.toFixed(1) }}</b>
    </span>
  </div>
</template>

<style scoped>
.controls { display: flex; gap: 12px; align-items: center; }
.game-over { color: var(--ok); }
.game-over b { color: var(--text); font-size: 16px; }
</style>
