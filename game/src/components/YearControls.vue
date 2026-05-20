<script setup lang="ts">
import { useGameStore } from '../store/game';

const store = useGameStore();
</script>

<template>
  <div class="controls">
    <button :disabled="store.animating" @click="store.advance">
      Advance year ▶
    </button>
    <button @click="store.reset">Reset</button>
    <span v-if="store.animating" class="anim-note">Animating…</span>
  </div>
</template>

<style scoped>
.controls { display: flex; gap: 12px; align-items: center; }
.anim-note { font-size: 12px; color: var(--muted); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
