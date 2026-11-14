export interface GlossaryEntry {
  term: string;
  simpleExplanation: string;
  technicalDefinition: string;
  formula?: string;
  safetyRelevance: string;
  citation?: string;
}

export const GLOSSARY_TERMS: Record<string, GlossaryEntry> = {
  d2_law: {
    term: "D²-Law (Droplet Combustion)",
    simpleExplanation: "A rule discovered in the 1950s stating that the surface area of a burning liquid drop shrinks at a steady, constant rate over time.",
    technicalDefinition: "Classical quasi-steady droplet burning theory (Godsave & Spalding, 1953). States that the droplet diameter squared decreases linearly with time: D²(t) = D₀² - K·t, where K is the burning rate constant.",
    formula: "D^2(t) = D_0^2 - K \\cdot t",
    safetyRelevance: "Determines how fast fuel droplets burn out or whether they can drift into spacecraft ventilation filters while still burning.",
    citation: "Combustion and Flame 159(12):3583-3588 (2012)"
  },
  cool_flame: {
    term: "Cool Flame",
    simpleExplanation: "An invisible, low-temperature fire (around 600°C to 800°C) that keeps burning without producing any visible light or smoke after the hot flame goes out.",
    technicalDefinition: "Low-temperature alkane oxidation sustained by alkylperoxy radical isomerisation (R + O₂ ⇌ RO₂ → QOOH → ketohydroperoxides). Exhibits negative temperature coefficient (NTC) kinetics and produces no soot.",
    formula: "T_{cool} \\approx 600 - 850\\text{ K}, \\quad \\text{Zero visible emissions}",
    safetyRelevance: "Extremely dangerous for astronauts: a fuel fire might look completely extinguished, yet silently persist and reignite upon contact with fresh airflow.",
    citation: "Nayagam et al., Combustion and Flame (2012)"
  },
  grashof_number: {
    term: "Grashof Number (Gr)",
    simpleExplanation: "A physics score measuring how strong the natural upward pull of hot air (buoyancy) is compared to the stickiness (viscosity) of the air.",
    technicalDefinition: "Dimensionless ratio of buoyant body forces to viscous forces in a fluid: Gr = (g · β · ΔT · L³) / ν². In 1g Earth gravity, Gr >> 10⁴. In microgravity (g ≈ 0), Gr → 0.",
    formula: "Gr = \\frac{g \\beta \\Delta T L^3}{\\nu^2}",
    safetyRelevance: "Tells engineers when flames switch from tall flickering teardrops to calm spherical envelopes, altering fire detector placement in spacecraft.",
    citation: "NASA SP-8088 / Law, Combustion Physics"
  },
  damkohler_number: {
    term: "Damköhler Number (Da)",
    simpleExplanation: "A comparison between how fast the chemical reactions happen versus how fast the air flows past.",
    technicalDefinition: "Dimensionless ratio of fluid mechanical residence/mixing time to chemical reaction time: Da = τ_flow / τ_chem. When Da falls below a critical threshold (Da < Da_crit ≈ 0.5), extinction or quenching occurs.",
    formula: "Da = \\frac{\\tau_{\\text{residence}}}{\\tau_{\\text{chemical}}} = \\frac{L / v}{1 / (k \\cdot [O_2])}",
    safetyRelevance: "Defines the blow-off extinction limit: high-velocity cabin ventilation can extinguish some flames, while slow ventilation feeds them.",
    citation: "Williams, Combustion Theory (1985)"
  },
  spalding_b_number: {
    term: "Spalding B-Number (Transfer Number)",
    simpleExplanation: "A thermodynamic number measuring how easily a fuel evaporates and burns when heat is applied.",
    technicalDefinition: "Dimensionless mass transfer number representing the driving potential for evaporation: B = (Δh_c · Y_{O2,∞} / s + c_p(T_∞ - T_s)) / L_v, where L_v is the latent heat of vaporization.",
    formula: "B = \\frac{\\Delta h_c \\cdot Y_{O_2,\\infty} / s + c_p(T_\\infty - T_s)}{L_v}",
    safetyRelevance: "Used in NASA material selection tests to rank which plastics and polymers pose the lowest fire hazard in exploration cabins.",
    citation: "Spalding, Fourth Symposium on Combustion (1953)"
  },
  concurrent_flow: {
    term: "Concurrent Flow",
    simpleExplanation: "When the air draft blows in the same direction the fire is spreading, blowing heat directly onto unburned fuel.",
    technicalDefinition: "Flame propagation where forced convective oxidizer airflow is aligned in the same vector as the flame front spread (+x). Convective heat transfer preheats the virgin solid fuel ahead of the pyrolysis front.",
    formula: "V_f \\propto v_{\\text{airflow}}^{n} \\quad (n \\approx 0.5 - 1.0)",
    safetyRelevance: "The most dangerous flame spread configuration in spacecraft. Fires grow rapidly along cable trays and ducting in the direction of ventilation.",
    citation: "NASA/TM-20210011385 (BASS-II Summary Report)"
  },
  opposed_flow: {
    term: "Opposed Flow",
    simpleExplanation: "When the air draft blows against the fire, cooling the fuel ahead and slowing the spread.",
    technicalDefinition: "Flame propagation where forced oxidizer airflow moves opposite to the direction of flame spread. Convective heat is swept backwards into the burnt wake, slowing the forward conduction into virgin fuel.",
    formula: "V_f \\ll V_{f,\\text{concurrent}}",
    safetyRelevance: "Fires spread significantly slower in opposed flow, giving crew and automated suppression systems valuable response time.",
    citation: "Olson et al., Combustion and Flame 168:378-390 (2016)"
  },
  limiting_oxygen_index: {
    term: "Limiting Oxygen Index (LOI)",
    simpleExplanation: "The minimum amount of oxygen needed for a material to keep burning without putting itself out.",
    technicalDefinition: "The minimum volume percentage of O₂ in an O₂/N₂ mixture that will support flaming combustion of a specified material. In microgravity, the absence of buoyant convective heat loss can lower the LOI, allowing materials to burn at lower O₂ than on Earth.",
    formula: "\\text{LOI} = \\frac{[O_2]}{[O_2] + [N_2]} \\times 100\\%",
    safetyRelevance: "NASA exploration atmospheres (e.g. Artemis 34% O₂ at 8.2 psia) must stay safely above crew hypoxia limits while remaining below catastrophic material flammability limits.",
    citation: "NASA-STD-6001B Flammability Screening"
  },
  microgravity_flame: {
    term: "Microgravity Spherical Flame",
    simpleExplanation: "Without gravity pulling cold air down to push hot air up, fire spreads outward equally in all directions like a glowing blue or orange ball.",
    technicalDefinition: "Spherically symmetric 1D radial diffusion flame (aspect ratio H/D ≈ 1.0) governed by molecular diffusion rather than buoyant natural convection. Characterized by low soot production and thick reaction shells.",
    formula: "\\frac{\\partial}{\\partial \\theta} = \\frac{\\partial}{\\partial \\phi} = 0, \\quad \\frac{H}{D} \\approx 1.0",
    safetyRelevance: "Spherical flames do not create an upward smoke plume, requiring multi-directional optical and particulate sensors rather than traditional ceiling smoke detectors.",
    citation: "NASA SP-2000-6110"
  },
  cir_mdca: {
    term: "ISS CIR / MDCA Facility",
    simpleExplanation: "A double-sealed combustion rack on the space station equipped with high-speed cameras and fuel injectors for microgravity flame research.",
    technicalDefinition: "Combustion Integrated Rack (CIR) housing the Multi-user Droplet Combustion Apparatus (MDCA) in the US Destiny module. Features a 100-liter chamber, 3-axis acceleration monitoring, and high-speed multi-spectral cameras.",
    safetyRelevance: "Provides the benchmark flight telemetry used to design life support and fire protection for future lunar base camps.",
    citation: "NASA/TP-2015-216046"
  },
  sibal_fabric: {
    term: "SIBAL Fabric",
    simpleExplanation: "A standard test cloth (75% cotton, 25% fiberglass) used by NASA to evaluate spacecraft fabric flammability.",
    technicalDefinition: "Solid Inflammability Boundary at Low-speed (SIBAL) composite fabric: 75% cotton / 25% fiberglass blend (0.37 mm thick, 18 mg/cm²). The inert fiberglass matrix retains structural integrity as cotton pyrolyzes.",
    safetyRelevance: "The primary fuel in SAFFIRE large-scale tests, modeling how flight suits and cargo packing materials burn in spacecraft ducts.",
    citation: "NASA NTRS 20170008805 (Saffire-I Flight Report)"
  },
  ntc_regime: {
    term: "Negative Temperature Coefficient (NTC)",
    simpleExplanation: "A counter-intuitive chemical zone where making the fire slightly hotter actually slows the chemical reaction down.",
    technicalDefinition: "Kinetic temperature range (~650–800 K for alkanes) where the equilibrium R + O₂ ⇌ RO₂ shifts back toward reactants, decreasing the overall reaction rate as temperature increases until high-temperature branching takes over.",
    safetyRelevance: "Responsible for cool flame stabilization in microgravity, allowing droplets to burn steadily at low heat without runaway acceleration.",
    citation: "Nayagam & Williams, Combust. Flame (2012)"
  }
};
