<template>
  <svg :width="size" :height="size" viewBox="-10 -10 20 20" aria-hidden="true">
    <g class="legs" :class="{ animated }" stroke="#3a2410" stroke-width="0.9" stroke-linecap="round" fill="none">
      <line x1="-2.5" y1="-3" x2="-7" y2="-5.5" />
      <line x1="-2.8" y1="-1" x2="-7.5" y2="-2" />
      <line x1="-2.8" y1="1" x2="-7.5" y2="2" />
      <line x1="-2.5" y1="3" x2="-7" y2="5.5" />
      <line x1="2.5" y1="-3" x2="7" y2="-5.5" />
      <line x1="2.8" y1="-1" x2="7.5" y2="-2" />
      <line x1="2.8" y1="1" x2="7.5" y2="2" />
      <line x1="2.5" y1="3" x2="7" y2="5.5" />
    </g>
    <ellipse cx="0" cy="1" rx="3.5" ry="4.5" fill="#5a3a1c" />
    <circle cx="0" cy="-3.5" r="1.6" fill="#3a2410" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; animated?: boolean }>(), { size: 18, animated: false });
</script>

<style scoped>
.legs { transform-origin: center; }
.legs.animated { animation: legwiggle 0.32s ease-in-out infinite alternate; }
@keyframes legwiggle {
  from { transform: rotate(-6deg); }
  to   { transform: rotate(6deg); }
}
</style>
