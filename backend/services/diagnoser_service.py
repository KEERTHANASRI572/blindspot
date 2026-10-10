import json
import os
from typing import Dict, Any, List, Optional
from services.llm_client import llm_client

class DiagnoserService:
    """
    Misconception Diagnoser & Socratic Hint Ladder.
    Extracts student reasoning, checks against the 28+ misconception library,
    provides exact evidence quotes, and generates tiered Socratic scaffolding.
    """
    def __init__(self):
        self.misconceptions_cache = self._load_misconceptions()

    def _load_misconceptions(self) -> List[Dict[str, Any]]:
        path = os.path.join(os.path.dirname(__file__), "..", "data", "misconceptions.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def diagnose_answer(
        self,
        scenario: Dict[str, Any],
        user_answer: str,
        confidence_0_100: float,
        hints_used: int = 0,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Compare answer against expected points & misconception library."""
        expected_points = scenario.get("expected_reasoning_points", [])
        
        # Format top 5 relevant misconceptions as context
        misc_context = "\n".join([
            f"- [{m['id']}] {m['name']}: {m['description']} (Error Type: {m['error_type']})"
            for m in self.misconceptions_cache[:10]
        ])

        prompt = (
            f"You are a master diagnostic AI tutor in Computer Science.\n"
            f"Scenario: {scenario.get('scenario')}\n"
            f"Question: {scenario.get('question')}\n"
            f"Rubric (Expected Reasoning Points):\n{json.dumps(expected_points)}\n\n"
            f"Misconception Ontology:\n{misc_context}\n\n"
            f"Student's Confidence: {confidence_0_100}%\n"
            f"Student's Answer:\n\"{user_answer}\"\n"
            f"Language: {language}\n\n"
            f"Evaluate the student's answer:\n"
            f"1. Score (0-100) based on conceptual accuracy and causal reasoning.\n"
            f"2. Diagnose if any specific misconception was committed. Return misconception_id, error_type, and an EXACT verbatim quote from the student's answer as evidence.\n"
            f"3. List any missing reasoning points.\n"
            f"4. Provide a grounded explanation in {language} (Tamil / Hindi / English as requested).\n\n"
            f"Return JSON format:\n"
            f"{{\n"
            f"  \"score_0_100\": 75.0,\n"
            f"  \"misconception_id\": \"MISC-OS-01 or null\",\n"
            f"  \"misconception_name\": \"Name or null\",\n"
            f"  \"error_type\": \"Oversimplified Rule Application or null\",\n"
            f"  \"evidence_quote\": \"Quote from answer or null\",\n"
            f"  \"confidence_in_diagnosis\": 0.90,\n"
            f"  \"missing_points\": [\"Missing step...\"],\n"
            f"  \"grounded_explanation\": \"Clear feedback...\"\n"
            f"}}"
        )

        mock_fallback = {
            "score_0_100": 45.0,
            "misconception_id": "MISC-OS-01",
            "misconception_name": "Circular Wait Implies Deadlock with Multi-Unit Resources",
            "error_type": "Oversimplified Rule Application",
            "evidence_quote": user_answer[:60] if user_answer else "There is a cycle so it will deadlock",
            "confidence_in_diagnosis": 0.88,
            "missing_points": ["Did not account for external process P3 releasing its instances."],
            "grounded_explanation": "You recognized the resource cycle, but applied a single-instance rule to a multi-instance system."
        }

        diagnosis = llm_client.generate_json(prompt, mock_fallback=mock_fallback)
        return diagnosis

    def generate_socratic_hint(
        self,
        scenario: Dict[str, Any],
        hint_level: int,
        user_draft: str = "",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Generate tiered Socratic scaffolding:
        Level 1: Guiding Socratic Question (never reveal answer)
        Level 2: Conceptual Analogy / Stronger Nudge
        Level 3: Partial Worked Step
        Level 4: Full Conceptual Reveal & Solution Walkthrough
        """
        titles = {
            1: "Hint 1: Guiding Socratic Question",
            2: "Hint 2: Conceptual Analogy & Nudge",
            3: "Hint 3: Partial Step Walkthrough",
            4: "Final Reveal & Complete Explanation"
        }

        if hint_level == 4:
            return {
                "scenario_id": scenario.get("id", ""),
                "hint_level": 4,
                "hint_title": titles[4],
                "hint_text": (
                    f"Full Solution: The expected reasoning requires examining: "
                    f"{' -> '.join(scenario.get('expected_reasoning_points', []))}"
                ),
                "is_reveal": True
            }

        prompt = (
            f"You are a Socratic AI tutor. NEVER give the final answer or solve the problem.\n"
            f"Scenario: {scenario.get('scenario')}\n"
            f"Question: {scenario.get('question')}\n"
            f"Target Points: {scenario.get('expected_reasoning_points')}\n"
            f"Student Draft: {user_draft}\n"
            f"Hint Level: {hint_level} ({titles.get(hint_level, 'Hint')})\n"
            f"Language: {language}\n\n"
            f"Rule for Level 1: Ask a targeted question about what assumptions might be broken.\n"
            f"Rule for Level 2: Offer a vivid physical analogy or system constraint reminder.\n"
            f"Rule for Level 3: Walk through the first prerequisite deduction, leaving the final deduction to the student.\n\n"
            f"Return JSON:\n"
            f"{{\n"
            f"  \"hint_title\": \"{titles.get(hint_level, 'Hint')}\",\n"
            f"  \"hint_text\": \"The Socratic hint message in {language}...\"\n"
            f"}}"
        )

        mock_fallbacks = {
            1: {
                "hint_title": titles[1],
                "hint_text": "Before concluding based on the cycle alone, how many total copies of each resource exist, and are all of them held within the cycle?"
            },
            2: {
                "hint_title": titles[2],
                "hint_text": "Think of a library with 2 copies of a textbook. If 2 students are arguing over one copy, but a 3rd student is about to return the second copy in 5 minutes, is the library permanently paralyzed?"
            },
            3: {
                "hint_title": titles[3],
                "hint_text": "Step 1: Process P3 holds R1 and R2 and is not waiting on anything. What happens immediately when P3 completes execution?"
            }
        }

        res = llm_client.generate_json(prompt, mock_fallback=mock_fallbacks.get(hint_level, mock_fallbacks[1]))
        return {
            "scenario_id": scenario.get("id", ""),
            "hint_level": hint_level,
            "hint_title": res.get("hint_title", titles.get(hint_level, "Hint")),
            "hint_text": res.get("hint_text", mock_fallbacks.get(hint_level, {}).get("hint_text", "")),
            "is_reveal": False
        }

diagnoser_service = DiagnoserService()
