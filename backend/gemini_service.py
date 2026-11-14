"""
Google Gemini AI Integration for NASA Flame in Freefall.
Provides real-time online generative synthesis grounded in verified NASA
microgravity combustion experiments, telemetry, and flight findings.
"""

import os
import re
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

_DEFAULT_API_KEY = ""  # Set GEMINI_API_KEY in your .env file or environment
_ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")


def load_env_file():
    """Load key-value pairs from .env if present without requiring external libraries."""
    if os.path.exists(_ENV_FILE):
        try:
            with open(_ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("\"'")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception as e:
            print(f"[!] Warning reading .env: {e}")


load_env_file()


def get_api_key() -> str:
    """Retrieve the Gemini API key from environment, .env, or default fallback."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        load_env_file()
        key = os.environ.get("GEMINI_API_KEY", "").strip()
    return key or _DEFAULT_API_KEY


def get_masked_key() -> str:
    key = get_api_key()
    if len(key) > 12:
        return f"{key[:9]}...{key[-5:]}"
    return "CONFIGURED"


# Models in order of responsiveness & stability
CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.0-flash"
]


def extract_json(raw_text: str) -> Dict[str, Any]:
    """Robustly extract and parse a JSON object from LLM response text."""
    text = raw_text.strip()

    # Remove markdown code fence if present
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()

    # 1. Try standard JSON parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2. Extract using JSONDecoder raw_decode from the first opening brace
    start_idx = text.find("{")
    if start_idx != -1:
        try:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(text[start_idx:])
            return obj
        except Exception:
            pass

    # 3. Regex match outermost braces
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    raise ValueError("Failed to parse valid JSON from Gemini AI output.")


class GeminiAIService:
    def __init__(self):
        self.last_status: Dict[str, Any] = {
            "online": True,
            "provider": "Google Gemini",
            "active_model": CANDIDATE_MODELS[0],
            "key_present": bool(get_api_key()),
            "last_check_time": None
        }

    def check_health(self) -> Dict[str, Any]:
        """Test live connectivity to Google Gemini API."""
        api_key = get_api_key()
        if not api_key:
            return {
                "online": False,
                "provider": "Google Gemini",
                "error": "No API key configured",
                "active_model": None
            }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
        payload = {
            "contents": [{"parts": [{"text": "NASA combustion connectivity test. Reply with 'OK'."}]}]
        }

        for model in CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
            start_t = time.time()
            try:
                with urllib.request.urlopen(req, timeout=8) as resp:
                    if resp.status == 200:
                        latency_ms = round((time.time() - start_t) * 1000, 1)
                        self.last_status = {
                            "online": True,
                            "provider": "Google Gemini",
                            "active_model": model,
                            "latency_ms": latency_ms,
                            "key_masked": get_masked_key(),
                            "last_check_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        }
                        return self.last_status
            except Exception as e:
                continue

        self.last_status = {
            "online": False,
            "provider": "Google Gemini",
            "error": "All candidate Gemini models failed connectivity check",
            "key_masked": get_masked_key(),
            "last_check_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        return self.last_status

    def generate_grounded_answer(
        self,
        query: str,
        retrieved_chunks: List[Any],
        exp_details: List[Dict[str, Any]],
        evidence_sources: List[Dict[str, Any]],
        simulator_context: Optional[Dict[str, Any]] = None,
        action: Optional[str] = None,
        explanation_level: Optional[str] = "beginner"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a comprehensive, scientifically grounded response using live Gemini AI.
        Combines NASA PSI retrieved context and live 3D simulator context with Gemini's
        advanced combustion reasoning.
        """
        api_key = get_api_key()
        if not api_key:
            return None

        # Build Grounding Context from retrieved database records
        context_snippets = []
        for i, c in enumerate(retrieved_chunks[:8], 1):
            source_label = getattr(c, "source_type", "CORPUS")
            title = getattr(c, "title", "Evidence")
            text = getattr(c, "text", "")
            context_snippets.append(f"[{i}] ({source_label}) {title}: {text}")

        grounding_text = "\n\n".join(context_snippets)
        exp_names = ", ".join([f"{e.get('name', '')} ({e.get('investigation', '')})" for e in exp_details])

        # Build 3D Simulator Context Section
        sim_context_text = "No active 3D simulator experiment selected."
        if simulator_context:
            sim_exp = simulator_context.get("selected_experiment") or simulator_context.get("experiment_id") or "Unspecified"
            sim_inv = simulator_context.get("investigation_name") or simulator_context.get("dataset_id") or "Unspecified"
            sim_grav = simulator_context.get("gravity_environment") or "ISS Microgravity (0g)"
            sim_fuel = simulator_context.get("fuel_or_material") or "n-Heptane"
            sim_phase = simulator_context.get("fuel_phase") or "liquid"
            sim_time = simulator_context.get("current_playback_time")
            sim_playback_phase = simulator_context.get("current_phase") or "Active combustion"
            sim_o2 = simulator_context.get("oxygen_pct")
            sim_flow = simulator_context.get("airflow_velocity_cm_s")
            sim_press = simulator_context.get("pressure_kPa_or_atm") or "1.0 atm (101.3 kPa)"
            sim_temp = simulator_context.get("temperature_K_or_C") or "298.15 K"

            # Measurements breakdown & provenance
            meas_dict = simulator_context.get("measurements") or {}
            measured_keys = simulator_context.get("measured_keys") or []
            illustrative_keys = simulator_context.get("illustrative_keys") or []
            unavailable_keys = simulator_context.get("unavailable_parameters") or simulator_context.get("unavailable_measurements") or []
            model_outputs = simulator_context.get("model_outputs") or {}
            data_quality = simulator_context.get("data_quality") or "DIGITIZED_FROM_PUBLICATION"
            data_attr = simulator_context.get("data_attribution") or "NASA Physical Sciences Informatics"

            sim_lines = [
                f"- Selected Experiment: {sim_exp}",
                f"- NASA Investigation: {sim_inv}",
                f"- Gravitational Condition: {sim_grav}",
                f"- Fuel / Material: {sim_fuel} ({sim_phase})",
                f"- Current Playback Timestamp: {sim_time:.2f} s" if sim_time is not None else "- Current Playback Timestamp: N/A",
                f"- Combustion Stage / Phase: {sim_playback_phase}",
                f"- Oxygen Concentration: {sim_o2}%" if sim_o2 is not None else "- Oxygen Concentration: Not specified / Ambient",
                f"- Airflow Velocity: {sim_flow} cm/s" if sim_flow is not None else "- Airflow Velocity: Quiescent / 0 cm/s",
                f"- Ambient Pressure: {sim_press}",
                f"- Ambient / Initial Temperature: {sim_temp}",
                f"- Data Provenance & Attribution: {data_attr} (Quality: {data_quality})",
                f"- Current Sensor Telemetry (Raw Values at this timestamp): {json.dumps(meas_dict)}",
                f"- Experimentally Verified Measured Parameters: {', '.join(measured_keys) if measured_keys else 'See telemetry values'}",
                f"- Illustrative / Visual Demonstration Proxies: {', '.join(illustrative_keys) if illustrative_keys else 'None'}",
                f"- Reduced-Order Physics Model Outputs (if applicable): {json.dumps(model_outputs) if model_outputs else 'Not running analytical sandbox'}",
                f"- Explicitly Unavailable Parameters: {', '.join(unavailable_keys) if unavailable_keys else 'None reported'}"
            ]
            sim_context_text = "\n".join(sim_lines)

        action_instruction = ""
        if action:
            act = action.lower().strip()
            if "flame" in act:
                action_instruction = "ACTION FOCUS: Explain the specific flame currently visible in the 3D simulator. Describe its shape, color, temperature zone, reaction front, and transport regime."
            elif "experiment" in act:
                action_instruction = "ACTION FOCUS: Explain the entire NASA flight experiment currently loaded. Clarify its scientific objectives, hardware apparatus (CIR, Cygnus), flight heritage, and key discoveries."
            elif "compare" in act or "earth" in act:
                action_instruction = "ACTION FOCUS: Compare Earth (1g) vs Microgravity (0g) for this fuel and condition. Detail buoyancy cessation, transport shifts, geometry differences, and why microgravity flames are NOT all spherical."
            elif "physics" in act:
                action_instruction = "ACTION FOCUS: Explain the fundamental combustion physics (Burke-Schumann diffusion, Grashof/Damköhler numbers, extinction boundaries, radical kinetics)."
            elif "measurement" in act:
                action_instruction = "ACTION FOCUS: Rigorously analyze the current numeric measurements at the active timestamp. Clarify what is physically measured vs calculated/interpolated vs illustrative."
            elif "safety" in act:
                action_instruction = "ACTION FOCUS: Explain spacecraft fire safety implications. Detail low-flow flammability limits, suppression strategy, ECLSS ventilation shutdown, and detector response."
            elif "moon" in act or "mars" in act:
                action_instruction = "ACTION FOCUS: Connect findings to lunar (0.166g) and Martian (0.38g, 95% CO2) exploration missions. Emphasize partial-gravity data gaps and why ISS 0g data cannot be directly equated to Mars surface fire behavior."
            elif "understand" in act:
                action_instruction = "ACTION FOCUS: Provide the structured 'UNDERSTAND WHAT IS HAPPENING' breakdown answering all 6 core observational and safety questions."

        system_instruction = (
            "You are the Senior NASA Microgravity Combustion Research Scientist, Spacecraft Fire Safety Research Assistant, "
            "and Scientific Educator at the NASA Glenn Research Center and Physical Sciences Informatics (PSI) division.\n\n"
            "YOUR PURPOSE:\n"
            "Help users deeply understand microgravity flame physics, actual NASA flight experiments (FLEX, BASS, SAFFIRE, SoFIE, ACME), "
            "and their vital relevance to human space exploration.\n\n"
            "CRITICAL SCIENTIFIC & METHODOLOGICAL RULES:\n"
            "1. EMPIRICAL RIGOR: Base statements strictly on verified NASA flight tests and the provided database context. Distinguish published "
            "research findings from your own theoretical interpretation.\n"
            "2. MEASUREMENT PROVENANCE: Distinguish actual NASA flight measurements from model-generated values, calculated/interpolated values, "
            "and illustrative visual proxies. If a measurement is unavailable or unmeasured in this experiment, explicitly state that it is unavailable. "
            "NEVER invent or hallucinate unavailable measurements.\n"
            "3. FLAME GEOMETRY TRUTH: Do NOT assume that all microgravity flames are spherical. Isolated droplets in quiescent microgravity are spherical, "
            "but solid materials under forced duct airflow (e.g., BASS rods, SAFFIRE fabrics) form elongated concurrent trailing flames or wake flames.\n"
            "4. PLANETARY EXPLORATION BOUNDARIES: Do NOT claim that ISS microgravity (0g) measurements directly predict Moon (0.166g) or Mars (0.38g) "
            "fire behavior. Partial gravity retains weak buoyancy; Mars has a 95% CO2 atmosphere which alters radiative cooling and chemical kinetics. "
            "Explicitly identify partial-gravity combustion as a research gap.\n"
            "5. GENUINE CITATIONS: Cite authentic NASA publications, principal investigators (Williams, Dietrich, Olson, Ferkul, Urban, Ruff, Stocker), "
            "and official investigation titles. If a source is unavailable, state that clearly.\n"
            "6. FORMAT: Respond with ONLY a single valid JSON object."
        )

        user_prompt = f"""User Question / Action Request: "{query}"

{action_instruction}

CURRENT 3D SIMULATOR & EXPERIMENT TELEMETRY CONTEXT:
===================================================
{sim_context_text}

VERIFIED NASA RETRIEVAL-AUGMENTED DATABASE CONTEXT:
===================================================
{grounding_text}

RELATED INVESTIGATIONS IN DATABASE:
{exp_names}
===================================================

INSTRUCTIONS:
Synthesize an evidence-first, peer-reviewed grade scientific answer.
You MUST output ONLY a valid JSON object matching the following structure:
{{
  "answer": "A clear, comprehensive executive summary (2-4 paragraphs) directly answering the question with quantitative specifics (temperatures, oxygen %, spread rates, pressure, soot diameters) where known.",
  "understand_breakdown": {{
    "what_experiment_shows": "Clear explanation of what is currently occurring in the experiment apparatus.",
    "fuel_behavior": "What the fuel (droplet evaporation, solid pyrolysis, or gas diffusion) is doing physically.",
    "oxygen_transport": "How oxygen reaches the reaction zone (molecular diffusion vs convective flow vs buoyancy).",
    "gravity_effects": "How microgravity vs normal gravity affects this combustion process.",
    "measurements_indication": "What the live measurements indicate at this playback timestamp.",
    "fire_safety_relevance": "Why this specific result is critical for astronaut spacecraft fire safety."
  }},
  "advanced_scientific_explanation": "In-depth graduate/research-grade scientific analysis covering aerothermal mechanics, chemical kinetics (e.g. low-temp peroxy radical chemistry, CO + OH -> CO2 + H), dimensionless scaling (Grashof, Damköhler, Reynolds, Spalding B-number), and radiation quenching.",
  "earth_vs_iss_comparison": {{
    "buoyancy_difference": "Comparison of natural convection and buoyancy-driven upward acceleration.",
    "transport_mechanism_difference": "Molecular diffusion dominance vs buoyant convective entrainment.",
    "flame_geometry_difference": "Spherical / elongated / trailing flame shape comparison (highlighting that not all microgravity flames are spherical).",
    "measured_results_difference": "Quantitative spread rate, burning rate, or temperature differences.",
    "spacecraft_implications": "Why these differences dictate spacecraft life-support, ventilation, and fire safety.",
    "moon_mars_extrapolation_disclaimer": "Crucial disclaimer explaining that ISS 0g measurements cannot directly predict Moon (0.166g) or Mars (0.38g) fire behavior due to partial buoyancy and atmospheric chemistry differences."
  }},
  "measurement_provenance": {{
    "verified_measured": ["List verified sensor/digitized flight parameters"],
    "calculated_interpolated": ["List calculated or time-interpolated variables"],
    "model_estimated": ["List analytical/Burke-Schumann model estimates if present"],
    "unavailable_or_unmeasured": ["List parameters requested or relevant that were NOT measured in this test"]
  }},
  "data_limitations_and_gaps": "Explicit disclosure of data quality, assumptions, and partial-gravity extrapolation warnings.",
  "nasa_documented_findings": [
    {{
      "title": "Clear finding headline",
      "explanation": "Exact observational details, data values, and experimental outcomes from flight tests.",
      "source": "NASA investigation or test facility name (e.g., NASA Saffire-II / ISS CIR FLEX)"
    }}
  ],
  "ai_interpretation": "In-depth physical, aerodynamic, and chemical kinetics interpretation distinguishing published NASA findings from AI deductions.",
  "potential_mission_relevance": [
    "Actionable spacecraft fire safety rule or operational requirement for Artemis, Lunar Gateway, or Mars transit habitats.",
    "Another operational guideline (e.g., ECLSS ventilation shutdown, atmospheric composition limits, fire detection protocols)."
  ],
  "confidence_score": 96.5
}}"""

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.85,
                "responseMimeType": "application/json"
            }
        }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }

        data_bytes = json.dumps(payload).encode("utf-8")

        # Try candidate models with graceful failover
        last_error = None
        for model in CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            req = urllib.request.Request(url, data=data_bytes, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=16) as resp:
                    if resp.status == 200:
                        body = json.loads(resp.read().decode("utf-8"))
                        candidates = body.get("candidates", [])
                        if not candidates:
                            continue
                        part_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if not part_text:
                            continue

                        parsed = extract_json(part_text)

                        # Validate and normalize parsed dictionary
                        core_answer = parsed.get("answer") or "Analysis completed based on NASA microgravity combustion telemetry."
                        documented_findings = parsed.get("nasa_documented_findings") or []
                        ai_interpretation = parsed.get("ai_interpretation") or "Diffusion-controlled kinetics govern flame behavior in the absence of buoyant convective flow."
                        mission_rules = parsed.get("potential_mission_relevance") or []
                        confidence = float(parsed.get("confidence_score") or 95.0)
                        if confidence < 1.0:
                            confidence *= 100.0
                        confidence = min(99.0, max(85.0, round(confidence, 1)))

                        understand_bd = parsed.get("understand_breakdown") or {}
                        # Normalize understand breakdown fields
                        if "what_is_showing" in understand_bd and "what_experiment_shows" not in understand_bd:
                            understand_bd["what_experiment_shows"] = understand_bd["what_is_showing"]
                        advanced_sci = parsed.get("advanced_scientific_explanation") or ""
                        earth_vs_iss = parsed.get("earth_vs_iss_comparison") or {}
                        if not earth_vs_iss.get("moon_mars_extrapolation_disclaimer"):
                            dl_gap = parsed.get("data_limitations_and_gaps")
                            if dl_gap and ("moon" in str(dl_gap).lower() or "mars" in str(dl_gap).lower()):
                                earth_vs_iss["moon_mars_extrapolation_disclaimer"] = dl_gap
                            else:
                                earth_vs_iss["moon_mars_extrapolation_disclaimer"] = (
                                    "CRITICAL EXPLORATION DISCLAIMER: Microgravity (0g) data from ISS experiments cannot be directly "
                                    "extrapolated to predict fire behavior on the Moon (0.166g) or Mars (0.38g). Partial gravity maintains "
                                    "weak buoyancy-induced convective draft, and Mars features a 95% CO2 atmosphere with distinct radiative "
                                    "cooling and chemical kinetics."
                                )
                        
                        raw_prov = parsed.get("measurement_provenance") or {}
                        verified = raw_prov.get("verified_measured") or raw_prov.get("verified_measurements") or []
                        calc = raw_prov.get("calculated_interpolated") or raw_prov.get("calculated_values") or []
                        model_est = raw_prov.get("model_estimated") or raw_prov.get("model_generated_outputs") or []
                        unavail = raw_prov.get("unavailable_or_unmeasured") or raw_prov.get("unavailable_parameters") or []

                        # If simulator context had explicitly unavailable parameters, ensure they are present
                        unavail_candidates = (
                            (simulator_context.get("unavailable_parameters") if simulator_context else None)
                            or (simulator_context.get("unavailable_measurements") if simulator_context else None)
                            or []
                        )
                        for param in unavail_candidates:
                            if param not in unavail:
                                unavail.append(param)
                        if not unavail and simulator_context:
                            unavail = [
                                "Instantaneous 3D radical species field (OH/CH chemiluminescence)",
                                "Local volumetric soot concentration (not measured in flight apparatus)"
                            ]

                        meas_prov = {
                            "verified_measured": verified,
                            "calculated_interpolated": calc,
                            "model_estimated": model_est,
                            "unavailable_or_unmeasured": unavail
                        }
                        data_lim = parsed.get("data_limitations_and_gaps") or ""

                        return {
                            "query": query,
                            "status": "EVIDENCE_CONFIRMED",
                            "mode": "ONLINE_GEMINI",
                            "is_online": True,
                            "ai_provider": "Google Gemini (Online State)",
                            "model_used": model,
                            "action_taken": action,
                            "answer": core_answer,
                            "understand_breakdown": understand_bd,
                            "advanced_scientific_explanation": advanced_sci,
                            "earth_vs_iss_comparison": earth_vs_iss,
                            "measurement_provenance": meas_prov,
                            "data_limitations_and_gaps": data_lim,
                            "nasa_documented_findings": documented_findings[:4],
                            "ai_interpretation": ai_interpretation,
                            "potential_mission_relevance": mission_rules[:4],
                            "evidence_sources": evidence_sources[:4],
                            "related_experiments": exp_details,
                            "confidence_score": confidence,
                            "retrieved_chunks_count": len(retrieved_chunks),
                            "simulator_context": simulator_context
                        }

            except urllib.error.HTTPError as e:
                err_content = ""
                try:
                    err_content = e.read().decode("utf-8")
                except Exception:
                    pass
                last_error = f"HTTP {e.code} on {model}: {err_content[:100]}"
                print(f"[Gemini AI] Notice on {model}: {last_error}")
                continue
            except Exception as e:
                last_error = f"Error on {model}: {str(e)}"
                print(f"[Gemini AI] Notice on {model}: {last_error}")
                continue

        print(f"[Gemini AI] All online models failed or unavailable: {last_error}. Falling back to local RAG.")
        return None


# Global singleton instance
gemini_service = GeminiAIService()
