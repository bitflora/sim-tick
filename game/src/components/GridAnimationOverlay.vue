<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useGameStore, ANIMATION_MS } from '../store/game';
import { GRID_SIZE } from '../sim/params';
import type { FlowKind } from '../sim/grid';
import TickGlyph from './TickGlyph.vue';

const store = useGameStore();

interface AnimIcon {
  key: string;
  glyph: string;
  kind: FlowKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delayMs: number;
}

interface Skull {
  key: string;
  x: number;
  y: number;
}

const icons = ref<AnimIcon[]>([]);
const skulls = ref<Skull[]>([]);
const gridEl = ref<HTMLElement | null>(null);

// Icons per unit-amount (kind -> per-icon amount threshold). Higher = fewer icons.
const THRESHOLD: Record<FlowKind, number> = {
  tickA: 8,
  mouse: 4,
  deer: 0.04,
};
const MAX_PER_FLOW = 2;
const GLYPH: Record<FlowKind, string> = {
  tickA: '',
  mouse: '🐭',
  deer: '🦌',
};

function cellCenter(rect: DOMRect, i: number): [number, number] {
  const r = Math.floor(i / GRID_SIZE);
  const c = i % GRID_SIZE;
  const cw = rect.width / GRID_SIZE;
  const ch = rect.height / GRID_SIZE;
  return [c * cw + cw / 2, r * ch + ch / 2];
}

let cleanupTimer: number | null = null;

function spawn() {
  const el = gridEl.value?.parentElement?.querySelector('.grid') as HTMLElement | null;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const wrapRect = gridEl.value!.getBoundingClientRect();
  // Offset within the overlay container.
  const offX = rect.left - wrapRect.left;
  const offY = rect.top - wrapRect.top;

  const cw = rect.width / GRID_SIZE;
  const ch = rect.height / GRID_SIZE;
  // Perpendicular offset per kind, in fraction of cell size, to separate tracks.
  // +1 = one side of the movement axis, -1 = the other. Tick adults ride center.
  const TRACK: Record<FlowKind, number> = { deer: -0.25, mouse: 0.25, tickA: 0 };

  const newIcons: AnimIcon[] = [];
  let keyN = 0;
  for (const f of store.lastFlows) {
    const t = THRESHOLD[f.kind];
    const count = Math.min(MAX_PER_FLOW, Math.max(1, Math.ceil(f.amount / t)));
    const [fx, fy] = cellCenter(rect, f.from);
    const [tx, ty] = cellCenter(rect, f.to);
    // Perpendicular unit vector to movement direction (rot 90° CW): (dy, -dx).
    const dx = tx - fx;
    const dy = ty - fy;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = (dy / len);
    const perpY = (-dx / len);
    const trackFrac = TRACK[f.kind];
    // Scale by cell dimension along the perpendicular axis so quadrant-aligned for orthogonal moves.
    const offsetX = perpX * trackFrac * cw;
    const offsetY = perpY * trackFrac * ch;
    for (let k = 0; k < count; k++) {
      const jitterX = (Math.random() - 0.5) * 10;
      const jitterY = (Math.random() - 0.5) * 10;
      newIcons.push({
        key: `i${keyN++}`,
        glyph: GLYPH[f.kind],
        kind: f.kind,
        fromX: offX + fx + offsetX + jitterX,
        fromY: offY + fy + offsetY + jitterY,
        toX: offX + tx + offsetX + jitterX,
        toY: offY + ty + offsetY + jitterY,
        delayMs: Math.random() * 800,
      });
    }
  }

  const newSkulls: Skull[] = [];
  for (let i = 0; i < store.lastTickDeltas.length; i++) {
    if (store.lastTickDeltas[i] < 0) {
      const [x, y] = cellCenter(rect, i);
      newSkulls.push({ key: `s${i}`, x: offX + x, y: offY + y });
    }
  }

  icons.value = newIcons;
  skulls.value = newSkulls;

  if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
  cleanupTimer = window.setTimeout(() => {
    icons.value = [];
    skulls.value = [];
    cleanupTimer = null;
  }, ANIMATION_MS + 50);
}

watch(() => store.animationToken, (t) => {
  if (t > 0 && store.animating) {
    // Wait one frame so the new grid layout settles before measuring.
    requestAnimationFrame(() => requestAnimationFrame(spawn));
  }
});

onUnmounted(() => {
  if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
});
</script>

<template>
  <div ref="gridEl" class="overlay">
    <span
      v-for="ic in icons"
      :key="ic.key"
      class="glyph-fly"
      :class="'kind-' + ic.kind"
      :style="{
        left: ic.fromX + 'px',
        top: ic.fromY + 'px',
        '--tx': (ic.toX - ic.fromX) + 'px',
        '--ty': (ic.toY - ic.fromY) + 'px',
        animationDelay: ic.delayMs + 'ms',
      }"
    >
      <TickGlyph v-if="ic.kind === 'tickA'" :size="18" animated />
      <template v-else>{{ ic.glyph }}</template>
    </span>
    <span
      v-for="sk in skulls"
      :key="sk.key"
      class="skull"
      :style="{ left: sk.x + 'px', top: sk.y + 'px' }"
    >💀</span>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.glyph-fly {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.6));
  animation: drift 5000ms cubic-bezier(0.4, 0.0, 0.6, 1.0) forwards;
  opacity: 0;
}
.glyph-fly.kind-deer {
  font-size: 22px;
  animation: hop 5000ms linear forwards;
}
@keyframes drift {
  0%   { transform: translate(-50%, -50%) translate(0, 0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)); opacity: 0; }
}
@keyframes hop {
  0%    { transform: translate(-50%, -50%) translate(0, 0); opacity: 0; }
  8%    { opacity: 1; }
  12.5% { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.125), calc(var(--ty) * 0.125 - 14px)); }
  25%   { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.25),  calc(var(--ty) * 0.25)); }
  37.5% { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.375), calc(var(--ty) * 0.375 - 14px)); }
  50%   { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.5),   calc(var(--ty) * 0.5)); }
  62.5% { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.625), calc(var(--ty) * 0.625 - 14px)); }
  75%   { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.75),  calc(var(--ty) * 0.75)); }
  87.5% { transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.875), calc(var(--ty) * 0.875 - 14px)); }
  92%   { opacity: 1; }
  100%  { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)); opacity: 0; }
}
.skull {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 36px;
  line-height: 1;
  animation: skullflash 2200ms ease-out forwards;
  opacity: 0;
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.8));
}
@keyframes skullflash {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
  60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.0); }
}
</style>
