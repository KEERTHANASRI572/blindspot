from typing import Dict, Any, List, Optional
from services.llm_client import llm_client

class VivaService:
    """
    Viva Simulator: Simulates a rigorous university oral defense exam.
    Escalates adversarial inquiry based on student responses, probing
    underlying conceptual models and producing a structured Viva Report.
    """
    def __init__(self):
        self.viva_sessions: Dict[str, Dict[str, Any]] = {}

    def start_viva(self, viva_session_id: str, topic_id: str, topic_title: str, language: str = "en") -> Dict[str, Any]:
        """Initialize viva defense session and ask opening inquiry."""
        opening_questions = {
            "topic-deadlock": "Welcome candidate. Let's begin: If a database transaction encounters a deadlock cycle, why can't we simply resolve it by increasing CPU thread priority for all involved workers?",
            "topic-db-indexing": "Welcome. Let's look at index structures: Explain why a B+ Tree index on (dept_id, employee_id) cannot be used efficiently for a query filtering only WHERE employee_id = 42.",
            "topic-tcp-udp": "Welcome. If packet loss occurs on a TCP connection, explain why receiving 3 duplicate ACKs triggers Fast Retransmit instead of waiting for the RTO timer."
        }

        first_q = opening_questions.get(topic_id, f"Welcome to your oral viva on {topic_title}. In your own words, describe the primary failure mode of this system and what assumptions engineers usually get wrong.")
        
        self.viva_sessions[viva_session_id] = {
            "session_id": viva_session_id,
            "topic_id": topic_id,
            "topic_title": topic_title,
            "language": language,
            "question_index": 1,
            "total_questions": 3,
            "transcript": [{"question": first_q, "answer": None, "feedback": None}]
        }

        return {
            "viva_session_id": viva_session_id,
            "question_index": 1,
            "total_questions": 3,
            "examiner_question": first_q,
            "examiner_tone": "probing",
            "is_finished": False
        }

    def process_viva_turn(
        self,
        viva_session_id: str,
        user_answer: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Evaluate candidate's answer and produce escalating follow-up or report."""
        session = self.viva_sessions.get(viva_session_id, {})
        q_idx = session.get("question_index", 1)
        total_q = session.get("total_questions", 3)
        topic_title = session.get("topic_title", "Computer Science")

        # Save student answer
        if session.get("transcript"):
            session["transcript"][-1]["answer"] = user_answer

        if q_idx >= total_q:
            session["question_index"] = total_q + 1
            return {
                "viva_session_id": viva_session_id,
                "question_index": total_q,
                "total_questions": total_q,
                "examiner_question": "Exam completed. Calculating your Viva Defense Report...",
                "examiner_tone": "satisfied",
                "is_finished": True
            }

        # Generate escalating follow-up question
        prev_q = session["transcript"][-1]["question"]
        prompt = (
            f"You are an experienced external University Examiner conducting an oral viva on {topic_title}.\n"
            f"Previous Question: {prev_q}\n"
            f"Candidate's Oral Answer: \"{user_answer}\"\n"
            f"Question {q_idx + 1} of {total_q}.\n"
            f"Language: {language}\n\n"
            f"Tasks:\n"
            f"1. Formulate a sharp, adversarial follow-up question that challenges an assumption or edge case in their answer (e.g. 'What if X fails?', 'Give a counterexample', 'Why does that hold under high concurrency?').\n"
            f"2. Assess tone ('probing' or 'skeptical').\n"
            f"Return JSON format:\n"
            f"{{\n"
            f"  \"examiner_question\": \"Sharply targeted follow-up question in {language}...\",\n"
            f"  \"examiner_tone\": \"skeptical\",\n"
            f"  \"quick_assessment\": \"Good identification of locks, but missed thread scheduling dynamics.\"\n"
            f"}}"
        )

        mock_fallback = {
            "examiner_question": f"Interesting. But what happens if the operating system dynamically preempts one of the resources? Does that violate Coffman's conditions, and what is the computational cost of doing so?",
            "examiner_tone": "skeptical",
            "quick_assessment": "Partially sound, escalating to preemption invariants."
        }

        res = llm_client.generate_json(prompt, mock_fallback=mock_fallback)
        next_q = res.get("examiner_question", mock_fallback["examiner_question"])
        session["question_index"] = q_idx + 1
        session["transcript"].append({"question": next_q, "answer": None, "feedback": res.get("quick_assessment")})

        return {
            "viva_session_id": viva_session_id,
            "question_index": q_idx + 1,
            "total_questions": total_q,
            "examiner_question": next_q,
            "examiner_tone": res.get("examiner_tone", "probing"),
            "previous_eval_summary": res.get("quick_assessment"),
            "is_finished": False
        }

    def generate_viva_report(self, viva_session_id: str) -> Dict[str, Any]:
        """Synthesize final Viva Defense Report."""
        session = self.viva_sessions.get(viva_session_id, {})
        transcript_text = "\n".join([
            f"Q: {t.get('question')}\nA: {t.get('answer')}"
            for t in session.get("transcript", []) if t.get("answer")
        ])

        prompt = (
            f"You are the Chief Examiner grading this candidate's Oral Viva defense.\n"
            f"Topic: {session.get('topic_title')}\n"
            f"Full Viva Transcript:\n{transcript_text}\n\n"
            f"Provide a comprehensive Viva Assessment Report:\n"
            f"1. Overall Grade ('Distinction' | 'Pass with Merit' | 'Pass' | 'Needs Revision')\n"
            f"2. Overall Score (0-100)\n"
            f"3. 2-3 Core Strengths demonstrated\n"
            f"4. 2-3 Critical Blindspots or hand-waving instances\n"
            f"5. 3 specific actionable revision recommendations\n"
            f"6. 2-sentence summary transcript.\n\n"
            f"Return JSON:\n"
            f"{{\n"
            f"  \"overall_grade\": \"Pass with Merit\",\n"
            f"  \"overall_score_0_100\": 82.0,\n"
            f"  \"strengths\": [\"Clear mental model of resource allocation graphs\", \"Good grasp of lock contention\"],\n"
            f"  \"critical_blindspots\": [\"Equated high thread priority with mutual exclusion resolution\"],\n"
            f"  \"three_action_revisions\": [\"Review Banker's algorithm safe sequence matrix\", \"Differentiate single-instance vs multi-instance cycles\", \"Practice trace diagrams on race conditions\"],\n"
            f"  \"transcript_summary\": \"Strong foundational grasp with slight overconfidence in concurrency edge cases.\"\n"
            f"}}"
        )

        mock_fallback = {
            "overall_grade": "Pass with Merit",
            "overall_score_0_100": 80.0,
            "strengths": ["Understands basic Coffman conditions", "Clear verbal articulation of deadlock states"],
            "critical_blindspots": ["Overlooked multi-instance resource cycle resolution nuance"],
            "three_action_revisions": [
                "Review multi-instance Resource Allocation Graph evaluation",
                "Revisit Banker's algorithm state transition verification",
                "Study lock ordering protocols in real databases"
            ],
            "transcript_summary": "Candidate demonstrated solid grasp of core theory but hesitated when pressed on multi-unit resource allocation dynamics."
        }

        report = llm_client.generate_json(prompt, mock_fallback=mock_fallback)
        return {
            "viva_session_id": viva_session_id,
            "overall_grade": report.get("overall_grade", "Pass with Merit"),
            "overall_score_0_100": report.get("overall_score_0_100", 80.0),
            "strengths": report.get("strengths", mock_fallback["strengths"]),
            "critical_blindspots": report.get("critical_blindspots", mock_fallback["critical_blindspots"]),
            "three_action_revisions": report.get("three_action_revisions", mock_fallback["three_action_revisions"]),
            "transcript_summary": report.get("transcript_summary", mock_fallback["transcript_summary"])
        }

viva_service = VivaService()
