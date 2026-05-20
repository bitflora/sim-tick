# Tick & Lyme Mitigation Reference

Reference document for recalibrating a compartmental sim of *Ixodes scapularis* +
*Borrelia burgdorferi* s.s. in the Northeastern / upper-midwest US, residential
and suburban-edge scale. Compiled from peer-reviewed literature, the keystone
Eisen & Dolan (2016) ITM review, CDC/state extension docs, and the Cary
Institute's Tick Project.

---

## 1. Scope & method

**System.** Adult / nymph / larva *I. scapularis* with reservoir hosts
*Peromyscus leucopus* (white-footed mouse) and *Odocoileus virginianus*
(white-tailed deer). Pathogen: *B. burgdorferi* s.s. Geography: NE US +
upper-midwest (CT, NY, NJ, MA, PA, MN, WI), suburban-edge scale (lots /
neighborhoods of ~0.1–10 ha). Excludes *I. pacificus*, *B. mayonii*,
*B. miyamotoi*, *A. phagocytophilum* unless cross-cited.

**Effectiveness metric.** Studies report different endpoints — and the choice
matters because the Tick Project (Keesing & Ostfeld 2022) showed reductions in
**questing nymphs** do not always translate into reductions in **human cases**.
Where possible we label each row with what it measures:

- `QN` = questing-nymph density (drag-cloth counts, ticks/100 m²) — most common
- `IN` = density of infected questing nymphs (DIN / DON)
- `NIP` = nymphal infection prevalence (% of nymphs carrying *B. burgdorferi*)
- `TBM` = tick burden on mice (ticks/mouse on trapping)
- `HE` = human–tick encounters (self-report)
- `HC` = human Lyme cases (medical-record validated)

**Variance.** SDs are rarely reported cleanly across heterogeneous trials, so
we give the **range across replicates / sites / years** and label it
`range, not SD` unless a true SD was published. Single-trial figures are
flagged `(single trial)`.

**Costs.** USD; year noted; rough-normalized to 2024 USD using ~25%
cumulative inflation from 2015 (CPI). Per-property numbers assume the
canonical ~0.2–0.5 ha residential lot; per-hectare numbers are extension /
commercial quotes. Treat as order-of-magnitude.

**Cross-checking.** Median efficacy reported when ≥2 sources concur (or
range of medians). Single-source numbers flagged.

---

## 2. Summary table

| Category | Intervention | Target stage / host | Median effect (metric) | Range or SD (labeled) | Cost (USD, unit, year) | Durability | Key citation |
|---|---|---|---|---|---|---|---|
| Acaricide | Bifenthrin broadcast (single spring) | All questing stages | 63% reduction QN (residential RCT); 0% reduction HC | 50–100% QN (range, not SD); HC null | $200–500 / property / treatment (2024) | 8–12 wk single app; multiple per season for full | Hinckley 2016 JID |
| Acaricide | Late-fall synthetic acaricide app | Adults + next-yr nymphs | 71–95% QN spring after fall app | range, not SD (single trial) | ~$400 / property (2024) | One season carry-over | Williams & Stafford 2024 JME |
| Acaricide | *Metarhizium brunneum* F52 / Met52 spray | Questing nymphs | 53–96% QN at 3–5 wk; **0% QN in Tick Project neighborhood RCT** | range, not SD; Tick Project null | $300–500 / property (2024) | ~6 wk; needs ≥2 apps | Bharadwaj 2010 JME; Keesing 2022 EID |
| Acaricide | Nootkatone spray | Questing nymphs | >80% QN sustained 6 wk after 2 apps | single trial | Not commercial; experimental | ~6 wk | Jordan & Schulze 2011 JME |
| Acaricide | Cedarwood / essential-oil sprays (EcoTrol etc.) | Questing nymphs | 0–24% knockdown; 0–15% residual; lab: 80–94% repellency at 30 min | range, not SD | $30–80 / property DIY | ≤1–3 wk | Eisen 2024 EID; USDA-ARS 2022 |
| Acaricide | Permethrin broadcast | All questing stages | Similar to bifenthrin (~70–90% QN, single app) | range, not SD | $200–400 / property | 4–8 wk | Eisen & Dolan 2016 JME |
| Host-rodent | Damminix tick tubes (permethrin cotton) | Larvae & nymphs feeding on mice | Original MA: 89% QN. Replicates: 20–28% QN (NJ); 50% TBM. **Often fails in suburban replications.** | range, not SD | $80–250 / property / yr (24 tubes) | 1 season | Mather 1987; Jordan & Schulze 2019 |
| Host-rodent | SELECT TCS bait box (fipronil) | Larvae & nymphs on small mammals | 79–84% QN at 1–2 yr (NJ); ~50% QN (Tick Project). **0% reduction HC.** | range, not SD | $300–400 / property / yr (~12 boxes × $25) | 1 season; reload | Schulze 2017 JME; Keesing 2022 EID |
| Host-rodent | Oral doxycycline rodent bait | NIP, nymph infection | 89–100% clearance in fed nymphs (lab); ~24% NIP reduction (field) | range, not SD; single field trial | insufficient data — not commercial | 1 season | Dolan 2008 AJTMH; Dolan 2017 JME |
| Host-rodent | Reservoir-targeted OspA oral bait | NIP | ~24% NIP reduction yr 1; lab: 41→0% NIP | range, not SD; single 5-yr field | insufficient data — not commercial | Multi-yr | Tsao 2004 PNAS; Richer 2014 J Infect Dis |
| Host-deer | 4-Poster permethrin stations | Adults; cascades to nymphs/larvae | 60–91% QN by yr 4–6 area-wide; 8% (recent suburban RCT) | range, not SD | $1000–1500 / station / yr (one per ~20–50 acres); reg-restricted | Multi-yr; needs ≥3 seasons | Pound 2009; Schulze 2009; Stafford 2017 |
| Host-deer | Deer culling (to ~5 deer/km²) | Adult tick reproduction | 74–100% QN/QA at multi-year horizons; Monhegan: 100% local extirpation | range, not SD; islands ≠ mainland | $200–800 / deer (mgmt cost); social cost large | Multi-yr; bird re-introduction risk | Stafford 2003; Rand 2004; Kilpatrick 2014 |
| Host-deer | Deer exclusion fencing (8 ft) | Adult tick reproduction | 83–97% larvae; ~74% nymphs (≥15-acre exclosure) | range, not SD | $8–20 / linear ft install (2024) | 10–20 yr | Daniels 1993 JME; Williams 2025 JME |
| Host-deer | Deer sterilization (Hastings-on-Hudson, Fairfax Cty) | Adult tick reproduction | insufficient data on tick endpoint; 20–60% multi-yr deer reduction | range, not SD | $1000–2000 / doe | Slow demographic | Naugle 2002 reports |
| Habitat | Leaf-litter removal (spring + early summer) | Larvae / nymphs in litter | 72.7–100% QN reduction | range, not SD | $50–200 / property (DIY); $200–500 service | 1 season | Schulze 1995; Schulze & Jordan 2020 |
| Habitat | Wood-chip / 3-ft mulch barrier lawn-woods | Spillover of QN onto lawn | ~50–80% reduction in lawn-edge tick density | range, not SD | $100–300 / property | Multi-yr (refresh chips) | CDC; Stafford 2007 CAES |
| Habitat | Mowing / vegetation reduction | All questing stages on cut areas | Modest, ~30–50% QN in mown vs. unmown adjacent | range, not SD | $0–100 / property (baseline mowing) | Continuous | Stafford 2007 CAES handbook |
| Habitat | Prescribed burns (long-term, annual–biennial) | Larvae / nymphs in litter; reservoirs | 70–100% reduction QN with sustained fire regime (SE longleaf); lower NIP | range, not SD; mostly SE data | $20–100 / acre operational | Cumulative over years | Gleim 2014 PLOS ONE; Gleim 2019 Sci Rep |
| Habitat | Deer-resistant / xeric landscaping | Indirect (deer use, mouse habitat) | insufficient data — no controlled trials | n/a | Variable | Multi-yr | CDC guidance only |
| Biocontrol | Guinea fowl | Adult ticks on lawn | Suggestive ~75% reduction on lawns adjacent to dense cover (Duffy 1992); other trials null | range, not SD | $20–50 / bird + housing | Continuous; predation losses | Duffy 1992 JME; Akoachere 2024 JME |
| Biocontrol | Virginia opossum tick grooming | Larvae attached to opossum | **Disputed.** Keesing 2009 lab: ~5500 larvae/wk killed. Hennessy & Hild 2021: 0 ticks in 32 gut analyses. | n/a — disputed | insufficient data — not deployable | n/a | Keesing 2009 Proc R Soc B; Hennessy 2021 TTBD |
| Biocontrol | Entomopathogenic nematodes (*Steinernema*) | Engorged females in soil | 50–95% engorged-female mortality (lab); field data thin | range, not SD | insufficient data | Single season | Hornbostel 2005 J Vect Ecol |
| Personal | Permethrin-treated clothing (factory-impregnated) | Tick bites on humans | 65% fewer *I. scapularis* bites in field-worker RCT | single trial | $20–80 / garment, 70+ washes | ~1 yr / 70 washes | Vaughn 2014 JOEM; Vaughn 2011 |
| Personal | DEET skin repellent (20–30%) | Tick bites | Mean protection time 3.5 h (deer ticks) | range, not SD | $5–10 / bottle | Hours | Lupi 2013; CDC |
| Personal | Picaridin (20%) | Tick bites | Mean protection time ~2.5 h (deer ticks) | range, not SD | $7–12 / bottle | Hours | Lupi 2013 |
| Personal | IR3535 (20%) | Tick bites | Mean protection time 7.2 h (deer ticks) | single review | $7–15 / bottle | Hours | Cilek 2008 JME |
| Personal | Daily tick checks + prompt removal | Transmission probability | ~50% reduction in attached-tick transmission if removed <24 h | range, not SD | Free | Per-event | Sood 1997; CDC |
| Personal | Public-messaging / PPE-subsidy campaigns | HE, HC | ~20–40% increase in self-reported PPE use; HC effect rarely demonstrated | range, not SD | $50–500k / county / yr | Annual | Beard 2018; CDC |
| Clinical | Single-dose doxycycline post-bite prophylaxis | Erythema migrans incidence | 87% reduction in EM (Nadelman 2001) | 95% CI 25–98% | $5–30 / dose + visit | Per-bite | Nadelman 2001 NEJM |
| Clinical | Early-treatment campaigns (general) | Human morbidity | Reduces sequelae; marginal effect on transmission (ticks + mice are reservoir) | n/a | Variable | Per-case | CDC IDSA 2020 |
| Clinical | LYMERix (OspA, withdrawn 2002) | HC | 76–78% efficacy after 3 doses | 95% CI ~60–86% | n/a (withdrawn) | Multi-yr + booster | Steere 1998 NEJM |
| Speculative | VLA15 (Pfizer/Valneva, phase 3 VALOR) | HC | 73.2% efficacy post-dose-4 (interim 2026) | single trial in progress | est. $100–200 / dose × 3 + booster | Annual booster expected | NCT05477524; Pfizer 2026 |
| Speculative | mRNA anti-tick saliva vaccine (19ISP) | Tick attachment / transmission | Prevents *B. burgdorferi* transmission in guinea pig model | preclinical only | n/a | n/a | Sajid 2021 Sci Transl Med |
| Speculative | CRISPR heritable-Ab mice (Mice Against Ticks) | NIP via mouse reservoir | Pre-deployment; modeling: could push local NIP→0 over 5–10 yr | speculative | est. $0.5–5M island-scale | Permanent (released) | Buchthal 2019 PLOS Biol |
| Speculative | Sterile male tick release / SIT | Adult reproduction | No field data for *Ixodes* (logistically hard; ticks have long generation) | n/a | n/a | n/a | Conceptual only |
| Speculative | Anti-tick microbiome interventions | Vector competence | Lab proof-of-concept (e.g. *Coxiella*-LIKE manipulations) | n/a | n/a | n/a | Narasimhan 2014 Cell Host Microbe |

---

## 3. Per-intervention sections

### 3.1 Vector-targeted acaricides

#### Bifenthrin / synthetic-pyrethroid broadcast spray
**Mechanism.** Pyrethroid contact insecticide applied to vegetation
(especially the ecotone where lawn meets woodland) by backpack sprayer or
hose-end. Knocks down questing nymphs by contact + residual.

**Numbers.** Stafford and colleagues at the Connecticut Agricultural Experiment
Station have shown 68–100% QN reduction in controlled small-plot trials with
spring application. The pivotal real-world test is the **Hinckley 2016 CDC
RCT** (2,727 households, 3 NE states, double-blinded vs. placebo):
**63% reduction in QN on treated properties** — yet **no difference in
human-tick encounters, self-reported tick-borne disease, or medical-record-validated
disease**. This "tick-down but cases-flat" disconnect is the central caveat
for any property-scale intervention strategy. Williams & Stafford (2024)
showed late-fall application is also effective at suppressing the following
spring's nymphs (71–95% QN reduction).

**Caveats.** Off-target arthropod kill (bees, aquatic invertebrates),
applicator licensing, multiple seasonal apps for sustained suppression. No
documented pyrethroid resistance in *I. scapularis* yet but watch for it
(resistance exists in *Rhipicephalus* and other tick genera).

**Links.**
- Hinckley AF et al. (2016). *J Infect Dis* 214:182–8. https://doi.org/10.1093/infdis/jiv775
- Schulze TL et al. (2001). *J Med Entomol* 38:344–6.
- Williams SC, Stafford KC (2024). *J Med Entomol* 61:965–. https://academic.oup.com/jme/article/61/4/965/7644864
- Eisen L, Dolan MC (2016). *J Med Entomol* 53:1063–92. https://pmc.ncbi.nlm.nih.gov/articles/PMC5788731/

#### *Metarhizium brunneum* / *M. anisopliae* F52 (Met52)
**Mechanism.** Entomopathogenic fungus; spores germinate on tick cuticle and
kill within days. "Organic / minimum-risk" alternative to synthetic
pyrethroids.

**Numbers.** Bharadwaj & Stafford (2010, CT residential plots): 53–96% QN
reduction depending on spray rate and weeks post-application. **The Tick
Project (Keesing & Ostfeld 2022, BMC Public Health / 2022 EID)** ran the
largest community trial: 4-year, neighborhood-scale, ~24 neighborhoods
randomized, fipronil bait boxes + Met52 vs. placebo. **Met52 did not
significantly reduce questing-nymph abundance**, bait boxes cut QN ~50%, and
**neither reduced human-reported tick encounters nor incidence of
tick-borne disease**.

**Caveats.** Sensitive to UV and desiccation; needs cool moist conditions and
proper timing. Field efficacy is highly variable between Bharadwaj-style small
plot studies and neighborhood-scale rollouts.

**Links.**
- Bharadwaj A, Stafford KC III (2010). *J Med Entomol* 47:862–7. https://academic.oup.com/jme/article/47/5/862/882905
- Keesing F, Mowry S, Bremer W et al. (2022). *Emerg Infect Dis* 28:957. https://wwwnc.cdc.gov/eid/article/28/5/21-1146_article
- Ostfeld RS et al. (2023). *PLOS ONE* / impacts-over-time follow-up. https://pmc.ncbi.nlm.nih.gov/articles/PMC9993163/

#### Nootkatone
**Mechanism.** Grapefruit-derived sesquiterpene with combined repellent +
acaricidal action. Licensed by CDC to Evolva; EPA-registered 2020 but no
mass-market formulation yet.

**Numbers.** Jordan & Schulze (2011): two backpack applications 2 weeks
apart sustained >80% QN suppression for 6 weeks. Lab EC50 for repellency
against *I. scapularis* nymphs: 0.87 µg/cm² (very potent; ~3 orders of
magnitude more potent than against *A. americanum*).

**Caveats.** Not yet commercially available at residential scale;
formulation stability problems (volatile). Mostly single-source efficacy
data.

**Links.**
- Jordan RA et al. (2011). *J Med Entomol* 48:1095. https://academic.oup.com/jme/article/49/5/1035/1044132
- CDC Nootkatone press kit. https://www.cdc.gov/vector-borne-diseases/communication-resources/press-kit-nootkatone.html

#### Cedarwood oil & essential-oil "minimum-risk" sprays (EcoSMART, EcoTrol)
**Mechanism.** Plant terpenoids (cedrol, rosemary, peppermint); marketed as
EPA minimum-risk (FIFRA 25b exempt).

**Numbers.** Eisen et al. (2024, *EID*) tested commercial minimum-risk
products: cedarwood-based sprays gave 0–24% knockdown and 0–15% residual
suppression of *I. scapularis* nymphs in residential settings. EcoTrol T&O
gave >70% suppression only for 1–3 weeks and required multiple apps.

**Caveats.** Lab repellency (80–94% at 30 min for cedarwood) does not
translate to field efficacy. Honest characterization: these products
underperform their marketing claims.

**Links.**
- Eisen L et al. (2024). *Emerg Infect Dis* 30(1). https://wwwnc.cdc.gov/eid/article/30/1/23-0813_article
- Flor-Weiler LB et al. (2022). *Exp Appl Acarol*. https://pmc.ncbi.nlm.nih.gov/articles/PMC8858296/

### 3.2 Host-targeted on rodents

#### Damminix tick tubes (permethrin-treated cotton in cardboard tube)
**Mechanism.** Mice take cotton for nest material; permethrin contact-kills
attached larvae & nymphs during the blood meal.

**Numbers.** Mather et al. 1987–88 (MA, original): 89% QN reduction the
following year, 97% reduction in *infected* nymphs. **Subsequent suburban
replications in NY and CT failed to reproduce**. Jordan & Schulze (NJ
residential, 2-yr trial): only 20–28% QN reduction.

**Caveats.** Effect depends on mice actually being the dominant immature-tick
host (variable in suburbia where chipmunks, shrews, birds matter); on tube
density (15–30/property typically); and on placement near mouse runways. In
high-mast years mice may ignore the cotton. Permethrin resistance not
documented in *Ixodes* but possible.

**Links.**
- Mather TN et al. (1987). *J Med Entomol* 24:323–32.
- Jordan RA & Schulze TL (2019). *J Med Entomol* 56 (Damminix vs TCS comparison). https://pmc.ncbi.nlm.nih.gov/articles/PMC8116133/
- Wang DL et al. (2024). *J Med Entomol* 61:1459. (Optimization). https://academic.oup.com/jme/article/61/6/1459/7797289

#### SELECT TCS bait box (fipronil-treated felt wick)
**Mechanism.** Bait box draws mice/chipmunks; fipronil from wick contacts
animal and kills ticks systemically for 4–6 weeks.

**Numbers.** Schulze et al. (2017, NJ): 84% and 79% QN reduction at 1 yr and
2 yr. Tick Project (Keesing 2022): ~50% QN reduction at neighborhood scale —
but **no significant reduction in human-reported tick encounters or
tick-borne disease**.

**Caveats.** Restricted-use pesticide; deployed by licensed Tick Box
Technology / contractor, ~12 boxes per residential lot, refilled twice per
season. Bait-box visitation declines in habitats with abundant alternative
food. Fipronil non-target concern modest at low dose.

**Links.**
- Schulze TL et al. (2017). *J Med Entomol* 54:1019. https://academic.oup.com/jme/article/54/4/1019/3070958
- Dolan MC et al. (2017). *J Med Entomol* 54:403–10 (doxy + fipronil combined). https://pmc.ncbi.nlm.nih.gov/articles/PMC5968630/
- Keesing 2022 (above).

#### Oral doxycycline rodent bait
**Mechanism.** Doxycycline-laden rodent bait clears *B. burgdorferi* from
infected mice and from feeding nymphs.

**Numbers.** Dolan 2008 (lab): 89–100% spirochete clearance in nymphs that
fed on bait-fed mice; 100% infection prevention. Combined doxy + fipronil
bait box (Dolan 2017): NIP and *B. burgdorferi* prevalence both reduced in
small mammals.

**Caveats.** Not commercially deployed (regulatory and antimicrobial-resistance
concerns); pure transmission-blocking, no effect on QN abundance.

**Links.**
- Dolan MC et al. (2008). *Am J Trop Med Hyg* 78:803. https://pubmed.ncbi.nlm.nih.gov/18458316/
- Dolan MC et al. (2017). *J Med Entomol* 54:403. https://pmc.ncbi.nlm.nih.gov/articles/PMC5968630/

#### Reservoir-targeted OspA oral vaccine bait
**Mechanism.** Oral *E. coli*–expressed OspA delivered in bait pellets;
mice raise anti-OspA Ab that kills spirochetes in feeding nymphs at the
mouse-tick interface.

**Numbers.** Tsao 2004 (PNAS) and Richer 2014 (J Infect Dis, 5-yr NY trial):
NIP reduction ~24% after 1 year, larger reductions in lab. Year-long
neutralizing-Ab response in white-footed mice (Meirelles Richer 2011).

**Caveats.** Pre-commercial; targets only the *Peromyscus* reservoir —
chipmunks, shrews, birds also contribute and are not vaccinated; field uptake
of bait depends on mouse foraging.

**Links.**
- Tsao JI et al. (2004). *PNAS* 101:18159. https://www.pnas.org/doi/10.1073/pnas.0405763102
- Richer LM et al. (2014). *J Infect Dis* 209:1972. https://pmc.ncbi.nlm.nih.gov/articles/PMC4176399/
- Voordouw MJ et al. (2019). *Exp Appl Acarol*. https://link.springer.com/article/10.1007/s10493-019-00458-1

### 3.3 Host-targeted on deer

#### 4-Poster permethrin self-applicator stations
**Mechanism.** Bait station with permethrin-soaked paint rollers contacts
deer head/neck/ears as they eat corn; passes adult ticks topically.

**Numbers.** USDA NE Area-Wide Tick Control Project meta-analysis (Brei 2009):
~71% QN reduction by year 6, 68% overall risk reduction. Pound et al.
(NASA Goddard 1995–98): 100% deer-borne control, 86–91% QN reduction in
years 2–3. Schulze NJ studies similar. **Stafford 2017 designed-RCT in
residential CT**: only **~8% reduction** vs. controls — much less than older
studies, attributed to deer mobility on suburban scale.

**Caveats.** Permethrin resistance has been monitored on Shelter Island and
remains low. Bait stations require corn, regulatory hurdles (many states
restrict deer feeding), wildlife agency cooperation; ~1 station per 20–50
acres. Effects require ≥3 seasons.

**Links.**
- Pound JM et al. (2009). *J Med Entomol* 46:892. https://academic.oup.com/jipm/article/8/1/19/3978945
- Schulze TL et al. (2009, NJ). *J Med Entomol*.
- Williams SC, Stafford KC, Linske MA (2018). *J Med Entomol* (5-yr CT residential RCT). https://parasitesandvectors.biomedcentral.com/articles/10.1186/1756-3305-7-292
- Pound JM et al. (2024). Operational considerations. https://pmc.ncbi.nlm.nih.gov/articles/PMC10840788/

#### Deer culling
**Mechanism.** Reduce deer density below the threshold at which adult ticks
can successfully feed and reproduce. Critical threshold from theoretical &
empirical work ~5–8 deer/km² (~0.05–0.08/ha).

**Numbers.** **Monhegan Island, ME** (deer completely removed 1996–99):
adult ticks rare, larvae and nymphs absent by 2002, sub-adult *I. scapularis*
not detected since 2002. **Mumford Cove, CT** (reduced from 21–46 to ~5
deer/km² in 2000–01): substantial multi-year nymphal decline. **Bridgeport,
CT** (reduced 97→25 deer/km²): 74% deer reduction → 90% NQ reduction.
However, **Kilpatrick & Labonte 2014** in a multi-site review caution that
without near-complete removal (or island isolation), partial deer reduction
gives variable and often disappointing results, because adult ticks
opportunistically aggregate on remaining deer.

**Caveats.** Public acceptance, social and political cost very high in
suburban settings. Birds can re-introduce ticks (Monhegan adults occasionally
re-appear). Cost per deer for managed sharpshooter / archery hunts $200–800
inclusive of carcass processing.

**Links.**
- Rand PW et al. (2004). *J Med Entomol* 41:779. https://pubmed.ncbi.nlm.nih.gov/15311475/
- Stafford KC et al. (2003). *J Med Entomol* 40:642. https://pubmed.ncbi.nlm.nih.gov/14596277/
- Kilpatrick HJ, Labonte AM, Stafford KC (2014). *J Med Entomol* 51:777. https://pmc.ncbi.nlm.nih.gov/articles/PMC4912954/

#### Deer-exclusion fencing (8-ft)
**Mechanism.** Physically exclude deer from a property or block of properties;
adult tick reproduction collapses inside the exclosure.

**Numbers.** Daniels & Fish 1993 (electric fence, ≥300 ft inside exclosure):
100% larvae, 85% nymphs, 74% adults reduction. Williams 2025 (CT suburban
RCT, JME): 83–97% reduction across stages for ≥15-acre exclosures. Small
exclosures (<5 acres) often show no effect because deer just go around.

**Caveats.** Capital cost ($8–20/linear ft). Effective only at ≥15-acre
scale → requires neighborhood cooperation. Mice & chipmunks unaffected;
existing nymphal generation persists for ~1 year. Aesthetic / wildlife-access
trade-offs.

**Links.**
- Daniels TJ, Fish D (1993). *J Med Entomol* 30:1043. https://pubmed.ncbi.nlm.nih.gov/8271246/
- Williams SC et al. (2025). *J Med Entomol*. https://academic.oup.com/jme/advance-article/doi/10.1093/jme/tjaf070/8171309

#### Deer sterilization (immunocontraception, surgical)
**Mechanism.** Reduce deer recruitment without lethal control. Tested at
Hastings-on-Hudson NY and parts of Fairfax County VA.

**Numbers.** Multi-year deer reductions of 20–60%; tick endpoint not
cleanly measured. Population effect is slower than culling; no published
tick-density figure of comparable quality. `insufficient data` for tick
effect.

**Caveats.** Expensive per doe ($1000–2000); slow demographic response;
limited to closed populations.

### 3.4 Habitat / environmental management

#### Leaf-litter removal
**Mechanism.** *I. scapularis* immatures desiccate quickly; deep moist
litter is required habitat. Removing or burning litter dries them out.

**Numbers.** Schulze et al. 1995 / Wilson 1986: 72.7–100% reduction in
host-seeking nymphs after spring + early-summer raking/blowing. Jordan &
Schulze 2020: relocating leaves to forest edge *increased* tick density there
3-fold the next spring — placement matters.

**Links.**
- Schulze TL et al. (1995). *J Med Entomol* 32:730. https://pubmed.ncbi.nlm.nih.gov/7473629/
- Jordan RA, Schulze TL (2020). https://entomologytoday.org/2020/03/18/to-reduce-tick-encounters-where-you-dump-your-leaves-matters/

#### Wood-chip / mulch barriers
**Mechanism.** A 3-ft-wide mulch / gravel band at the lawn-woods interface
desiccates dispersing nymphs.

**Numbers.** ~50–80% reduction in lawn-edge tick density (CDC / CAES
extension). Caveat: most cited figures come from extension publications, not
controlled trials.

**Links.** CDC tick prevention. https://www.cdc.gov/ticks/prevention/index.html; Stafford CAES handbook.

#### Mowing
**Mechanism.** Reduces humidity in cut zones; ticks favor cool moist
microhabitat.

**Numbers.** ~30–50% QN in mown vs. unmown adjacent areas (Stafford CAES).
Modest by itself.

#### Prescribed burns
**Mechanism.** Fire kills ticks directly and modifies host community + litter
microclimate.

**Numbers.** Gleim et al. 2014 (PLOS ONE, longleaf pine SW Georgia / N
Florida): long-term annual–biennial burns dramatically reduce all life
stages (often 80–100% suppression). Gleim et al. 2019 (Sci Rep): also reduces
NIP in surviving ticks. **NE applicability is limited** — most data are SE
US (lone star + blacklegged); NE deciduous + suburban fuel loads make
broadcast burns operationally difficult.

**Links.**
- Gleim ER et al. (2014). *PLOS ONE* 9:e112174. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0112174
- Gleim ER et al. (2019). *Sci Rep* 9:9974. https://www.nature.com/articles/s41598-019-46377-4

#### Deer-resistant / xeric landscaping
`insufficient data` — recommended by CDC, no controlled trials with tick
endpoints. Mechanism: reduce deer browse, reduce moisture.

### 3.5 Biological control

#### Guinea fowl
Duffy et al. (1992, Suffolk Cty NY): suggestive ~75% reduction of adult
ticks on lawn-edges with dense flock. Akoachere et al. (2024 JME, "Release
the hens"): complex and often null in modern replications. Probably some
effect on lawn-attached adults but not on woodland-edge nymphs.
- Duffy DC et al. (1992). https://manoa.hawaii.edu/hpicesu/papers/1992_The_Effectiveness_of_Helmeted_Guineafowl.pdf
- Akoachere J-F et al. (2024). *J Med Entomol*. https://academic.oup.com/jme/article/61/2/410/7590386

#### Virginia opossum tick consumption — DISPUTED
Keesing et al. 2009 (Proc R Soc B) reported captive opossums groom off
~5500 larval ticks/week. Hennessy & Hild 2021 (Ticks Tick-borne Dis)
examined 32 wild-opossum stomachs from Illinois and found **zero ticks**;
reviewed 23 published opossum diet studies, none documented nymph/adult tick
consumption. Modeling and naturalistic evidence for population-scale tick
suppression by opossums is weak. **Don't use as a deployable intervention.**
- Keesing F et al. (2009). *Proc R Soc B* 276:3911.
- Hennessy C, Hild K (2021). *Ticks Tick Borne Dis* 12:101724. https://www.sciencedirect.com/science/article/abs/pii/S1877959X21001333

#### Entomopathogenic nematodes (*Steinernema carpocapsae*, *S. feltiae*)
Hornbostel et al. (2005): 50–95% mortality of engorged females in lab
trials; field data sparse. Soil moisture-limited.

### 3.6 Personal / human-side measures

#### Permethrin-treated clothing
Vaughn & Meshnick 2011 (pilot) + Vaughn et al. 2014 (full RCT, NC outdoor
workers, n=159): **65% fewer blacklegged tick bites**, 80% fewer lone-star
bites among treated. Factory-impregnated (Insect Shield) lasts ~70 wash cycles
(~1 yr typical use). Aerosol DIY permethrin lasts ~6 washes.
- Vaughn MF et al. (2014). *J Occup Environ Med* 56:e35. https://pubmed.ncbi.nlm.nih.gov/24745637/

#### Skin repellents (DEET 20–30%, picaridin 20%, IR3535 20%)
Comparative data are surprisingly thin for *I. scapularis* (most data are
for *A. americanum* or mosquitoes). Lupi 2013 review for deer ticks:
IR3535 7.2 h mean protection, DEET 3.5 h, OLE/PMD 2.7 h, picaridin 2.5 h.
At ≥20% concentration all three are field-effective. CDC and EPA-registered
list of acceptable AIs.
- Cilek JE et al. (2008). *J Med Entomol* 45:706.
- Carroll JF et al. (2010). *J Med Entomol* 47:699.

#### Daily tick checks
Mechanism is *time-to-removal*: *B. burgdorferi* transmission probability
rises sharply after ~24 h attached. Sood et al. 1997 and others estimate
~50% reduction in transmission if attached ticks removed in <24 h. Compliance
in real households is poor.

#### Public-messaging / PPE-subsidy campaigns
20–40% bump in self-reported PPE use; trials almost never demonstrate
human-case reduction. Per Beard & Eisen (2018) review, effect on incidence
is uncertain. Counts as a behavioral risk-reducer with no causal Lyme
endpoint.

#### Single-dose doxycycline post-bite prophylaxis
Nadelman 2001 NEJM RCT (n=482, hyperendemic NY): single 200 mg doxy within
72 h of attached *I. scapularis* tick removal reduced EM incidence from
3.2% (placebo) to 0.4% — **87% efficacy (95% CI 25–98%)**. IDSA 2020
guidelines endorse for high-risk bites.
- Nadelman RB et al. (2001). *N Engl J Med* 345:79. https://www.nejm.org/doi/full/10.1056/NEJM200107123450201

#### Human Lyme vaccines
- **LYMERix** (recombinant OspA, SmithKline Beecham). Steere 1998 NEJM:
  76–78% efficacy after 3-dose series. Voluntarily withdrawn 2002, primarily
  for market reasons (low uptake, lawsuits citing autoimmune molecular-mimicry
  concern; no clear safety signal).
  - Steere AC et al. (1998). *N Engl J Med* 339:209.
- **VLA15** (Pfizer/Valneva, multivalent OspA covering 6 serotypes).
  Phase 3 **VALOR trial (NCT05477524)**, n=9437 ≥5 yr, US/EU/CA endemic sites.
  Interim 2026 results: **73.2% efficacy** from 28 d post-dose-4. BLA/MAA
  submission planned 2026.
  - https://www.pfizer.com/news/press-release/press-release-detail/pfizer-and-valneva-announce-lyme-disease-vaccine-candidate

### 3.7 Clinical reservoir reduction

Early-treatment campaigns reduce human morbidity but have **only marginal
effect on transmission**: ticks (transstadial) and mice (the persistent
zoonotic reservoir) sustain the cycle. Humans are dead-end / spillover hosts
for *B. burgdorferi* s.s. — treating people does not break R0. Worth
flagging in the sim as a "morbidity-only" lever, not a transmission lever.

### 3.8 Speculative / emerging

- **mRNA anti-tick saliva vaccine (19ISP)**, Sajid et al. 2021, *Sci Transl
  Med* 13:eabj9827. Encodes 19 *I. scapularis* salivary proteins; vaccinated
  guinea pigs develop erythema at attachment site, tick feeding fails,
  *B. burgdorferi* transmission blocked in model. Preclinical only; not yet
  in human trials. https://www.science.org/doi/10.1126/scitranslmed.abj9827
- **CRISPR heritable-Ab mice (Mice Against Ticks, Esvelt lab MIT)**. Local
  *P. leucopus* engineered to be immune to *B. burgdorferi* (or to anti-OspA
  Ab), released onto Nantucket / Martha's Vineyard with community consent. Not
  a gene drive (deliberately self-limiting). Estimated ~200,000 mice required
  for island-scale rollout. Buchthal et al. 2019, *PLOS Biol* 17:e3000080.
  Pre-deployment as of 2026.
- **Sterile insect technique for ticks**: long generation time + obligate
  blood meals make SIT logistically unattractive for *Ixodes*; no field
  programs.
- **Anti-tick microbiome interventions** (Narasimhan 2014 Cell Host Microbe;
  follow-ups): manipulate tick endosymbionts to reduce *Borrelia*
  colonization. Lab proof-of-concept only.

---

## 4. Gaps / eradication discussion

### What plausibly drives R0 < 1?

The basic reproduction number for *B. burgdorferi* in NE US endemic patches
is typically estimated R0 ≈ 1.5–4 (Hartemink-style nymph→nymph generation,
Mannelli et al.; varies by site). To push R0 below 1, the literature
suggests two qualitatively different paths:

1. **Deer-targeted route, area-wide.** Either *complete* deer removal
   (Monhegan-style island extirpation: R0 → 0 because adult ticks cannot
   reproduce) or sustained 8-ft exclusion fencing across ≥15-acre patches.
   Combined with leaf-litter removal and bait boxes, multi-year suppression
   is achievable. Public acceptance and required spatial scale are the
   binding constraints.
2. **Reservoir-host route.** Reservoir-targeted OspA bait + doxycycline
   bait + tick tubes/bait boxes, sustained for ≥3 yr. This drives NIP and
   *infected* nymph density down without necessarily collapsing nymph
   counts. Tsao 2004 modeling suggests this can flip R0 < 1 if mouse
   coverage is high (~70%+) and chipmunk/shrew reservoirs are also
   addressed. Operationally hard because non-mouse reservoirs are not
   targetable.

A human vaccine (VLA15 if licensed) addresses **human exposure** but does
not change R0 in the enzootic cycle — Lyme persists in the wildlife
community at the same rate; human cases drop because people are protected.
For genuine *eradication* (not just incidence control), one needs to break
the enzootic cycle.

### The Tick Project lesson (Keesing & Ostfeld 2022)

The largest property-scale RCT to date — 4 years, ~24 neighborhoods,
double-blinded — found that **Met52 + TCS bait boxes reduced ticks but did
not reduce human-reported tick encounters or tick-borne disease incidence**.
Implications:

- Property-scale tick reduction does not necessarily translate into reduced
  human exposure (people get bitten away from home, by ticks not present at
  treatment time, or in untreated portions of yards).
- The QN → HC chain has weak links: detection of bites, removal latency,
  spillover from untreated neighbors.
- Any sim attempting to predict eradication via property-scale interventions
  alone will likely **overstate** the disease-incidence effect.

This is the **"tick-down but cases-flat" disconnect**. The sim should expose
this gap — at minimum by separating QN reduction (high confidence) from HC
reduction (much weaker).

### Combinations that approach R0 < 1 in models / trials

- Area-wide deer reduction to ~5/km² + sustained acaricide for 3+ yr →
  modeling suggests R0 < 1 (Mannelli, Tsao).
- Reservoir vaccine (RTV) covering >70% of *Peromyscus* + 4-poster on
  remaining deer → modeled R0 < 1 (Tsao 2004 PNAS).
- Eradication-style (Monhegan): total deer removal, isolated geography.
  Demonstrated empirically.

### Largely speculative components

- mRNA 19ISP human vaccine: preclinical.
- CRISPR engineered mice: ~5 yr from possible island deployment.
- Microbiome / dysbiosis manipulation: lab only.
- SIT for ticks: conceptual.

---

## 5. Sim mapping table

Current sim constants in
`game/src/sim/interventions.ts` and `game/src/sim/params.ts`, with
literature numbers and recommended deltas.

| Current sim value | Literature anchor | Match? | Suggested change |
|---|---|---|---|
| `acaricide`: tickSurvivalMul *= 0.20 (80% kill) | Bifenthrin: 63% QN (RCT, Hinckley); 68–100% small-plot; median ~70% | Slightly optimistic | Loosen to 0.30 (70% kill) median; consider stochastic 0.10–0.50 |
| `acaricide`: $400/cell-ha/yr | Residential CT: $200–500/property (~0.2 ha) = ~$1000–2500/ha; commercial $200–300/acre = $500–750/ha | Low for residential, OK for commercial | Bump to $700–1000/cell-ha if cell = treated ha |
| `tickTubes`: larvaSurvivalMul *= 0.40, nymphSurvivalMul *= 0.55 | Damminix: 89% QN (original) → 20–28% QN (suburban replications). Median ~50% across studies. Larva vs. nymph differentiation is empirically thin. | Roughly OK on average; high variance | Keep ~0.5 each; consider effect range 0.4–0.8 to reflect replication failure |
| `tickTubes`: $250 | 24 tubes × ~$3 retail = $72; with service $150–250 | OK as installed-with-service price | No change |
| `fourPoster`: adultSurvivalMul *= 0.30 (70% kill) | 60–91% QN (multi-yr Pound/Schulze); 8% (Stafford 2017 RCT) | Optimistic for short-horizon residential; reasonable area-wide | Make horizon-dependent. For a 1-yr deployment use 0.6–0.7 (modest); for sustained 3+ yr use 0.2 |
| `fourPoster`: $1200 | $1000–1500 per station per year (corn + permethrin + maintenance); ~1 station per 20–50 acres | Realistic | No change |
| `deerCull`: deerDensityMul *= 0.50 (single-year halving) | Real culls: 50–90% multi-yr; threshold effect at ~5 deer/km² critical | Reasonable but should be threshold-aware | Add critical-threshold behavior: below ~0.05 deer/ha, adult reproduction collapses (Monhegan effect) |
| `deerCull`: $500 | $200–800/deer × deer culled per cell-ha. At K=8/ha, halving = 4 deer × $500 = $2000/cell. Sim charges $500 flat — undercosts | Underpriced | Either bump to $2000/cell or recast as $/deer × deer-removed |
| `mouseReduction`: mouseDensityMul *= 0.60 (40% reduction), $300 | Live-trap mouse removal published efficacy is highly variable; usually <50% sustained. No commercial product. | Generous; not a real intervention | Consider replacing with "bait box (TCS)" entity at ~50% on larva/nymph not mouse density; mouse trapping per se is a sketchy intervention to model |
| `habitatMgmt`: habMul *= 0.6 (40% reduction), $150, persists 2 yr | Leaf-litter removal: 72.7–100% QN; mulch barrier 50–80% lawn-edge; mowing 30–50% | Conservative if literal "leaf removal"; OK if blended | Tighten to habMul *= 0.4 (60% reduction) if intended as leaf-removal-led; persistence 1 yr (effect fades as litter rebuilds) |
| `habitatMgmt`: $150 | $50–200 DIY; $200–500 service per property | OK | No change |
| `messaging`: humanTransmissionMul *= 0.5 | Literature does not support 50% case reduction from messaging alone. Personal-protection product effects (repellents, treated clothing) when *used* approach this but adherence is poor. | Optimistic | Tighten to 0.7–0.85 (15–30% reduction); reflects Tick Project null and Beard 2018 review |
| `messaging`: $50 | Public-campaign cost varies; $50/cell may underprice meaningful campaigns | Low | No change if treated as nominal |
| `TICK.eggsPerAdult = 2000` | Ostfeld 2011, 1500–3000 viable eggs | Matches | No change |
| `TICK.sLarvaToNymph = 0.10`, `sNymphToAdult = 0.08` | Lindsay 1995; Ostfeld 2011 give 0.05–0.10 each — order-of-magnitude OK | OK | No change |
| `TICK.sAdultOverwinter = 0.50` | Higher than some estimates (Lindsay: 0.30–0.50) | Upper end | Consider 0.4 |
| `kMouseHalf = 8`, `kDeerHalf = 1.5` | Defensible orders-of-magnitude; few direct measurements | Plausible | No change |
| `MOUSE.K = 50`, `r = 1.2` | Peromyscus high years: 30–80/ha; r ≈ 1–2 | OK | No change |
| `DEER.K = 8`, `r = 0.25` | Suburban-edge: 5–25/ha is high; 8 is conservative but reasonable | OK | Note: critical threshold ~0.5/ha (50/km²) is the empirical inflection — make sure dispersal & cull dynamics can resolve below 1/ha |
| `LYME.pNymphToMouse = 0.83` | Donahue 1987 cited; consistent with high reservoir competence | OK | No change |
| `LYME.pMouseToLarva = 0.65` | Mather et al.; ranges 0.40–0.85 | OK | No change |
| `LYME.pNymphToHuman = 0.03` | Per attached infected nymph, dependent on attachment duration; published 0.01–0.05 | OK | No change |
| `LYME.humanBitesPerNymph = 0.002` | Encounter rate; very setting-specific. Suburban yards: 10^-3 to 10^-2 plausible | OK | No change |
| **Missing intervention**: deer fencing (8 ft) | 83–97% reduction larvae, 74% nymphs; multi-yr | n/a | Add: adultSurvivalMul *= 0.2, persistsYears: 10, very high cost (~$5000–10000/cell), gated by ≥15-acre scale |
| **Missing intervention**: post-bite doxycycline prophylaxis | 87% reduction in EM (Nadelman 2001) | n/a | Add as `humanTransmissionMul *= 0.13` clinical lever (cheap, per-bite) |
| **Missing intervention**: VLA15 human vaccine | 73% efficacy (Phase 3 interim) | n/a | Add as `humanTransmissionMul *= 0.27`, multi-yr, $300/person × humansPerCell |
| **Missing intervention**: Reservoir-targeted vaccine (RTV) | NIP reduction ~24% yr 1 | n/a | Add as direct knockdown on `pNymphToMouse` or `pMouseToLarva` link (not on tick survival) |

### Biggest deltas worth recalibrating now

1. **`messaging` effect (0.5) is too generous.** Literature & the Tick
   Project's null human-case result argue for ~0.7–0.85.
2. **`deerCull` cost flat-$500** undercharges by ~4× when sized against
   actual deer-per-cell at K=8. Convert to per-deer-removed pricing.
3. **`acaricide` 80% kill** is plausible for small-plot but high vs. the
   pivotal Hinckley RCT (63%); also the cost is low for the residential
   per-property scale.
4. **Missing the only intervention with strong human-case evidence at
   property scale: deer-exclusion fencing** (large multi-yr effect, large
   capital cost, scale-gated). This is the single most important addition
   for an eradication-flavored sim.
5. **Add the "tick-down ≠ cases-flat" mechanism explicitly** — e.g.,
   discount property-scale interventions' effect on `humanBitesPerNymph` by
   ~50% to model spillover. This is the Tick Project's central finding.
6. **Threshold behavior for deer.** Empirically there is a hard inflection
   near 5/km² (Monhegan, Mumford Cove). Current Beverton-Holt
   `kDeerHalf=1.5` smooths this. Consider a steeper Hill function or hard
   floor when deer drop below ~0.5/ha.

