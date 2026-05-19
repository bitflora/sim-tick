# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The active codebase is the Vue 3 + TypeScript app in `game/`. The top-level `src/ticks/`, `tests/`, `notebooks/`, `data/`, and `.venv/` are leftover Python scaffolding — currently empty (only `__pycache__/`). Do not add Python code unless the user explicitly asks; do new work under `game/`.

## Commands (run from `game/`)

- `npm run dev` — Vite dev server on port 5173.
- `npm run build` — type-check via `vue-tsc -b` then `vite build`. Use this for type checking; there is no separate lint/typecheck script.
- `npm test` — Vitest run (one-shot, not watch). Single test: `npx vitest run path/to/file.spec.ts -t "name"`.
- `npm run preview` — preview production build.

## Architecture

A single-player, turn-based simulation game: the player allocates an annual budget across tick/Lyme interventions on a 10×10 grid for 10 years.

**Two layers, one direction of dependency: `components/` and `store/` depend on `sim/`; `sim/` is pure TypeScript with no Vue.**

### Simulation (`game/src/sim/`)

Compartmental model of *Ixodes scapularis* + *Borrelia burgdorferi* with explicit spatial dispersal. All densities are per hectare; all rates are annual. `params.ts` holds biological/economic constants (cited inline) — treat changes there as model recalibration, not refactors.

- `cell.ts` — `CellState`: tick stages `L/N/A` with infected subsets `Linf/Ninf/Ainf`, host counts `M/D` with `Minf`, habitat multiplier, and per-cell intervention bookkeeping (`habMgmtYearsLeft`).
- `grid.ts` — `Grid = CellState[]` flat array indexed `r * GRID_SIZE + c`. `applyDispersal` redistributes a fraction of adults/mice to 4-neighbors (edges leak to sink) and pulls deer toward neighbor mean.
- `infection.ts` — `updateMouseInfection` advances mouse infection from infected-nymph hazard and returns this year's human cases; `fracNewNymphInfected` computes the infected fraction of larvae→nymph cohort.
- `interventions.ts` — `INTERVENTIONS` registry. Each intervention `apply(m)` mutates a `Modifiers` struct of stage-specific multipliers consumed by `engine.stepCell`. Add new interventions here and they automatically appear in the UI catalog.
- `engine.ts` — `advanceYear(grid, deployments)`:
  1. clones the grid, then for each cell builds `Modifiers` from this year's deployments **plus** carry-over (`habMgmtYearsLeft`),
  2. applies one-shot host adjustments → tick reproduction (eggs need deer saturation) → larva→nymph (needs mouse saturation) → nymph→adult → adult overwinter,
  3. updates mouse infection and accrues human cases,
  4. runs `applyDispersal` last.
  Stage transitions are computed into locals (`newL`, `newN`, etc.) and committed at the end of `stepCell`, so within-cell calculations see the *prior* year's stage counts. Preserve this ordering when editing.

### State + UI (`game/src/store/`, `game/src/components/`)

- `store/game.ts` — Pinia store. `pendingDeployments` is a per-cell `Set<InterventionId>` accumulated during a year; `advance()` calls `advanceYear`, pushes a `YearRecord`, and clears pending. Budget enforcement is in the `overBudget` getter — `advance()` is a no-op when over budget or `gameOver`.
- `components/` — `GridView`, `CellInspector`, `BudgetBar`, `HistoryChart`, `YearControls`. All read from the store.

### UI pane names (for communication)

When discussing the running app, refer to the on-screen regions by these names:

- **YearBar** — top header strip: title + `YearControls` (year counter, Advance Year button).
- **BudgetBar** — annual budget meter below the header (`BudgetBar.vue`).
- **Map** — 10×10 grid, upper-left of main row (`GridView.vue`).
- **History** — time-series chart below Map (`HistoryChart.vue`).
- **Inspector** — right sidebar, per-cell detail + intervention picker (`CellInspector.vue`).

### Tests

Vitest specs live next to the code under `__tests__/` (e.g. `game/src/sim/__tests__/engine.spec.ts`). Vitest is configured in `vite.config.ts` with `environment: 'node'` and `globals: true` — no separate `vitest.config`.
