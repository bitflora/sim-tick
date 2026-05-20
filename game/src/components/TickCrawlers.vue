<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useGameStore } from '../store/game';

const TOTAL = 50;
const store = useGameStore();

interface Crawler {
  x: number;
  y: number;
  heading: number;
  speed: number;
  turnTimer: number;
  phase: number;
}

const crawlers = ref<Crawler[]>([]);
const tick = ref(0);

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function makeCrawler(): Crawler {
  return {
    x: rand(0, window.innerWidth),
    y: rand(0, window.innerHeight),
    heading: rand(0, Math.PI * 2),
    speed: rand(8, 22),
    turnTimer: rand(0.5, 2.5),
    phase: rand(0, Math.PI * 2),
  };
}

const visibleCount = computed(() => Math.round(TOTAL * store.tickPopulationFraction));

let raf = 0;
let lastT = 0;

function frame(t: number) {
  const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
  lastT = t;
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const c of crawlers.value) {
    c.turnTimer -= dt;
    if (c.turnTimer <= 0) {
      c.heading += rand(-1.2, 1.2);
      c.turnTimer = rand(0.4, 2.0);
    }
    // Slight per-step wobble so they look alive.
    c.heading += rand(-0.6, 0.6) * dt;
    c.phase += dt * 18;
    c.x += Math.cos(c.heading) * c.speed * dt;
    c.y += Math.sin(c.heading) * c.speed * dt;
    if (c.x < 0) { c.x = 0; c.heading = Math.PI - c.heading; }
    if (c.x > w) { c.x = w; c.heading = Math.PI - c.heading; }
    if (c.y < 0) { c.y = 0; c.heading = -c.heading; }
    if (c.y > h) { c.y = h; c.heading = -c.heading; }
  }
  tick.value++;
  raf = requestAnimationFrame(frame);
}

onMounted(() => {
  crawlers.value = Array.from({ length: TOTAL }, makeCrawler);
  raf = requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
});

function style(c: Crawler) {
  // Read tick.value so transforms recompute each frame.
  void tick.value;
  const legWiggle = Math.sin(c.phase) * 8;
  return {
    transform: `translate(${c.x}px, ${c.y}px) rotate(${c.heading + Math.PI / 2}rad)`,
    '--leg-wiggle': `${legWiggle}deg`,
  };
}
</script>

<template>
  <div class="tick-crawlers" aria-hidden="true">
    <svg
      v-for="(c, i) in crawlers"
      v-show="i < visibleCount"
      :key="i"
      class="tick"
      :style="style(c)"
      width="14"
      height="14"
      viewBox="-10 -10 20 20"
    >
      <!-- Legs: 4 per side, animated wiggle. -->
      <g class="legs" stroke="#3a2410" stroke-width="0.9" stroke-linecap="round" fill="none">
        <line x1="-2.5" y1="-3" x2="-7" y2="-5.5" />
        <line x1="-2.8" y1="-1" x2="-7.5" y2="-2" />
        <line x1="-2.8" y1="1" x2="-7.5" y2="2" />
        <line x1="-2.5" y1="3" x2="-7" y2="5.5" />
        <line x1="2.5" y1="-3" x2="7" y2="-5.5" />
        <line x1="2.8" y1="-1" x2="7.5" y2="-2" />
        <line x1="2.8" y1="1" x2="7.5" y2="2" />
        <line x1="2.5" y1="3" x2="7" y2="5.5" />
      </g>
      <!-- Body. -->
      <ellipse cx="0" cy="1" rx="3.5" ry="4.5" fill="#5a3a1c" />
      <circle cx="0" cy="-3.5" r="1.6" fill="#3a2410" />
    </svg>
  </div>
</template>

<style scoped>
.tick-crawlers {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
}
.tick {
  position: absolute;
  top: -7px;
  left: -7px;
  will-change: transform;
}
.tick .legs {
  transform: rotate(var(--leg-wiggle, 0deg));
  transform-origin: center;
}
</style>
