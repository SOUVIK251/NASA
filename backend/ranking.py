"""
Ranking Module for NASA Flame in Freefall Findings.

Provides an objective, formula-driven, transparent ranking algorithm for microgravity
combustion findings. Every ranking score is fully explainable with component scores
and explicit criteria citations.
"""

from typing import Dict, Any, List


def calculate_finding_ranking(finding: Dict[str, Any], all_papers: List[Dict[str, Any]], measurements_count: int) -> Dict[str, Any]:
    """
    Calculate an explainable scientific ranking score (0 - 100) for a finding.
    
    Criteria:
    1. Evidence Availability (0 - 25 pts): Quality and formal rigor of NASA sources (Peer-reviewed paper vs Tech Report vs Mission Fact Sheet).
    2. Cross-Investigation Support (0 - 20 pts): Corroborated across multiple tests, flights, or campaigns.
    3. Fire-Safety Criticality (0 - 30 pts): Direct impact on crew survival, detection latency, suppression protocols, or atmosphere specs.
    4. Environmental Parameter Breadth (0 - 15 pts): Range of tested variables (O2 %, pressure, flow velocity, fuel geometry).
    5. Quantitative Data Maturity (0 - 10 pts): Backed by numerical sensor telemetry or quantitative datasets in NASA archives.
    """
    
    # 1. Evidence Availability Score (0 - 25)
    evidence_source = finding.get("evidence_source", "").lower()
    evidence_score = 15.0
    evidence_rationale = "Supported by NASA mission technical reporting."
    if "peer-reviewed" in evidence_source or "journal" in evidence_source or "cir" in evidence_source:
        evidence_score = 25.0
        evidence_rationale = "Supported by formal NASA peer-reviewed literature or direct ISS CIR instrument data."
    elif "technical report" in evidence_source or "ntrs" in evidence_source:
        evidence_score = 22.0
        evidence_rationale = "Documented in published NASA NTRS Technical Reports."
    elif "fact sheet" in evidence_source or "overview" in evidence_source:
        evidence_score = 14.0
        evidence_rationale = "Supported by NASA mission overviews and verified flight summaries."

    # 2. Cross-Investigation Support (0 - 20)
    supporting_count = finding.get("supporting_experiment_count", 1)
    if supporting_count >= 3:
        support_score = 20.0
        support_rationale = f"Corroborated across {supporting_count} distinct flight tests or mission phases."
    elif supporting_count == 2:
        support_score = 14.0
        support_rationale = "Corroborated across 2 complementary spaceflight investigations."
    else:
        support_score = 9.0
        support_rationale = "Validated within a single primary flight investigation campaign."

    # 3. Fire-Safety Criticality (0 - 30)
    relevance_text = finding.get("fire_safety_relevance", "").lower()
    title_text = finding.get("title", "").lower()
    safety_score = 18.0
    safety_rationale = "Provides operational guidance for spacecraft materials or atmosphere."
    
    # Check for highest severity keywords (cool flames undetected, suppression failure, large scale flame spread, toxic emissions)
    critical_keywords = ["cool flame", "undetected", "suppression", "pressure management", "depressurization", "toxic", "carbon monoxide", "heat release"]
    matches = [kw for kw in critical_keywords if kw in relevance_text or kw in title_text]
    
    if len(matches) >= 2:
        safety_score = 30.0
        safety_rationale = f"Direct life-safety hazard: affects flame detection, toxic emission ({', '.join(matches[:2])}), or suppression efficacy."
    elif len(matches) == 1:
        safety_score = 25.0
        safety_rationale = f"High fire-safety impact: impacts {matches[0]} mitigation or response protocol."
    else:
        safety_score = 18.0
        safety_rationale = "Moderate impact: informs engineering design limits and flammability testing standards."

    # 4. Environmental Parameter Breadth (0 - 15)
    variables = finding.get("variables", [])
    if isinstance(variables, str):
        variables = [v.strip() for v in variables.split(",") if v.strip()]
    var_count = len(variables)
    
    if var_count >= 4:
        param_score = 15.0
        param_rationale = f"Broad multivariate exploration ({var_count} parameters evaluated: {', '.join(variables[:3])}, etc.)."
    elif var_count >= 2:
        param_score = 11.0
        param_rationale = f"Multi-parameter investigation ({var_count} parameters evaluated: {', '.join(variables)})."
    else:
        param_score = 7.0
        param_rationale = f"Single-parameter focus ({', '.join(variables)})."

    # 5. Quantitative Data Maturity (0 - 10)
    if measurements_count >= 5:
        data_score = 10.0
        data_rationale = f"Backed by {measurements_count} discrete quantitative test records in repository."
    elif measurements_count > 0:
        data_score = 7.0
        data_rationale = f"Backed by {measurements_count} quantitative test runs in repository."
    else:
        data_score = 4.0
        data_rationale = "Supported primarily by qualitative observations and post-flight imagery."

    total_score = round(evidence_score + support_score + safety_score + param_score + data_score, 1)

    return {
        "total_score": total_score,
        "rank_tier": "CRITICAL TIER" if total_score >= 85 else ("HIGH PRIORITY" if total_score >= 70 else "FOUNDATIONAL"),
        "components": {
            "evidence_availability": {
                "score": evidence_score,
                "max": 25,
                "rationale": evidence_rationale
            },
            "cross_investigation_support": {
                "score": support_score,
                "max": 20,
                "rationale": support_rationale
            },
            "fire_safety_criticality": {
                "score": safety_score,
                "max": 30,
                "rationale": safety_rationale
            },
            "parameter_breadth": {
                "score": param_score,
                "max": 15,
                "rationale": param_rationale
            },
            "quantitative_maturity": {
                "score": data_score,
                "max": 10,
                "rationale": data_rationale
            }
        },
        "formula": "Score = Evidence(25) + CrossSupport(20) + SafetyImpact(30) + ParamBreadth(15) + DataMaturity(10)"
    }
