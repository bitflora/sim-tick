<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue';
import { useGameStore } from '../store/game';

const TOTAL = 50;
const store = useGameStore();

interface Crawler {
  x: number;
  y: number;
  heading: number;
  speed: number;
  turnTimer: number;
}

const elRefs = ref<(HTMLElement | null)[]>([]);
const crawlers: Crawler[] = [];
const visibleCount = computed(() => Math.round(TOTAL * store.tickPopulationFraction));

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function makeCrawler(): Crawler {
  return {
    x: rand(0, window.innerWidth),
    y: rand(0, window.innerHeight),
    heading: rand(0, Math.PI * 2),
    speed: rand(8, 22),
    turnTimer: rand(0.5, 2.5),
  };
}

let raf = 0;
let lastT = 0;
let viewW = 0;
let viewH = 0;

function onResize() {
  viewW = window.innerWidth;
  viewH = window.innerHeight;
}

function frame(t: number) {
  const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
  lastT = t;
  const vis = visibleCount.value;
  const els = elRefs.value;
  for (let i = 0; i < TOTAL; i++) {
    if (i >= vis) continue;
    const c = crawlers[i];
    c.turnTimer -= dt;
    if (c.turnTimer <= 0) {
      c.heading += rand(-1.2, 1.2);
      c.turnTimer = rand(0.4, 2.0);
    }
    c.x += Math.cos(c.heading) * c.speed * dt;
    c.y += Math.sin(c.heading) * c.speed * dt;
    if (c.x < 0) { c.x = 0; c.heading = Math.PI - c.heading; }
    else if (c.x > viewW) { c.x = viewW; c.heading = Math.PI - c.heading; }
    if (c.y < 0) { c.y = 0; c.heading = -c.heading; }
    else if (c.y > viewH) { c.y = viewH; c.heading = -c.heading; }
    const el = els[i];
    if (el) {
      el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) rotate(${c.heading + Math.PI / 2}rad)`;
    }
  }
  raf = requestAnimationFrame(frame);
}

let running = false;
function start() {
  if (running) return;
  running = true;
  lastT = 0;
  raf = requestAnimationFrame(frame);
}
function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function onVisibility() {
  if (document.hidden) stop(); else start();
}

onMounted(() => {
  for (let i = 0; i < TOTAL; i++) crawlers.push(makeCrawler());
  onResize();
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  start();
  // Apply initial transforms once Vue has rendered the refs.
  requestAnimationFrame(() => {
    const els = elRefs.value;
    for (let i = 0; i < TOTAL; i++) {
      const c = crawlers[i];
      const el = els[i];
      if (el) el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) rotate(${c.heading + Math.PI / 2}rad)`;
    }
  });
});

onBeforeUnmount(() => {
  stop();
  window.removeEventListener('resize', onResize);
  document.removeEventListener('visibilitychange', onVisibility);
});

// Pause when no ticks visible — saves CPU when population collapses.
watchEffect(() => {
  if (visibleCount.value === 0) stop(); else start();
});
</script>

<template>
  <div class="tick-crawlers" aria-hidden="true">
    <div
      v-for="i in TOTAL"
      :key="i"
      :ref="el => (elRefs[i - 1] = el as HTMLElement | null)"
      class="tick"
      :class="{ hidden: i - 1 >= visibleCount }"
    >
      <svg width="14" height="14" viewBox="-10 -10 20 20">
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
        <ellipse cx="0" cy="1" rx="3.5" ry="4.5" fill="#5a3a1c" />
        <circle cx="0" cy="-3.5" r="1.6" fill="#3a2410" />
      </svg>
    </div>
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
  width: 14px;
  height: 14px;
  will-change: transform;
  contain: layout paint;
}
.tick.hidden { display: none; }
.tick .legs {
  transform-origin: center;
  animation: legwiggle 0.32s ease-in-out infinite alternate;
}
@keyframes legwiggle {
  from { transform: rotate(-6deg); }
  to   { transform: rotate(6deg); }
}
</style>
