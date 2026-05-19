---
shaping: true
---

# Audit action items

Source: `audit.md`. Each item = one bounded change. Tiered by distortion of model behavior.

Notation: `A1, A2…` are independent action items. Sub-parts (`A1.1…`) are mechanism steps inside one item.

---

## Tier 1 — Structural mechanism gaps ✅ done

All five implemented; build + 10 vitest specs pass.

- A1: `LYME.spilloverDiscount=0.5` blend with `spilloverBaselineInfectedNymphs=40` in `infection.ts`; flagged via `Intervention.propertyScale` on acaricide/tickTubes/baitBox/fourPoster.
- A2: `Intervention.rampSchedule [0.92, 0.60, 0.30]` on fourPoster; `CellState.consecutiveYears` tracker incremented in `engine.stepCell`; resets on skipped year.
- A3: `larvaSurvivalMul` removed from egg→larva, added to larva→nymph.
- A4: `deerFencing.cost: 5000 → 15000`, blurb/note updated; engine already charges once.
- A5: `engine.adultFeedSaturation` = Hill-3 + hard floor at 0.05/ha; `TICK.kDeerHalf: 1.5 → 3.5` to preserve baseline.

### A1: Decouple QN reduction from human cases

| Part | Mechanism |
|------|-----------|
| A1.1 | Add `spilloverDiscount` (~0.5) factor applied to property-scale interventions' effective impact on `humanBitesPerNymph`, so that cutting `Ninf` does not translate linearly to cases. |
| A1.2 | Tag affected interventions in `INTERVENTIONS` (`acaricide`, `tickTubes`, `baitBox`, `fourPoster`) with a `propertyScale: true` flag and consume that flag in `infection.ts::updateMouseInfection` (or a new `humanBites()` helper). |
| A1.3 | Test: pre/post intervention, ratio of `Δcases / ΔNinf` ≈ 0.5, not 1.0. |

- **Files:** `interventions.ts`, `infection.ts`, `params.ts` (add constant), `__tests__/engine.spec.ts`
- **Anchor:** audit §3 #1, research §5 flag #5 (Keesing 2022, Hinckley 2016).

---

### A2: Fix `fourPoster` time horizon

Currently single-year deployment delivers full 70% adult kill; literature shows ~8% at year 1, ramping to 60–91% by year 3–6.

| Part | Mechanism |
|------|-----------|
| A2.1 | Choice: (a) ramp — efficacy = f(years_active), e.g. 0.85, 0.55, 0.35, 0.30, 0.30 multiplier on adult survival; OR (b) gate full efficacy on N consecutive years deployed. |
| A2.2 | Add `rampSchedule?: number[]` to `Intervention` type; consume in `modifiersFor`. |
| A2.3 | Update `effect.note` to reflect ramp behavior. |

- **Files:** `interventions.ts`, `engine.ts::modifiersFor`
- **Anchor:** audit §1 fourPoster row, §3 (currently equivalent to acaricide).

---

### A3: Fix `larvaSurvivalMul` double-counting in egg→larva

`engine.ts:77` multiplies `eggsToLarvae` by `mods.larvaSurvivalMul`, then `engine.ts:82` multiplies `larvaToNymph` by it again. Tick tubes kill the same cohort twice.

| Part | Mechanism |
|------|-----------|
| A3.1 | Remove `mods.larvaSurvivalMul` from line 77. Keep on line 82 only. |
| A3.2 | Test: deploy `tickTubes` once → year-over-year nymph reduction tracks 0.40 (single 60% kill), not 0.16 (compound). |

- **Files:** `engine.ts`, `__tests__/engine.spec.ts`
- **Anchor:** audit §3 #3.

---

### A4: Resolve `deerFencing` cost model

Today: $5000/yr × 1 year deploy buys 10 years of full effect. Pick a model.

**Decision: A4-A (capex).**

| Part | Mechanism |
|------|-----------|
| A4.1 | `interventions.ts`: `deerFencing.cost = 15000`, keep `persistsYears = 10`. |
| A4.2 | `engine.ts::advanceYear`: charge cost only on **fresh** deploy (year `deploys.has(id)`), not on carry-over years. Verify current loop on line 139 already does this — it does. So no engine change needed; current code charges per fresh deploy, A4-A is just a constant change. |
| A4.3 | Update `effect.note` to "one-time capex; 10-yr durable." |

- **Files:** `interventions.ts` (constant only).
- **Anchor:** audit §1 deerFencing row, §3 #6.

---

### A5: Add deer threshold (Monhegan inflection near 0.05/ha)

| Part | Mechanism |
|------|-----------|
| A5.1 | Replace `saturation(D, kDeerHalf)` with Hill-n (n≈3) OR add a hard floor: `adultFeedSat = D < 0.05 ? 0 : hill(D)`. |
| A5.2 | Adjust `kDeerHalf` accordingly (current 1.5 smooths the elbow). |
| A5.3 | Test: solo `deerCull` over multiple years → tick collapse near 0.05 deer/ha. |

- **Files:** `engine.ts::saturation` (or new `adultFeedSaturation`), `params.ts`
- **Anchor:** audit §2 `kDeerHalf` row, §3 #2, research §5 flag #6.

---

## Tier 2 — Display/mechanic consistency + minor mechanism fixes

All five ✅ done.

- A6: `baitBox.effect.medianPct: 65 → 50`, note updated.
- A7: `engine.ts` nymphToAdult line now `* mods.adultSurvivalMul`.
- A8: `doxyProphylaxis.apply 0.13 → 0.65`; medianPct 87→35; rangePct [10,70]; note explains population discount.
- A9: `sAdultOverwinter 0.50 → 0.40`; `humansPerCell 5 → 10`; survival/bite/dispersal constants commented with citations.
- A10: new `sim/clustering.ts` 4-connected BFS; `Intervention.minContiguousCells` (deerFencing=6, fourPoster=8); `engine.advanceYear` precomputes per-intervention cluster sizes from fresh deploys + carry-over; `modifiersFor` skips `apply()` when below threshold; cost still charged. `CellInspector.vue` shows ⚠ / ✓ cluster status per gated intervention.

### A6: Reconcile `baitBox` display vs. mechanic

`effect.medianPct = 65` but `apply()` yields ~50%. Pick one.

- A6-A: lower `medianPct` to 50.
- A6-B: tighten `apply()` to `larva *= 0.35, nymph *= 0.35` (65% kill).
- **Files:** `interventions.ts`
- **Anchor:** audit §1 baitBox row.

---

### A7: Add `adultSurvivalMul` to nymph→adult transition

`engine.ts:89` omits `mods.adultSurvivalMul`. fourPoster kills standing adults but not freshly-molted adults feeding on treated deer.

- Add `* mods.adultSurvivalMul` to `nymphToAdult` line.
- **Files:** `engine.ts`
- **Anchor:** audit §3 #4.

---

### A8: Add adherence/coverage for `doxyProphylaxis`

Per-bite 87% is applied as population-wide multiplier. Realistic effective rate ~30–50%.

- Change `humanTransmissionMul *= 0.13` → `*= 0.65` (35% population-effective reduction).
- Update `effect.medianPct` to ~35 and `note` to explain bite-recognition / 72h / prescription chain.
- **Files:** `interventions.ts`
- **Anchor:** audit §1 doxy row, §4.

---

### A9: Cite or tune param constants

Bulk follow-up — annotate or change each in `params.ts`:

| Param | Action |
|-------|--------|
| `sAdultOverwinter` | Change 0.50 → 0.40 per research §5. |
| `sLarvaToNymph`, `sNymphToAdult` | Add citation comment (Lindsay / Ostfeld ranges). |
| `nymphBitesPerMouse`, `larvaBitesPerMouse` | Document as derived from `pNymphToMouse * exposures`; cite. |
| `DISPERSAL.*` | Comment as "tuning knobs, not empirical." |
| `humansPerCell` | 5 → 10 (1-ha residential cell). |

- **Files:** `params.ts`
- **Anchor:** audit §2, §4.

---

### A10: Spatial-scale gating

`deerFencing` needs ≥15-acre exclosure (≈6 adjacent cells). `fourPoster` needs station per 20–50 acres + multi-year.

| Part | Mechanism |
|------|-----------|
| A10.1 | Add `minContiguousCells?: number` on `Intervention`. |
| A10.2 | In `modifiersFor` (or precompute pass), zero out effect for cells whose connected deployed-cluster < `minContiguousCells`. |
| A10.3 | UI surfaces "needs N more adjacent" warning in `CellInspector`. |

- **Files:** `interventions.ts`, `engine.ts`, `components/CellInspector.vue`
- **Anchor:** audit §3 #7.

---

## Tier 3 — New mechanism ✅ done

### A11: Reservoir-targeted vaccine (RTV) ✅

Only fully-missing intervention from research §5. Acts on `pNymphToMouse` / `pMouseToLarva`, not tick survival.

| Part | Mechanism |
|------|-----------|
| A11.1 | Extend `Modifiers` with `mouseInfectivityMul` (multiplies `pMouseToLarva`) and `mouseAcquisitionMul` (multiplies `pNymphToMouse`). |
| A11.2 | Wire both into `infection.ts::updateMouseInfection` and `fracNewNymphInfected`. |
| A11.3 | New intervention `reservoirVaccine` in `INTERVENTIONS`. Cost / efficacy from research §5. |

- **Files:** `interventions.ts`, `infection.ts`, `params.ts`
- **Anchor:** audit §5 #11.

**Implemented:**
- `Modifiers.mouseAcquisitionMul` (scales `LYME.pNymphToMouse`) and `mouseInfectivityMul` (scales `LYME.pMouseToLarva`); both default to 1.
- `updateMouseInfection` and `fracNewNymphInfected` take the corresponding multipliers; engine threads `mods.mouseAcquisitionMul` / `mods.mouseInfectivityMul` through.
- New intervention `reservoirVaccine` — $400/cell/yr, apply sets both muls to 0.76 (24% block, per Tsao 2004 / Richer 2014). NIP metric, range [10, 41].
- 1 new test (`A11: reservoirVaccine reduces transmission without affecting tick density`): nymph density invariant; mouse infection lower; cumulative human cases lower over 3 years.

---

## Deferred follow-ups

### Quick wins ✅ done

- **D5** (audit §3 #5 — compound transmission stacking): new `LYME.humanTransmissionFloor = 0.20` clamped in `modifiersFor` so `messaging × doxy × vaccine` can't exceed 80% reduction. Crude proxy for correlated adherence. Test asserts the floor.
- **D8** (audit §3 #8 — mouse time-step ordering): moved mouse + deer logistic growth from step 6 → step 1b (before tick/host interaction math). Now `mouseSat`, `fracNewNymphInfected`, and `updateMouseInfection` all see the same M.
- **D-vac** (audit §1 — lymeVaccine zero-uncertainty): `rangePct [73, 73] → [50, 90]`, note updated to flag single-trial uncertainty.

### Still deferred

- **No reservoir alternatives** (audit §3 #9 — chipmunks, shrews, birds): would need a `mouseReservoirFraction` blend in `fracNewNymphInfected` (mirrors A1 spillover). ~30 lines + test; meaningful for RTV/tubes/boxes calibration but not load-bearing for current tier scope.
- **Deterministic, no variance** (audit §3 #10): Monte Carlo / RNG seeding rework. Out of scope for this pass.

---

## Verification (all items)

- `npm test` from `game/` after each change.
- `npm run build` from `game/` for type check.
- Scenario probes per audit §"Verification".
