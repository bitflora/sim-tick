# White-Tailed Deer Movement — Research Notes for Sim Calibration

Compiled to refine the deer dispersal term in `game/src/sim/grid.ts` (`applyDispersal`) and the host saturation logic in `engine.ts`. *Ixodes scapularis* adults reproduce on deer, so deer movement sets the spatial smoothing of adult-tick supply across the grid.

## 1. Annual home range — the "baseline" scale

Most white-tailed deer are **non-migratory residents** with a stable annual home range. Size varies by sex, age, density, and habitat heterogeneity.

- **Does:** ~120–250 ha (≈300–600 acres) annual home range in typical eastern forest/edge habitat. ([Mossy Oak Gamekeeper](https://mossyoakgamekeeper.com/hunting/deer-hunting/white-tailed-deer-home-range/))
- **Bucks:** ~240–970 ha (≈600–2,400 acres), roughly 2–4× a doe's range. ([Mossy Oak Gamekeeper](https://mossyoakgamekeeper.com/hunting/deer-hunting/white-tailed-deer-home-range/))
- GPS-collar telemetry: **mean 95% home range ~9–10 km² (900–1,000 ha)** with winter 10.2 km², summer 9.2 km². ([Webb et al. 2010, Wiley](https://onlinelibrary.wiley.com/doi/10.1155/2010/459610))
- Bimodal male strategies in partial-migration populations: **sedentary bucks ≈361 ha**, **mobile bucks ≈6,530 ha**. ([Rutting and rambling, PMC10862164](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10862164/))
- Home range expands at **higher deer densities** and in **heterogeneous landscapes**. ([Heterogeneity of a landscape, PMC6168582](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6168582/))

**Sim implication:** if a grid cell is ~1 ha, a typical doe touches dozens of cells in a year and a buck touches hundreds. Current `applyDispersal` moves a fraction to 4-neighbors per step — undersells reality for deer. Either (a) raise the deer mixing fraction substantially relative to ticks/mice, or (b) apply a wider neighborhood blur for `D`.

## 2. Seasonal migration

Most populations are **partial migrants**: a subset shifts between summer and winter ranges; the rest stay put.

- **Migration distance, north-central South Dakota:** mean **19.4 km** between summer and winter ranges. ([Kjellander/Grovenburg et al., Can. J. Zool.](https://cdnsciencepub.com/doi/abs/10.1139/Z09-076))
- Northern populations: summer/winter cores often **5–20 miles (8–32 km) apart**. ([Mossy Oak — Seasonal Deer Movement](https://www.mossyoak.com/our-obsession/blogs/deer/home-range-movements-understanding-seasonal-deer-movement))
- **Fraction migrating:** 10% to >60% of does, higher where winter forage/cover is poor. ([Grovenburg et al. summary](https://cdnsciencepub.com/doi/abs/10.1139/Z09-076))
- **Yarding:** in deep-snow northern latitudes, deer congregate in conifer-dominated **deer wintering areas** for thermal cover and shared trail networks. ([North Dakota Game & Fish](https://gf.nd.gov/wildlife-notes/white-tailed-deer-movements))
- In mild-winter latitudes (e.g. southern US), seasonal migration is rare; "partial migration" still appears tied to rut, not weather. ([Rutting and rambling, PMC10862164](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10862164/))

**Sim implication:** annual-step simulation can ignore intra-year yarding but should consider letting a fraction of `D` aggregate into preferred (high-habitat) cells over winter, which would concentrate adult-tick blood-meal opportunities. Currently `applyDispersal` pulls deer toward the **neighbor mean** (anti-concentration). That is wrong for winter behavior — deer pile up in yards, not smooth out.

## 3. Daily and seasonal movement intensity

- Crepuscular activity (dawn/dusk peaks); summer is the low point, daily movement **rises steadily into the rut**. ([Boone & Crockett](https://www.boone-crockett.org/white-tailed-deer-buck-movements-during-rut))
- Rut **excursions:** most bucks take ~1.5-mile (2.4 km) trips outside their home range; documented outliers up to **18-mile (29 km) round trips**. ([Boone & Crockett](https://www.boone-crockett.org/white-tailed-deer-buck-movements-during-rut))
- A tracked mature buck covered **~200 miles in the rut, averaging 8.5 mi/day**. ([Georgia Outdoor News](https://gon.com/news/mature-buck-travels-200-miles-8-1-2-miles-per-day-during-rut))
- Doe excursions: brief (~24 h), **0.57–4.78 km**. ([What Deer Research Really Says About the Rut](https://deerassociation.com/what-deer-research-really-says-about-the-rut/))

**Sim implication:** the rut occurs in autumn — exactly when adult *I. scapularis* are questing. Rut movement is the dominant mechanism spreading **adult-tick infestation** across cells. Worth modeling as a fall-season pulse of extra deer mixing, even in an annual-step engine.

## 4. Natal dispersal (one-time long-distance moves)

Distinct from migration: ~50–80% of **yearling bucks** permanently leave their birth range at ~1.5 years old.

- Median dispersal **5.77 km**, range **1.3–68.3 km**. ([Long et al., Agricultural land use, PMC9608933](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9608933/))
- In 50–70% forested landscapes: mean **~6.8 km (4.2 mi)**, max recorded **56 km (34.8 mi)** for a Maryland buck. ([Deer & Deer Hunting — Buck Dispersal](https://www.deeranddeerhunting.com/content/articles/buck-dispersal-when-why-and-how-far))
- Exceptional: documented **300 km adult-male dispersal in ~3 weeks** (New Hampshire). ([UNH / Mammalia, PMC8093661](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8093661/))
- Dispersal distance **increases with agricultural cover**, decreases with local deer density; juveniles avoid cropland but follow **riparian corridors**. ([PMC9608933](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9608933/))

**Sim implication:** rare long-jumps matter for **disease spread** — they reseed adult ticks (and infection) into cells the local-mixing kernel never reaches. A low-probability long-range jump term in `applyDispersal` would capture this realistically. Relevant Lyme literature explicitly links deer connectivity to pathogen distribution. ([Functional connectivity for WTD drives tick-borne pathogen distribution, Landscape Ecology 2025](https://link.springer.com/article/10.1007/s10980-025-02101-4); [Dispersal dynamics in human-altered landscapes, PMC12151444](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12151444/))

## 5. Habitat, fragmentation, and Lyme relevance

- Deer thrive in **edge habitat** between forest and open vegetation — the exact landscape that maximizes *I. scapularis* contact with humans. ([VDCI](https://www.vdci.net/blog/lyme-disease-3-reasons-it-is-on-the-rise-in-the-northeast/))
- Forest **fragmentation** raises Lyme risk through host community shifts (more white-footed mice, more deer) and edge expansion. ([Climate change & fragmentation, PMC4227856](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4227856/); [W&M News](https://www.wm.edu/news/stories/2019/deer,-fragmented-forests,-ticks,-a-lyme-like-disease-and-a-little-praise-for-possums.php))
- **Functional connectivity** for deer in urban/suburban greenspaces predicts tick density and *B. burgdorferi* prevalence within those patches. ([Springer Landscape Ecology 2025](https://link.springer.com/article/10.1007/s10980-025-02101-4); [CDC EID 2019](https://wwwnc.cdc.gov/eid/article/25/6/18-1741_article))

**Sim implication:** the existing `habitat` multiplier already biases ticks/mice toward favorable cells. A natural extension: let deer **prefer high-habitat neighbors** during the dispersal step (drift toward higher `habitat`, not just toward neighbor mean), which would mechanistically link fragmentation to localized Lyme hotspots in the model.

## 6. Concrete suggestions for the sim

Ordered by impact:

1. **Replace the deer-toward-neighbor-mean rule with a habitat-weighted drift.** Matches yarding + edge selection. `grid.ts:applyDispersal`.
2. **Add a small long-range jump probability for deer** (rare, ~uniform over the grid or biased to corridors). Captures yearling dispersal and the connectivity → pathogen-spread literature.
3. **Tune deer mixing fraction higher than tick/mouse fractions** — annual home ranges (~10 km²) are an order of magnitude larger than a single cell at any plausible grid resolution.
4. **Optional fall pulse** representing the rut: a one-shot extra mixing step inside `advanceYear` between host adjustments and tick reproduction. Aligns spatial mixing with the adult-tick questing season.
5. **Density-dependent home range** is documented but probably second-order for this game; skip unless calibrating against a specific empirical population.

## Sources (all)

- [Mossy Oak Gamekeeper — Home Range Essentials](https://mossyoakgamekeeper.com/hunting/deer-hunting/white-tailed-deer-home-range/)
- [Mossy Oak — Seasonal Deer Movement](https://www.mossyoak.com/our-obsession/blogs/deer/home-range-movements-understanding-seasonal-deer-movement)
- [Webb et al. 2010, "Measuring Fine-Scale WTD Movements" — Int. J. Ecology](https://onlinelibrary.wiley.com/doi/10.1155/2010/459610)
- ["Rutting and rambling" — partial migration in adult males, PMC10862164](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10862164/)
- [Heterogeneity of a landscape influences home range, PMC6168582](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6168582/)
- [Grovenburg et al., Seasonal movements in South Dakota — Can. J. Zool.](https://cdnsciencepub.com/doi/abs/10.1139/Z09-076)
- [North Dakota Game & Fish — WTD Movements](https://gf.nd.gov/wildlife-notes/white-tailed-deer-movements)
- [Boone & Crockett — Buck Movements During the Rut](https://www.boone-crockett.org/white-tailed-deer-buck-movements-during-rut)
- [Georgia Outdoor News — 200-mile rut buck](https://gon.com/news/mature-buck-travels-200-miles-8-1-2-miles-per-day-during-rut)
- [Deer Association — What Deer Research Really Says About the Rut](https://deerassociation.com/what-deer-research-really-says-about-the-rut/)
- [Deer & Deer Hunting — Buck Dispersal: When, Why, How Far](https://www.deeranddeerhunting.com/content/articles/buck-dispersal-when-why-and-how-far)
- [Long et al. — Agricultural land use shapes dispersal, PMC9608933](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9608933/)
- [300 km adult-male dispersal record, PMC8093661](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8093661/)
- [Functional connectivity for WTD drives tick-borne pathogens — Landscape Ecology 2025](https://link.springer.com/article/10.1007/s10980-025-02101-4)
- [Dispersal dynamics in human-altered landscapes, PMC12151444](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12151444/)
- [Climate change & habitat fragmentation drive B. burgdorferi, PMC4227856](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4227856/)
- [VDCI — Lyme spread in the Northeast](https://www.vdci.net/blog/lyme-disease-3-reasons-it-is-on-the-rise-in-the-northeast/)
- [CDC EID 2019 — Landscape connectivity & Lyme risk, NYC](https://wwwnc.cdc.gov/eid/article/25/6/18-1741_article)
- [W&M — Deer, fragmented forests, ticks](https://www.wm.edu/news/stories/2019/deer,-fragmented-forests,-ticks,-a-lyme-like-disease-and-a-little-praise-for-possums.php)
