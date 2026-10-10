import random
from typing import Dict, Any, List, Optional
from services.llm_client import llm_client
from services.diagnoser_service import diagnoser_service

class TeachService:
    """
    Confused Student Mode (Learning-by-Teaching / Protégé Effect).
    The AI acts as a student harboring a hidden misconception from the library.
    The learner must identify and correct the error through conversational dialogue.
    A separate judge agent evaluates the pedagogical quality of the learner's explanation.
    """
    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def start_teach_session(self, session_id: str, topic_id: str, concept_name: str, language: str = "en") -> Dict[str, Any]:
        """Pick a hidden misconception and construct opening confused student message."""
        # Pick relevant misconception
        misc_list = diagnoser_service.misconceptions_cache
        chosen_misc = random.choice(misc_list) if misc_list else {
            "id": "MISC-OS-01",
            "name": "Circular Wait Implies Deadlock with Multi-Unit Resources",
            "description": "Believing a cycle always implies deadlock regardless of resource instance count.",
            "error_type": "Oversimplified Rule Application",
            "correction": "Cycles only guarantee deadlock in single-instance systems."
        }

        self.active_sessions[session_id] = {
            "session_id": session_id,
            "topic_id": topic_id,
            "concept_name": concept_name,
            "hidden_misconception": chosen_misc,
            "language": language,
            "turn_count": 0
        }

        # Generate student's opening question holding the misconception
        opening_prompt = (
            f"You are roleplaying as 'Alex', an earnest undergraduate computer science student.\n"
            f"You hold this specific FALSE misconception: '{chosen_misc['name']}: {chosen_misc['description']}'.\n"
            f"Ask your tutor (the user) a question or make a statement exhibiting this false belief, asking for help.\n"
            f"Language: {language}\n"
            f"Keep it under 3 sentences. Do NOT reveal your internal misconception ID or that you are an AI."
        )

        mock_opening = (
            f"Hey! In our lecture today on {concept_name}, I saw that if there is a cycle in the resource graph, "
            f"the system is automatically deadlocked 100% of the time, right? Why would we ever need Banker's algorithm if cycles already tell us everything?"
        )

        opening_text = llm_client.generate_text(opening_prompt, mock_fallback=mock_opening)
        return {
            "session_id": session_id,
            "student_opening_message": opening_text,
            "target_topic": concept_name
        }

    def process_teach_turn(
        self,
        session_id: str,
        user_message: str,
        history: List[Dict[str, str]],
        language: str = "en"
    ) -> Dict[str, Any]:
        """AI student responds, either asking deeper questions or moving toward enlightenment."""
        session = self.active_sessions.get(session_id, {})
        hidden_misc = session.get("hidden_misconception", {
            "name": "Circular Wait Nuance",
            "description": "Cycles imply deadlock",
            "correction": "Multi-instance handles cycles"
        })

        prompt = (
            f"You are roleplaying as Alex, an undergraduate CS student who initially believed:\n"
            f"'{hidden_misc.get('description')}'\n\n"
            f"Your tutor just said:\n\"{user_message}\"\n\n"
            f"Respond naturally as the student:\n"
            f"- If the tutor clearly explained why your belief was flawed with a concrete mechanism/example, express sudden clarity ('Oh! So if another process returns its copy...!') and set student_state to 'enlightened' with is_resolved: true.\n"
            f"- If the tutor gave a vague or incomplete answer, ask a persistent confused follow-up and set student_state to 'questioning'.\n"
            f"Language: {language}\n\n"
            f"Return JSON:\n"
            f"{{\n"
            f"  \"student_reply\": \"Response...\",\n"
            f"  \"student_state\": \"questioning | enlightened | partially_understanding\",\n"
            f"  \"is_resolved\": false\n"
            f"}}"
        )

        mock_fallback = {
            "student_reply": "Wait, but what if there are 2 instances of the resource? Does a cycle still guarantee deadlock then, or can someone else release one?",
            "student_state": "partially_understanding",
            "is_resolved": False
        }

        return llm_client.generate_json(prompt, mock_fallback=mock_fallback)

    def evaluate_teaching(self, session_id: str, chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
        """Judge agent evaluates the pedagogical quality of the user's teaching."""
        session = self.active_sessions.get(session_id, {})
        hidden_misc = session.get("hidden_misconception", {
            "id": "MISC-OS-01",
            "name": "Circular Wait Multi-Unit",
            "description": "Cycle implies deadlock",
            "correction": "Multi-instance cycles can resolve"
        })

        transcript = "\n".join([f"{t.get('sender', 'user')}: {t.get('text', '')}" for t in chat_history])

        prompt = (
            f"You are an expert pedagogical judge assessing a learner's ability to TEACH and remediate misconceptions.\n"
            f"The hidden misconception was: {hidden_misc.get('name')} ({hidden_misc.get('description')})\n"
            f"The correct mental model: {hidden_misc.get('correction')}\n\n"
            f"Dialogue Transcript:\n{transcript}\n\n"
            f"Score the learner:\n"
            f"1. Did they accurately pinpoint the student's core misconception? (true/false)\n"
            f"2. Did they explain the underlying causal mechanism correctly? (true/false)\n"
            f"3. Did they use a clear concrete example or analogy? (true/false)\n"
            f"4. Overall teaching effectiveness score (0-100)\n"
            f"5. Detailed pedagogical feedback.\n\n"
            f"Return JSON:\n"
            f"{{\n"
            f"  \"did_identify_misconception\": true,\n"
            f"  \"did_explain_mechanism\": true,\n"
            f"  \"did_provide_concrete_example\": true,\n"
            f"  \"teaching_score_0_100\": 88.0,\n"
            f"  \"pedagogical_feedback\": \"Excellent Socratic guidance. You guided the student to see the multi-instance exception without lecturing.\"\n"
            f"}}"
        )

        mock_fallback = {
            "did_identify_misconception": True,
            "did_explain_mechanism": True,
            "did_provide_concrete_example": True,
            "teaching_score_0_100": 85.0,
            "pedagogical_feedback": "Great explanation! You targeted the exact flaw in the student's reasoning about resource instance counts."
        }

        eval_res = llm_client.generate_json(prompt, mock_fallback=mock_fallback)
        return {
            "session_id": session_id,
            "hidden_misconception_revealed": hidden_misc,
            "did_identify_misconception": eval_res.get("did_identify_misconception", True),
            "did_explain_mechanism": eval_res.get("did_explain_mechanism", True),
            "did_provide_concrete_example": eval_res.get("did_provide_concrete_example", True),
            "teaching_score_0_100": eval_res.get("teaching_score_0_100", 85.0),
            "pedagogical_feedback": eval_res.get("pedagogical_feedback", mock_fallback["pedagogical_feedback"])
        }

teach_service = TeachService()
