import pytest
from services.diagnoser_service import DiagnoserService

def test_socratic_hint_levels():
    diagnoser = DiagnoserService()
    scenario = {
        "id": "scen-test",
        "scenario": "Two processes acquire mutexes in reverse order.",
        "question": "Will they deadlock?",
        "expected_reasoning_points": ["Identify circular wait", "Check lock acquisition order"]
    }

    # Level 1 should be a guiding question, NOT a reveal
    hint1 = diagnoser.generate_socratic_hint(scenario, hint_level=1)
    assert hint1["hint_level"] == 1
    assert hint1["is_reveal"] is False
    assert len(hint1["hint_text"]) > 10

    # Level 2 should be an analogy/nudge
    hint2 = diagnoser.generate_socratic_hint(scenario, hint_level=2)
    assert hint2["hint_level"] == 2
    assert hint2["is_reveal"] is False

    # Level 4 should be final reveal
    hint4 = diagnoser.generate_socratic_hint(scenario, hint_level=4)
    assert hint4["hint_level"] == 4
    assert hint4["is_reveal"] is True
    assert "Full Solution" in hint4["hint_text"]
