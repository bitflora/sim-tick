# Code review: tick-mitigation numbers vs. research

## Context

`game/src/sim/` simulates *I. scapularis* + *B. burgdorferi* on a 10×10 grid with 10 interventions. `research.md` (609 lines) is the literature reference compiled for the sim, with §5 explicitly mapping current code → published numbers. This review cross-walks current `params.ts` / `interventions.ts` / `engine.ts` against `research.md` and the underlying papers, then flags gaps and unstated assumptions.

Scope: validation only — no edits. Just findings.

---

## 1. Interventions: efficacy vs. literature

Anchors below come from `research.md` §2 + §3 + the cited papers.

| Intervention | Sim `apply()` | Sim effect.medianPct | Literature anchor | Verdict |
|---|---|---|---|---|
| **acaricide** | `tickSurvivalMul *= 0.30` (70% kill) | 70% QN | Hinckley 2016 RCT 63% QN; small-plot 68–100%; median ~70% | ✅ matches. **Caveat unaddressed**: Hinckley showed null on HC — sim still flows linearly to cases. |
| **tickTubes** | `larva *= 0.40`, `nymph *= 0.55` | 50% QN | Mather 1987 89%; Jordan/Schulze 20–28% NJ; median ~50% | ✅ on average. **Assumption added**: differential larva/nymph kill (60% vs 45%) is not literature-grounded — it's a guess that nymphs are slightly less susceptible. |
| **baitBox** | `larva *= 0.50`, `nymph *= 0.50` | 65% QN | Schulze 2017: 79–84% (NJ); Tick Project ~50% | ⚠ `apply()` implements ~50% (Tick Project value) but `effect.medianPct = 65` (display number) — **inconsistency between mechanic and display**. |
| **fourPoster** | `adultSurvivalMul *= 0.30` (70% adult kill), **no `persistsYears`** | 60% QN | Pound 60–91% by yr 4–6 area-wide; Stafford 2017 residential RCT only **8%** | ❌ **Major gap**. Research notes "best after ≥3 seasons" but sim treats it as a 1-year effect at near-peak efficacy. A single-cell, single-year deployment delivers 70% kill — empirically that scenario yields ~8%. |
| **deerCull** | `deerDensityMul *= 0.50` | 80% QN | 74% deer→90% NQ at multi-year; Monhegan threshold near 5/km² | ⚠ Linear halving misses the **threshold inflection** at ~0.05 deer/ha (research §5 flag #6). Current Beverton-Holt with `kDeerHalf=1.5` smooths the elbow into a gradient. |
| **deerFencing** | `adult *= 0.20`, `tick *= 0.30`, `persistsYears: 10`, $5000/yr | 85% QN | Daniels 1993, Williams 2025: 83–97%; capex ~$8–20/linear ft = ~$10–25k one-time for 1-ha perimeter | ⚠ **Cost model mismatch**: real fencing is capex (one-time $10–25k), sim charges $5000/year × 10 = $50k. Also **no spatial-scale gate**: research is explicit that <15-acre exclosures fail; a 1-ha (2.5-acre) cell would not see this effect in reality. |
| **habitatMgmt** | `habMul *= 0.4`, `persistsYears: 1` | 75% QN | Schulze 1995: 72.7–100%; research §5 recommendation matches exactly | ✅ |
| **messaging** | `humanTransmissionMul *= 0.80` | 20% HC | Beard 2018 review: 20–40% PPE uptake bump, HC effect rarely demonstrated | ✅ matches research §5 recommendation (was previously too generous at 0.5). |
| **doxyProphylaxis** | `humanTransmissionMul *= 0.13` | 87% EM | Nadelman 2001 NEJM: 87% (CI 25–98%) | ⚠ **Per-bite efficacy applied as population-level multiplier.** Real doxy requires (a) bite recognized, (b) tick removed <72 h, (c) prescription filled. Sim implicitly assumes 100% uptake. Realistic effective rate is ~30–50%. |
| **lymeVaccine** | `humanTransmissionMul *= 0.27`, `persistsYears: 3` | 73% HC | VALOR phase 3 interim 2026, 73.2% | ⚠ Single ongoing trial, not licensed. Note says so. **Range is [73, 73]** — pretends single point estimate has no uncertainty. |

---

## 2. Demographic / transmission params (`params.ts`)

| Param | Value | Literature | Verdict |
|---|---|---|---|
| `eggsPerAdult` | 2000 | Ostfeld 2011: 1500–3000 | ✅ Cited. |
| `sEggToLarva` | 0.05 | ~Lindsay, Ostfeld 0.05–0.10 | ⚠ Uncited. Plausible. |
| `sLarvaToNymph` | 0.10 | 0.05–0.10 | ⚠ Uncited. Upper end. |
| `sNymphToAdult` | 0.08 | 0.05–0.10 | ⚠ Uncited. |
| `sAdultOverwinter` | 0.50 | Lindsay 0.30–0.50 | ⚠ research §5 says "upper end, consider 0.4". **Not adjusted**. |
| `kMouseHalf` | 8/ha | Few direct measurements | ⚠ Uncited but plausible. |
| `kDeerHalf` | 1.5/ha | Smooths Monhegan threshold (~0.05/ha) | ❌ **Wrong functional form** — see §3 below. |
| `MOUSE.r=1.2, K=50` | — | r≈1–2, K=30–80 | ✅ Uncited but in range. |
| `DEER.r=0.25, K=8` | — | Suburban edge 5–25/ha | ✅ Uncited but in range. |
| `pNymphToMouse` | 0.83 | Donahue 1987 | ✅ Cited. |
| `pMouseToLarva` | 0.65 | Mather 0.40–0.85 | ✅ Cited. |
| `pNymphToHuman` | 0.03 | Published 0.01–0.05 | ✅ Mid-range. |
| `nymphBitesPerMouse` | 4.0 | No direct citation | ⚠ Derived param, not from a specific source. |
| `larvaBitesPerMouse` | 12.0 | No direct citation | ⚠ Same. |
| `humanBitesPerNymph` | 0.002 | Suburban 10⁻³–10⁻² | ✅ Conservative end. |
| `humansPerCell` | 5 | Uncited | ⚠ For a 1-ha cell with 0.2–0.5 ha lots = 2–5 households = 5–15 people. 5 is low. |
| `pVertical` | 0 | ~1% in literature | ✅ Acceptable simplification. |
| `INIT.fracNymphInf` | 0.20 | "Endemic" anchor; CT/NY NIP 15–35% | ✅ |
| `INIT.fracMouseInf` | 0.25 | Reasonable endemic | ✅ |
| `DISPERSAL.*` | 0.02 / 0.05 / 0.20 | Uncited | ⚠ Tuning knobs, no empirical anchor. |

---

## 3. Mechanism gaps in `engine.ts`

These are structural issues independent of constant values.

1. **Tick Project decoupling missing.** The headline finding of the largest property-scale RCT (Keesing 2022, Hinckley 2016) is that **QN reduction does not produce HC reduction** at residential scale. The sim computes `cases = humansPerCell * humanBitesPerNymph * Ninf * pNymphToHuman * humanTransmissionMul` — strictly linear in `Ninf`. Any property-scale intervention that cuts nymphs also cuts cases proportionally. `research.md` §5 flag #5 calls this out as the most important missing mechanism. Notes on individual interventions (`note: 'null on human cases'`) document the gap but the model doesn't reproduce it.

2. **Deer threshold (Monhegan effect) not represented.** Empirically, *Ixodes* adult reproduction collapses below ~5 deer/km² (≈ 0.05/ha). Current `saturation(D, kDeerHalf=1.5)` gives a smooth Hill-1 curve — at D=0.05/ha, saturation = 0.05/1.55 ≈ 3.2% feeding success, not 0. Hard floor / Hill-n absent. (research.md §5 flag #6.)

3. **Multiplier semantics blur stage transitions.** `eggsToLarvae` line uses `tickSurvivalMul * larvaSurvivalMul`. Both names suggest "kill in residence" — but `larvaSurvivalMul` is intended for tick tubes (kill *during larval mouse feeding*), and the egg→larva transition happens **before** any mouse feeding. So tick tubes (set `larvaSurvivalMul=0.40`) would reduce the egg→larva yield by 60% in addition to reducing larva→nymph by 60% — **double-counts the kill**. The same larva is being killed both as a hatching egg and as a feeding larva.

4. **`nymphToAdult` omits `adultSurvivalMul`.** Line 89 uses `mods.tickSurvivalMul * cell.hab` but not `adultSurvivalMul`. Means fourPoster (which kills adults via deer-applied permethrin) only kills standing overwintered adults, not the freshly-molted cohort feeding on the treated deer. Real fourPoster impacts adults *during* their deer blood meal, then cascades to fewer eggs. Probably minor (the impact propagates indirectly via reduced eggs the next year through `adultSurv`), but the within-year mechanism is off.

5. **Multiplicative human-transmission stacking.** Messaging (0.80) × doxy (0.13) × vaccine (0.27) = **0.028 ≈ 97% reduction**. Real-world co-deployment doesn't compound this cleanly — a vaccinated person doesn't *also* take post-bite doxy, and adherence is correlated. No cap or interaction term.

6. **`persistsYears` cost model ambiguity.** For `deerFencing` (capex in reality), the sim charges `$5000` per year of deployment — but the persistsEffect carries 10 years past deployment without payment. So a one-year `$5000` deployment buys 10 years of full effect. This is a **bug or a design choice**: either should be one-time charge for 10-year benefit, or per-year ongoing charge for 10-year amortization. Currently it's the cheapest of both.

7. **No spatial-scale gating.** `deerFencing` literature requires ≥15-acre exclosure. `fourPoster` requires station per 20–50 acres + multi-year. Sim allows single-cell (1 ha = 2.5 acres) deployment with full efficacy. The note in `effect.note` warns the user but the mechanic ignores it.

8. **Time-step inconsistency in mouse infection.** Sequence in `stepCell`: (a) line 80 `mouseSat` uses **pre-growth** `cell.M`; (b) line 85 `fracNewNymphInfected` reads **pre-growth** `cell.Minf/M`; (c) line 110 mouse logistic growth; (d) line 118 `updateMouseInfection` operates on **post-growth** `cell.M`. So mouse infection acquisition is computed on this year's grown mouse pool but using last year's `Ninf`. Within-year ordering is mixed.

9. **No reservoir alternatives.** Chipmunks, shrews, birds contribute substantially to NIP (Tsao 2004, Brisson 2008). Sim has only mice → inflates the modeled efficacy of mouse-targeted interventions (tickTubes, baitBox, hypothetical RTV).

10. **Deterministic, no variance.** All `apply()` multipliers are point estimates. `effect.rangePct` is display-only metadata. Even though research repeatedly emphasizes "range, not SD" with wide spreads (e.g., fourPoster 8–91%), the sim never samples or even propagates this uncertainty.

---

## 4. Assumptions added (not in research)

Things the code commits to that the literature does not directly support:

- **Differential larva vs. nymph kill for tick tubes** (0.40 vs 0.55). Literature reports a single QN endpoint.
- **`baitBox` display median (65%)** differs from `apply()` median (~50%). Display was probably chosen as midpoint of NJ + Tick Project; mechanic chose conservative Tick Project number.
- **`fourPoster` flat 70% kill in year 1**. Stafford 2017 RCT explicitly contradicts this for residential 1-year horizon.
- **`deerCull` 50% halving with smooth saturation**. Real cull dynamics are threshold-driven and depend on remaining-density floor.
- **`messaging` 20% case reduction**. Real PPE uptake increases 20–40% but case incidence effect is "rarely demonstrated" (Beard 2018). The sim translates uptake directly to case reduction.
- **`doxyProphylaxis` 87% applied to all cases population-wide**. Nadelman's 87% is per attached-bite efficacy in a hyperendemic compliant cohort. Population-level effective rate would be much lower.
- **`lymeVaccine` 73% with zero uncertainty**. Phase 3 interim is a single trial in progress.
- **Compound human-transmission multipliers**. No empirical basis for `messaging × doxy × vaccine` being independent.
- **`deerFencing` persists 10 years after one $5000 charge**. Real capex / opex split not represented.
- **`humansPerCell = 5`** for 1-ha residential cell. Probably should be ~10.
- **All four `DISPERSAL` constants** are pure tuning knobs.
- **`sAdultOverwinter = 0.50`** — research §5 explicitly recommended 0.4; not changed.

---

## 5. Action items, prioritized

In rough order of "biggest distortion of model behavior":

1. **Add QN→HC decoupling.** Multiply property-scale interventions' impact on `humanBitesPerNymph` by a spillover discount (~0.5) — research §5 #5.
2. **Fix `fourPoster` time horizon.** Either reduce single-year multiplier to ~0.85 (15% kill) and set `persistsYears` with ramp-up, or gate full efficacy on sustained multi-year deployment. (Currently mechanically identical to acaricide.)
3. **Fix `larvaSurvivalMul` double-counting** in `eggsToLarvae` (line 76–77). Should only apply at the larva→nymph step.
4. **Resolve `deerFencing` cost model** — either one-time capex or amortized opex, not both.
5. **Add deer hard-floor / Hill-n** for the Monhegan-style threshold near 0.05/ha.
6. **Reconcile `baitBox` display vs. mechanic** (65% vs ~50%).
7. **Add `adultSurvivalMul` to `nymphToAdult`** (or document why omitted).
8. **Add adherence / coverage factor for `doxyProphylaxis`.**
9. **Cite or tune** `sLarvaToNymph`, `sNymphToAdult`, `sAdultOverwinter`, `nymphBitesPerMouse`, `larvaBitesPerMouse`, and dispersal fractions. At minimum, `sAdultOverwinter` → 0.4 per research §5.
10. **Spatial-scale gating** for `deerFencing` and `fourPoster` (no effect unless N adjacent cells deployed simultaneously).
11. **Reservoir-targeted vaccine (RTV)** is the one fully-missing intervention from research §5 — it acts on `pNymphToMouse` / `pMouseToLarva`, not on tick survival.

---

## Critical files

- `game/src/sim/params.ts` — all numeric constants
- `game/src/sim/interventions.ts` — efficacy multipliers, costs, citations
- `game/src/sim/engine.ts` — where multipliers compose; lines 73–97 are the stage-transition mechanics that have ordering issues
- `game/src/sim/infection.ts` — `updateMouseInfection` and `fracNewNymphInfected`
- `research.md` — §5 is the ground-truth crosswalk

## Verification (if turning findings into changes)

- `npm test` from `game/` — Vitest specs in `game/src/sim/__tests__/`
- `npm run build` from `game/` — type-check via vue-tsc
- Manual scenario probes: deploy `fourPoster` solo for 1 year vs 5 years and confirm efficacy ramps; deploy `deerCull` over multiple years and verify threshold collapse near 0.05 deer/ha; combine `messaging + doxy + vaccine` and confirm a sane (not 97%) total reduction.
