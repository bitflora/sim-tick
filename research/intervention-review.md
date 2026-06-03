# Intervention Audit — Costs, Effects, Mechanism

## Context

`game/src/sim/interventions.ts` registers 12 interventions. Effect magnitudes already carry inline citations; **costs do not** — every cost is a round per-hectare figure × 259 ha/cell with no source. User wants a full audit (price + effect + mechanism) of all 12, holding the whole-cell pricing convention constant. Deliverable is a **validation report only** — no code edits.

## Deliverable

A single markdown report written to this plan file (replacing this section after audit). For each intervention, three checks:

1. **Cost** — compare per-hectare unit cost to peer-reviewed / extension-service figures. Flag mismatches > ~2×.
2. **Effect magnitude** — re-verify the cited multiplier against the linked source's reported reduction. Confirm the cited interval bounds match what the paper says.
3. **Mechanism** — confirm `Modifiers` field choice matches the biology (e.g. acaricide → tick survival, not host density), confirm ramp/persistence schedule matches field-trial trajectories, and flag any modifier that conflates stages or double-counts with another intervention's mechanism.

## Per-intervention checklist

For each of the 12 interventions below, produce a row with: current cost ($/ha), literature range ($/ha), verdict (OK / high / low / unsourced), effect-magnitude verdict, mechanism verdict, and a one-line note.

| id | current $/ha | review focus |
|---|---|---|
| acaricide | 700 | residential spray rates; whole-cell vs yard scope |
| tickTubes | 250 | per-tube cost × density per acre |
| baitBox | 350 | Tick Project unit cost (~$25 × deployments/ha) |
| fourPoster | 1,200 | unit + corn cost; per-50-acre coverage; ramp matches Pound 2009 trajectory |
| deerCull | 2,000 | sharpshoot/contractor $/deer × deer/ha — suspected ~5–10× high |
| deerFencing | 926 (one-time) | citation already inline ($37/m × ~6.4 km perimeter); sanity-check |
| habitatMgmt | 150 | brush mowing / leaf removal extension rates |
| messaging | 50 | per-resident public-health campaign cost (2,590 people/cell) |
| doxyProphylaxis | 200 | drug + recognition/visit cost × coverage |
| reservoirVaccine | 400 | pre-commercial; bait delivery cost is the anchor |
| fungalBiocontrol | 280 | Met52 commercial $/acre |
| lymeVaccine | 600 | $/dose × coverage × cell population |

## Cross-cutting items to address

1. **Costs are uncited.** Every cost should get a comment line in the report referencing the basis (paper, extension bulletin, vendor quote).
2. **Property-scale cost convention.** acaricide / tickTubes / baitBox / fourPoster carry `propertyScale: true` and use `spilloverDiscount` to attenuate efficacy, but their costs are whole-cell. Hold convention; **document** that costs assume cell-wide deployment even though efficacy is yard-discounted — readers should understand this is an intentional modeling choice.
3. **deerCull magnitude.** $518k/cell/yr → $2,000/ha. At suburban-edge `DEER.K = 0.5/ha` × 259 ha = ~130 deer/cell, this implies ~$4,000/deer removed. Sharpshooting contractor rates cluster $300–1,000/deer. Flag as likely too high.
4. **fourPoster ramp.** Schedule `[0.92, 0.60, 0.30]` resets on a missed year. Confirm Pound 2009 / Stafford 2017 actually show this snap-back rather than a gentler decay; if not, mechanism note.
5. **doxyProphylaxis double-dipping.** `humanTransmissionMul *= 0.65` lives in the same channel as `messaging` and `lymeVaccine`, with a floor at `LYME.humanTransmissionFloor = 0.20`. Audit that the floor is the only thing keeping a stacked deployment from delivering unrealistic combined reductions, and confirm 0.65 (35% pop kill) is the right Nadelman-discounted figure.
6. **reservoirVaccine symmetric block.** Touches both `mouseAcquisitionMul` and `mouseInfectivityMul` with the same 0.76. Confirm the cited sources (Tsao 2004, Richer 2014) measured NIP reduction (which is a *product* of both arms) — applying 0.76 to *each* arm risks compounding to ~0.58 net rather than the cited 0.76. Likely real bug.
7. **fungalBiocontrol × habitatMgmt interaction.** Code comment claims this is intentional. Confirm the multiplicative stacking direction makes sense (fungus weakens when habitat is degraded — yes, that's what the comment says, and `habMul` downstream multiplies tick survival, so the combined effect should be re-derived in the report).

## Method

1. Read `interventions.ts` and `params.ts` for any constants used in cost interpretation (HECTARES_PER_CELL, humansPerCell, DEER.K).
2. For each intervention: fetch the cited paper / extension bulletin where possible (WebFetch) to pin cost and effect figures.
3. Where citations are missing for cost: search for extension-service or industry quotes (NJ Tick Project budgets, CT DEEP, USDA APHIS rates, vendor MSRPs).
4. Produce a single comparison table + one-paragraph note per intervention. Highlight the deerCull and reservoirVaccine items as the most likely real defects.

## Verification

This is a report, not a code change — verification = sanity-check the per-hectare math and re-read each linked source. No tests to run.
