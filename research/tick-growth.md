# *Ixodes scapularis* Population Growth — Research Notes for Sim Calibration

Compiled to inform the tick demographic engine in `game/src/sim/engine.ts` (stage transitions in `stepCell`) and the constants in `game/src/sim/params.ts` (`TICK`, `INIT`). The sim should: (a) start at empirical endemic equilibrium, (b) drift only modestly under no-intervention years, and (c) be capable of producing literature-documented "explosions" when the right driver is dialed in.

This document is mainly biology + math. A short calibration-targets table at the end maps findings back onto current `params.ts` constants. Companion document: [deer.md](deer.md) for deer-side dispersal.

## 1. Life cycle and the equilibrium baseline

*Ixodes scapularis* in the eastern US runs a **2-year (often 3-year) life cycle**: eggs laid by an engorged female in spring hatch into **larvae** by mid-summer; survivors molt to **nymphs** the following spring/summer; nymphs molt to **adults** in fall and quest through winter; adults blood-feed (almost exclusively on white-tailed deer) and oviposit the next spring. Each stage takes one blood meal; questing seasons are sharply phenologically separated (larvae mid-summer, nymphs late spring/early summer, adults autumn + early spring).

- Life cycle overview and seasonal phenology: [Wisconsin Ticks — *I. scapularis* life cycle](https://wisconsin-ticks.russell.wisc.edu/ixodes-scapularis-life-cycle/); [CDC Tick Surveillance — *I. scapularis*](https://www.cdc.gov/ticks/surveillance/tickSurveillance.html).
- Female fecundity is high (~1,500–3,000 viable eggs per engorged adult), but cumulative survival from egg → reproducing adult is on the order of 10⁻⁴, so equilibrium is set by the multiplicative product of stage survivals, not by fecundity alone.
- Equilibrium "endemic" densities of host-seeking nymphs in the Northeast: drag sampling at a high-density Vermont site averaged **~0.08 nymphs/m² (8 per 100 m²) May–July**; national surveillance reports county means up to **488 nymphs / 1,000 m²** in the highest endemic clusters in the Northeast and Upper Midwest. ([Diuk-Wasser et al. 2006, J. Med. Entomol.](https://pubmed.ncbi.nlm.nih.gov/16619595/); [CDC national tick surveillance, Eisen et al. 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11288111/))
- Why an endemic equilibrium exists: density-independent stage mortality is *very* high (egg→larva survival ≈ 0.05–0.10; larva→nymph ≈ 0.05–0.10; nymph→adult ≈ 0.05–0.10; adult overwinter ≈ 0.30–0.50), and host-saturation terms additionally cap the per-tick blood-meal success at high tick densities. The product λ ≈ eggsPerAdult · ∏ stage survivals · host-saturation terms hovers near 1 when host densities are at carrying capacity.

**Sim implication:** `INIT.L=400, N=200, A=60` per hectare and current `TICK` survivals should produce λ ≈ 1 in `advanceYear` with no deployments. The closed-form check in §2 lets us verify this on paper before running. Equilibrium nymph density of 200/ha = 2/100 m² — within the low end of the cited endemic range; this seems intentionally conservative.

## 2. Discrete stage-structured population model

The natural mathematical object for an annual-step tick sim is a **Lefkovitch matrix** (a Leslie matrix variant for stage-classified populations). For stages **L (larvae), N (nymphs), A (adults)**, with eggs collapsed into the L→N inflow term:

```
| L_{t+1} |   |   0              0         f · sE · μ_D | | L_t |
| N_{t+1} | = | sL · μ_M         0         0            | | N_t |
| A_{t+1} |   |   0          sN · μ_NH    sA            | | A_t |
```

Where `f = eggsPerAdult`, `sE, sL, sN, sA` are stage survivals (egg→larva, larva→nymph, nymph→adult, adult overwinter), and `μ_D, μ_M, μ_NH` are host-saturation factors:

- `μ_D = D³ / (k_D³ + D³)` (Hill-3 in deer; reflects threshold collapse near ~0.05 deer/ha — see §4.2).
- `μ_M = M / (k_M + M)` (Beverton-Holt mouse term).
- `μ_NH = 0.5 μ_M + 0.5 μ_D` (mixed for nymph→adult, since nymphs take blood meals on both small mammals and deer).

The population grows when the dominant eigenvalue **λ > 1** and decays when **λ < 1**. For a three-stage matrix of this form, λ satisfies the characteristic polynomial:

```
λ³ − sA · λ² − f · sE · sL · sN · μ_D · μ_M · μ_NH = 0
```

A useful per-generation summary is the **net reproductive rate** `R₀,tick` — expected adult offspring per adult:

```
R₀,tick = f · sE · sL · sN · μ_D · μ_M · μ_NH / (1 − sA)
```

At the sim's current `TICK` constants and host equilibria (`M ≈ 25/ha`, `D ≈ 5/ha`, so `μ_M ≈ 0.76, μ_D ≈ 0.74, μ_NH ≈ 0.75`):

```
R₀,tick ≈ 2000 · 0.05 · 0.10 · 0.08 · 0.74 · 0.76 · 0.75 / (1 − 0.40)
       ≈ 2000 · 4.0e-4 · 0.42 / 0.60
       ≈ 0.56
```

That implies the *current* engine sits slightly **below** replacement under endemic host densities — consistent with the conservative survival values the comments in `params.ts` flag. Either survivals or `eggsPerAdult` should drift up by ~40–50% to hit clean R₀ ≈ 1; or the host-saturation half-constants (`kMouseHalf=8`, `kDeerHalf=3.5`) can be lowered modestly so μ terms ride closer to 0.9 at equilibrium.

- Stage-structured demographic theory: [Caswell, *Matrix Population Models*, 2nd ed., 2001 — overview, JSTOR review](https://www.jstor.org/stable/2680444); [Crouse, Crowder, Caswell 1987, Ecology — canonical Lefkovitch application](https://www.jstor.org/stable/1939225).
- Tick R₀ via next-generation matrices (the more rigorous treatment, especially when multiple host classes feed multiple tick stages): [Hartemink, Randolph, Davis, Heesterbeek 2008, *Am. Nat.*](https://www.journals.uchicago.edu/doi/10.1086/587530); [Davis & Bent 2011, *Parasitology*](https://www.cambridge.org/core/journals/parasitology/article/investigating-the-persistence-of-tickborne-pathogens-via-the-r0-model/ECC185B409532DBA4948A25143BC830E); [Foley & Piovia-Scott 2014, sensitivity of R₀ for *I. scapularis*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3913058/).

**Sim implication:** the discrete model above *is* the engine's model, written out in matrix form. The current parameter set gives R₀ slightly < 1. Either (i) bump survivals 30–50% (the literature ranges allow this), (ii) lower `kMouseHalf`/`kDeerHalf`, or (iii) accept that the sim equilibrium decays slowly toward extinction without spatial reseeding — which may actually be the intent if `applyDispersal` and the rut pulse import enough adults to compensate.

## 3. Continuous-time ODE models

A more biologically detailed lineage of tick models uses **temperature- and humidity-driven ODEs** with daily time steps. These don't replace the discrete matrix model above — they parameterize its survival terms from weather.

### 3.1 Mount & Hair / LYMESIM family

The foundational simulation framework is **LYMESIM** (Mount, Haile, Daniels 1997), which couples stage-structured tick demography with deterministic ODEs for host populations and *B. burgdorferi* transmission. Each tick stage has temperature-dependent development rates, humidity-driven off-host mortality, and host-finding rates that scale with host density. LYMESIM 2.0 (Gaff et al. 2020) modernized the parameterization with a cleaner separation between host community and tick demography.

- Mount, Haile, Daniels 1997 — original LYMESIM: [J. Med. Entomol.](https://pubmed.ncbi.nlm.nih.gov/9220682/); management-strategy companion paper [same volume](https://pubmed.ncbi.nlm.nih.gov/9439122/).
- LYMESIM 2.0: [Gaff et al. 2020, J. Med. Entomol.](https://academic.oup.com/jme/article/57/3/715/5718235).
- Modern lightweight reimplementation in R: [IxPopDyMod, Sambado et al. 2024](https://www.researchgate.net/publication/378494006_IxPopDyMod_an_R_package_to_write_run_and_analyze_tick_population_and_infection_dynamics_models).

### 3.2 Ogden / temperature degree-day models

Ogden et al. modeled tick development as **temperature-dependent time delays**: each immature stage requires accumulating a minimum number of degree-days above 0 °C before it can develop. The Canadian range-expansion work derives an empirical threshold (~2,800–3,100 annual DD₀) below which *I. scapularis* cannot establish.

- Lab-derived temperature × development relationships: [Ogden et al. 2004, J. Med. Entomol.](https://academic.oup.com/jme/article/41/4/622/883565).
- Dynamic population model coupling weather to tick range and seasonality: [Ogden et al. 2005, *Int. J. Parasitol.*](https://pubmed.ncbi.nlm.nih.gov/15777914/).
- Range expansion forecasts under climate change: [Ogden et al. 2017, *Environ. Health Perspect.*](https://ehp.niehs.nih.gov/doi/10.1289/EHP57); cautionary commentary on degree-day model uncertainty: [Molnár et al. 2013, PMC3816756](https://pmc.ncbi.nlm.nih.gov/articles/PMC3816756/).

A representative ODE form (Ogden-style) for a single immature stage `X` with development time τ(T) and per-day mortality μ(T, RH):

```
dX/dt = (input from prior stage with delay τ_prev) − X / τ(T) − μ(T, RH) · X
```

### 3.3 Saturation-deficit / desiccation

Off-host larvae and nymphs spend >95% of their lives in leaf litter, where humidity is near saturation. Survival drops sharply with **saturation deficit** (a temperature-and-RH-derived measure of how thirsty the air is). Bertrand & Wilson 1996 showed substantially higher mortality in open fields than in edge/forested habitats; subsequent work used vapor-pressure deficit as the explanatory variable.

- Bertrand & Wilson 1996 — habitat-stratified mortality in *I. scapularis*: cited in [Burtis et al. 2019, *Parasit. Vectors* PMC6339851](https://ncbi.nlm.nih.gov/pmc/articles/PMC6339851/).
- Relative humidity and activity patterns: [Vail & Smith 2002 / 2014 update, J. Med. Entomol.](https://academic.oup.com/jme/article/51/4/769/894817).
- Climatic stress and desiccation trade-off with host-seeking: [Nielebeck et al. 2023, *Ecosphere*](https://esajournals.onlinelibrary.wiley.com/doi/10.1002/ecs2.4369).

**Sim implication:** the engine is annual-step and aggregates all weather effects into the constant survival fractions. None of the ODE machinery needs to be ported in — but the existence of `habMul` (the per-cell habitat multiplier) is the right hook for it. A future climate-driven scenario could simply modulate `habMul` (or `sAdultOverwinter` directly) for a year or two to model a warm winter or a drought.

## 4. Drivers of population explosion

A "no-intervention, equilibrium" run is the null. The cases where I. scapularis density jumps multiple-fold in 1–3 years are well documented in the literature; we list each with mechanism, magnitude, and time lag.

### 4.1 Acorn-mast → mouse-irruption → tick-boom (2-year lag)

The cleanest experimentally documented driver in the eastern US. Heavy oak masting (autumn N) elevates white-footed mouse density the following summer (N+1, ~5–10× over background), which then carries a massive larval cohort to molt as infected nymphs in N+2.

- Jones, Ostfeld, Richard, Schauber, Wolff 1998, *Science* — experimental acorn addition produced an **8-fold rise in larval ticks** the following summer in acorn-rich plots: [Science abstract](https://www.science.org/doi/abs/10.1126/science.279.5353.1023); [PubMed](https://pubmed.ncbi.nlm.nih.gov/9461433/).
- Ostfeld, Canham, Oggenfuss, Winchcombe, Keesing 2006 — acorn production drives mouse population, which drives nymph-infection prevalence 2 years later: [*PLoS Biol.* 4(6):e145](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0040145).
- Strong cross-correlation between mouse abundance and following-year infected-nymph density: [Ostfeld 2011, *Lyme Disease* (book)](https://www.caryinstitute.org/news-insights/feature/dr-richard-ostfelds-book-lyme-disease).

**Sim implication:** the engine's mouse logistic (`MOUSE.r=1.2, K=50`) caps mouse density at 50/ha; current `INIT.M ≈ 25`. To replay a mast year, transiently raise `K` (or simply set `M = 50` at the start of a year). The 2-year lag emerges automatically from the L→N→A pipeline. This is a great candidate for a "mast year event card" in the game.

### 4.2 Deer-density threshold crossing (Monhegan effect)

Adult ticks reproduce almost exclusively on deer; below a deer density of roughly **3–8 deer/km² (0.03–0.08/ha)**, the adult cohort cannot find enough blood meals to maintain population. Crossing this threshold *upward* (deer recolonization) flips a cell from tick-free to fully endemic over ~3–5 years.

- Monhegan Island — complete deer removal eliminated I. scapularis nymphal infestation on rodents in 3–4 years: [Rand et al. 2004, J. Med. Entomol.](https://pubmed.ncbi.nlm.nih.gov/15311475/); follow-up on residual avian importation: [Smith et al. 2011, *Vector-Borne Zoonotic Dis.*](https://www.researchgate.net/publication/51186095_Density_of_Ixodes_scapularis_Ticks_on_Monhegan_Island_after_Complete_Deer_Removal_A_Question_of_Avian_Importation).
- Recommended deer-density ceilings for sustained tick/Lyme reduction: **5–8 deer/km² with empirical threshold of 3–5 deer/km² to start seeing risk reduction**: [Stafford & Williams 2017, *J. Integrated Pest Mgmt.*](https://academic.oup.com/jipm/article/8/1/25/4210016).
- Connecticut culls (Bridgeport, Bluff Point): reductions from >90/km² to 17–39/km² produced 50–90% nymph reductions at most sites; Bernards Township halving from 45 → 24/km² had little tick effect because endpoint deer density was still an order of magnitude above threshold: [Telford 2017, *PNAS* commentary](https://pmc.ncbi.nlm.nih.gov/articles/PMC4912954/).

**Sim implication:** `engine.adultFeedSaturation` already implements a Hill-3 with hard floor at `D < 0.05/ha`. The Monhegan dynamic *upward* — recolonization causing a population explosion — is reproduced by raising `D` past the kink. To simulate a deer surge (e.g., suburban deer overpopulation), let `DEER.K` jump from 8 → 20/ha in a scenario; the Hill-3 saturates fast above k_D = 3.5, so the explosion is in larval cohort, not adult feeding success.

### 4.3 Mild winters / climate warming

Two independent mechanisms: (i) higher `sAdultOverwinter` in mild winters (less below-snow desiccation, less freeze-kill), and (ii) longer questing/development season effectively raises `sLarvaToNymph` and `sNymphToAdult` because cohorts complete their molt instead of dying mid-stage.

- Ogden range-expansion forecast: north-of-current establishment line moves substantially poleward under CMIP5 mid-century projections: [Ogden et al. 2017, *EHP*](https://ehp.niehs.nih.gov/doi/10.1289/EHP57).
- Sensitivity of *I. scapularis* dynamics to mean annual temperature: [Wu et al. 2013, *PLoS ONE* PMC3973433](https://pmc.ncbi.nlm.nih.gov/articles/PMC3973433/); [Hindawi 2019, temperature-driven seasonal model](https://www.hindawi.com/journals/cjidmm/2019/9817930/).
- Field-documented winter mortality differential: [Brunner et al. 2012, *J. Med. Entomol.* — overwinter survival drops sharply in colder microhabitats](https://academic.oup.com/jme/article/49/5/981/892099).

**Sim implication:** model a "mild winter" year by setting `sAdultOverwinter = 0.55–0.65` (vs. baseline 0.40) for one or two years. Range-expansion physics (a new northern cell switching from non-establishment to establishment) needs a habitat-multiplier ramp, not a one-shot bump.

### 4.4 Habitat shift and forest fragmentation

Edge habitat (forest/lawn ecotones, especially with shrub understory and leaf litter) concentrates both small-mammal reservoirs and tick survival. Fragmentation increases edge-to-interior ratio.

- Allan, Keesing, Ostfeld 2003 — small forest fragments (<2 ha) had **~3× higher infected-nymph density** than large fragments: [*Conserv. Biol.*](https://pubmed.ncbi.nlm.nih.gov/12525705/).
- Forest patch effects on infection prevalence: [Levi et al. 2016, *Ecol. Appl.*](https://esajournals.onlinelibrary.wiley.com/doi/full/10.1890/15-0122).

**Sim implication:** the per-cell `hab` multiplier already exists as the lever. A "suburban edge" scenario would raise `hab` in cells adjacent to deer-dispersal corridors.

### 4.5 Loss of biodiversity (dilution effect reversal)

Most tested as an *infection prevalence* driver rather than a raw-density driver. When the small-mammal community is depauperate, a higher fraction of nymphs feed on the most-competent reservoir (white-footed mouse) and infection prevalence climbs, even if total nymph density is unchanged. Some compositions also shift larval blood-meal allocation enough to bump tick density.

- Quantitative framework: [Levi, Keesing, Oggenfuss, Ostfeld 2016, *Ecol. Appl.*](https://esajournals.onlinelibrary.wiley.com/doi/full/10.1890/15-0122) — dilution hosts (squirrels, opossums) absorb tick blood meals without amplifying infection.
- Original framing: [Ostfeld & Keesing 2000, *Conserv. Biol.* — dilution effect](https://conbio.onlinelibrary.wiley.com/doi/10.1046/j.1523-1739.2000.99014.x).
- Counter-arguments and scale-dependence: [Wood & Lafferty 2013, *Trends Ecol. Evol.*](https://www.sciencedirect.com/science/article/pii/S0169534712002303); [scale-dependent diversity effects, 2022](https://www.sciencedirect.com/science/article/pii/S1877959X22001753).

**Sim implication:** the engine already separates host density (`M`, `D`) from reservoir competence; the dilution effect operates on the *mouse infection* term in `infection.ts`. Out of scope for raw tick growth.

### 4.6 Microclimate amplifiers (humidity, leaf litter)

Mild, humid summers with dense leaf litter directly raise off-host survival. This appears mostly as elevated `sLarvaToNymph` and `sNymphToAdult` rather than as a fecundity bump.

- See §3.3 for citations. The cited Bertrand & Wilson finding of higher field mortality is the cleanest empirical anchor.

**Sim implication:** lumps into `hab` and into stage survivals. Already covered.

### 4.7 Host-community shifts (alternate larval hosts)

Larvae feed on a wide host range — mice, chipmunks, shrews, ground-foraging birds, raccoons, opossums. A community-wide surge in *any* abundant small mammal can amplify the larval-to-nymph transition independent of mouse density.

- Comprehensive blood-meal analysis from larval/nymphal *I. scapularis*: [Tsao, Schultz, et al. 2019, *Parasit. Vectors*](https://parasitesandvectors.biomedcentral.com/articles/10.1186/s13071-019-3717-z).
- Reservoir competence ranking among community: [LoGiudice, Ostfeld, Schmidt, Keesing 2003, *PNAS*](https://www.pnas.org/doi/10.1073/pnas.0233733100).

**Sim implication:** the current model lumps all small mammals into `M`. A first-pass approximation of this driver is just to widen `MOUSE.K` for the scenario.

## 5. R₀ and sensitivity — what to monitor

Across published sensitivity analyses of *I. scapularis* models, the highest-elasticity parameters (the ones a percentage shift in changes λ or R₀ the most) cluster as follows:

1. **Survival of fed larvae** (egg→larva and larva→nymph stages combined) — top sensitivity in Foley & Piovia-Scott 2014's global R₀ analysis. ([PMC3913058](https://pmc.ncbi.nlm.nih.gov/articles/PMC3913058/))
2. **Transmission efficiency from infected mouse to larva** — top driver of R₀ for the *pathogen*, even when tick demography is well below its own threshold.
3. **Nymphal host-finding success on competent hosts** — both demographic and epidemiological lever.
4. **Adult overwinter survival** — modest elasticity for λ, large effect on year-to-year fluctuation amplitude.
5. **Fecundity** — surprisingly *low* elasticity, because the multiplicative bottleneck is in stage survivals, not eggs laid. Doubling `eggsPerAdult` produces a much smaller λ change than doubling `sLarvaToNymph`.
6. **Female-infection overwinter advantage** — recent finding that *Borrelia*-infected females overwinter better than uninfected females; small but consistent. ([Herrmann & Gern bioRxiv 2022](https://www.biorxiv.org/content/10.1101/2022.12.07.519462.full.pdf))

Mapping these onto `params.ts`:

| Literature sensitivity rank | `params.ts` knob | Current value | Notes |
|----------|-----------------|---------------|-------|
| 1 | `sEggToLarva`, `sLarvaToNymph` | 0.05, 0.10 | both at low end of cited range; doubling either ≈ doubles R₀ |
| 2 | (in `LYME` block) `pMouseToLarva` | 0.65 | epidemiological lever |
| 3 | `kMouseHalf`, `kDeerHalf` | 8, 3.5 | sets saturation, indirect host-finding lever |
| 4 | `sAdultOverwinter` | 0.40 | governs year-to-year amplitude |
| 5 | `eggsPerAdult` | 2000 | low elasticity; the existing value is mid-range and unlikely to need tuning |

**Sim implication:** when tuning the sim to hit equilibrium, **adjust `sLarvaToNymph` first**, not `eggsPerAdult`. When tuning amplitude (fluctuation magnitude), adjust `sAdultOverwinter`.

## 6. Stochasticity and the "minor fluctuations" requirement

A purely deterministic compartmental engine at exact equilibrium produces a numerically flat trajectory. Real-world tick populations fluctuate ±20–50% year-to-year around the trend, driven by:

- **Environmental stochasticity**: weather, mast cycles, host community fluctuations. Annual coefficient of variation in nymph drag counts at long-term monitoring sites is typically 0.3–0.6. ([Diuk-Wasser et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16619595/); [Cary Institute long-term Ostfeld plots](https://www.caryinstitute.org/science/research-projects/tick-project))
- **Demographic stochasticity**: matters less at the per-hectare scale (large numbers) but visible at the cell-population scale when nymph counts drop below ~50.
- **Spatial coupling**: a "minor fluctuation" at the cell level is partly the residual after spatial averaging; without dispersal a deterministic cell trajectory does flatten out.

**Sim implication:** to get the requested "minor fluctuations under no intervention" feel without retuning toward instability, multiply each stage-transition output by a per-year, per-cell lognormal noise term with σ ≈ 0.2 — this matches the empirical CV and won't bias the long-run mean. Combined with the existing `applyDispersal` and rut pulse, this should produce visually plausible noisy-equilibrium trajectories. See [deer.md](deer.md) §6 for the spatial-coupling story.

## 7. Calibration targets

Target equilibrium values (for the no-intervention, endemic case) from the cited literature, per hectare:

| Quantity | Literature endemic range (NE/Upper Midwest) | Current `params.ts` | Source |
|----------|--------------------------------------------|---------------------|--------|
| Questing larvae | ~200–600 / ha | `INIT.L = 400` | [Diuk-Wasser 2006](https://pubmed.ncbi.nlm.nih.gov/16619595/), [CDC 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11288111/) |
| Questing nymphs | ~150–400 / ha (mid-endemic) | `INIT.N = 200` | same |
| Questing adults | ~30–100 / ha | `INIT.A = 60` | [Stafford & Williams 2017](https://academic.oup.com/jipm/article/8/1/25/4210016) |
| Infected-nymph fraction | 0.15–0.30 | `INIT.fracNymphInf = 0.20` | [Ostfeld 2006](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0040145) |
| White-footed mouse density | 10–50 / ha (peaks higher in mast yr+1) | `MOUSE.K = 50, init = 25` | [Jones et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9461433/) |
| Deer density (suburban-edge endemic) | 3–15 / km² *threshold*, 20–40 / km² typical = 0.2–0.4 / ha | `DEER.K = 8/ha` *(suspect — see note)* | [Stafford & Williams 2017](https://academic.oup.com/jipm/article/8/1/25/4210016) |
| Adult overwinter survival | 0.30–0.55 | `sAdultOverwinter = 0.40` | [Brunner et al. 2012](https://academic.oup.com/jme/article/49/5/981/892099) |
| Eggs per engorged female | 1,500–3,000 | `eggsPerAdult = 2000` | [Ostfeld 2011 book](https://www.caryinstitute.org/news-insights/feature/dr-richard-ostfelds-book-lyme-disease) |

**Note on `DEER.K = 8/ha`:** that's 800/km², which is biologically implausible (typical white-tailed deer carrying capacity in oak-hickory forest is 10–30/km² = 0.1–0.3/ha; even severely overpopulated suburban edge tops out around 60/km² = 0.6/ha). The Monhegan threshold and the entire `adultFeedSaturation` Hill-3 are calibrated in /ha units; with `K=8/ha` the deer term is always firmly saturated and the threshold dynamic never engages. This likely deserves a follow-up calibration — drop `DEER.K` to ~0.4–0.6/ha and re-check `kDeerHalf`. (Cross-reference [deer.md](deer.md) §6.)

Explosion magnitudes — what to expect when a driver fires:

| Scenario | Magnitude | Time lag |
|----------|-----------|----------|
| Mast year (acorn addition) | 8× larvae, 3–5× infected nymphs | 1–2 yr |
| Deer recolonization (cross threshold upward) | 10–100× over 3–5 yr | 3–5 yr |
| Mild-winter year | 1.3–1.7× adults next year, 1.2× nymph 2 yr later | 1–2 yr |
| Habitat fragmentation (small-fragment effect) | up to 3× infected-nymph density | persistent |

---

Cross-links: [deer.md](deer.md), [interventions.md](interventions.md).
