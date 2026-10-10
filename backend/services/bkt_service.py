import math
from typing import List, Dict, Any, Optional

class BKTService:
    """
    Bayesian Knowledge Tracing (BKT) and Cognitive Calibration Engine.
    Handles BKT state transitions, hint penalty decay, prerequisite propagation,
    and Brier score/Blindspot calculations.
    """
    def __init__(self, p_init: float = 0.30, p_learn: float = 0.20, p_slip: float = 0.10, p_guess: float = 0.15):
        self.p_init = p_init
        self.p_learn = p_learn
        self.p_slip = p_slip
        self.p_guess = p_guess

    def compute_blindspot(self, confidence_0_100: float, score_0_100: float) -> float:
        """
        Blindspot = confidence - actual_score
        Positive (>0): Overconfident (illusion of competence)
        Negative (<0): Underconfident (latent mastery)
        0: Perfectly calibrated
        """
        return round(float(confidence_0_100 - score_0_100), 2)

    def compute_brier_score_single(self, confidence_0_100: float, score_0_100: float) -> float:
        """
        Brier score component for a single observation: (conf - outcome)^2
        Confidence in [0, 1], outcome in [0, 1]. Range: [0.0, 1.0]. Lower is better.
        """
        c = max(0.0, min(1.0, confidence_0_100 / 100.0))
        y = max(0.0, min(1.0, score_0_100 / 100.0))
        return round((c - y) ** 2, 4)

    def compute_brier_score_overall(self, attempts: List[Dict[str, float]]) -> float:
        """Calculate mean Brier score across an array of attempts."""
        if not attempts:
            return 0.0
        total = sum(self.compute_brier_score_single(a["confidence"], a["score"]) for a in attempts)
        return round(total / len(attempts), 4)

    def update_bkt(
        self,
        p_known_prev: float,
        score_0_100: float,
        hints_used: int = 0,
        p_learn: Optional[float] = None,
        p_slip: Optional[float] = None,
        p_guess: Optional[float] = None
    ) -> float:
        """
        Standard 4-parameter BKT update with hint deduction.
        If hints were used, the outcome is discounted proportionally.
        """
        p_t = p_learn if p_learn is not None else self.p_learn
        p_s = p_slip if p_slip is not None else self.p_slip
        p_g = p_guess if p_guess is not None else self.p_guess
        
        # Clamp prior
        p_l = max(0.01, min(0.99, p_known_prev))
        
        # Hint discount: each hint reduces effective success probability
        hint_penalty = min(0.75, hints_used * 0.20)
        effective_score = max(0.0, (score_0_100 / 100.0) - hint_penalty)
        is_correct = effective_score >= 0.70

        if is_correct:
            # P(L_t | Correct)
            numerator = p_l * (1.0 - p_s)
            denominator = (p_l * (1.0 - p_s)) + ((1.0 - p_l) * p_g)
        else:
            # P(L_t | Incorrect)
            numerator = p_l * p_s
            denominator = (p_l * p_s) + ((1.0 - p_l) * (1.0 - p_g))

        posterior_obs = numerator / max(1e-6, denominator)
        
        # Learning transition: P(L_{t+1}) = posterior + (1 - posterior) * P(T)
        p_updated = posterior_obs + (1.0 - posterior_obs) * p_t
        return round(max(0.05, min(0.99, p_updated)), 4)

    def propagate_prerequisite_penalty(
        self,
        failing_concept_id: str,
        concept_mastery_map: Dict[str, float],
        graph_edges: List[Dict[str, str]],
        decay_factor: float = 0.10
    ) -> Dict[str, float]:
        """
        Mastery on connections: When a concept fails, propagate a small uncertainty
        penalty to upstream prerequisite nodes.
        """
        updated_map = dict(concept_mastery_map)
        
        # Find all prerequisites: edges where type == 'prerequisite_of' and to == failing_concept_id
        for edge in graph_edges:
            if edge.get("type") == "prerequisite_of" and (edge.get("to") == failing_concept_id or edge.get("to_concept_id") == failing_concept_id):
                prereq_id = edge.get("from") or edge.get("from_concept_id")
                if prereq_id in updated_map:
                    current = updated_map[prereq_id]
                    # Apply gentle decay
                    updated_map[prereq_id] = round(max(0.10, current * (1.0 - decay_factor)), 4)
                    
        return updated_map

    def compute_calibration_curve(self, attempts: List[Dict[str, float]]) -> List[Dict[str, Any]]:
        """
        Group attempts into confidence bins (0-20, 20-40, 40-60, 60-80, 80-100)
        and compute actual average accuracy per bin.
        """
        bins = [
            {"bin": "0-20%", "min": 0, "max": 20, "confidences": [], "scores": []},
            {"bin": "20-40%", "min": 20, "max": 40, "confidences": [], "scores": []},
            {"bin": "40-60%", "min": 40, "max": 60, "confidences": [], "scores": []},
            {"bin": "60-80%", "min": 60, "max": 80, "confidences": [], "scores": []},
            {"bin": "80-100%", "min": 80, "max": 100, "confidences": [], "scores": []},
        ]
        
        for a in attempts:
            c = a.get("confidence", 50.0)
            s = a.get("score", 50.0)
            for b in bins:
                if b["min"] <= c <= b["max"] or (c > 100 and b["max"] == 100):
                    b["confidences"].append(c)
                    b["scores"].append(s)
                    break

        result = []
        for b in bins:
            count = len(b["scores"])
            avg_conf = (sum(b["confidences"]) / count) if count > 0 else (b["min"] + b["max"]) / 2.0
            avg_actual = (sum(b["scores"]) / count) if count > 0 else 0.0
            result.append({
                "bin": b["bin"],
                "avg_confidence": round(avg_conf, 1),
                "avg_actual": round(avg_actual, 1),
                "count": count,
                "ideal": (b["min"] + b["max"]) / 2.0
            })
        return result

bkt_service = BKTService()
