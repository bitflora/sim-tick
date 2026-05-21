<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue';
import { useGameStore } from '../store/game';
import TickGlyph from './TickGlyph.vue';

const TOTAL = 50;
const store = useGameStore();

interface Crawler {
  x: number;
  y: number;
  heading: number;
  targetHeading: number;
  speed: number;
  turnTimer: number;
}

// Max angular velocity (rad/s) — caps how fast a tick can pivot.
const TURN_RATE = 2.2;

function wrapAngle(a: number): number {
  // Shortest signed delta into [-PI, PI].
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

const elRefs = ref<(HTMLElement | null)[]>([]);
const crawlers: Crawler[] = [];
const visibleCount = computed(() => Math.round(TOTAL * store.tickPopulationFraction));

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function makeCrawler(): Crawler {
  const h = rand(0, Math.PI * 2);
  return {
    x: rand(0, window.innerWidth),
    y: rand(0, window.innerHeight),
    heading: h,
    targetHeading: h,
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
      c.targetHeading = c.heading + rand(-1.2, 1.2);
      c.turnTimer = rand(0.6, 2.4);
    }
    // Ease heading toward target at capped angular velocity.
    const dh = wrapAngle(c.targetHeading - c.heading);
    const step = Math.sign(dh) * Math.min(Math.abs(dh), TURN_RATE * dt);
    c.heading += step;
    c.x += Math.cos(c.heading) * c.speed * dt;
    c.y += Math.sin(c.heading) * c.speed * dt;
    if (c.x < 0) { c.x = 0; c.heading = Math.PI - c.heading; c.targetHeading = c.heading; }
    else if (c.x > viewW) { c.x = viewW; c.heading = Math.PI - c.heading; c.targetHeading = c.heading; }
    if (c.y < 0) { c.y = 0; c.heading = -c.heading; c.targetHeading = c.heading; }
    else if (c.y > viewH) { c.y = viewH; c.heading = -c.heading; c.targetHeading = c.heading; }
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
      <TickGlyph :size="14" animated />
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
</style>
