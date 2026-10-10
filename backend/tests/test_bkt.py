import pytest
from services.bkt_service import BKTService

def test_bkt_correct_answer_increases_mastery():
    bkt = BKTService(p_init=0.30, p_learn=0.20, p_slip=0.10, p_guess=0.15)
    prev = 0.30
    updated = bkt.update_bkt(prev, score_0_100=90.0, hints_used=0)
    assert updated > prev, "Correct answer must increase p_known"
    assert updated >= 0.50, f"Expected mastery >= 0.50, got {updated}"

def test_bkt_incorrect_answer_decreases_mastery():
    bkt = BKTService(p_init=0.60, p_learn=0.20, p_slip=0.10, p_guess=0.15)
    prev = 0.60
    updated = bkt.update_bkt(prev, score_0_100=20.0, hints_used=0)
    assert updated < prev, "Incorrect answer must decrease p_known"

def test_bkt_hint_discount():
    bkt = BKTService(p_init=0.40, p_learn=0.20, p_slip=0.10, p_guess=0.15)
    score = 80.0
    mastery_no_hints = bkt.update_bkt(0.40, score, hints_used=0)
    mastery_with_hints = bkt.update_bkt(0.40, score, hints_used=3)
    assert mastery_with_hints < mastery_no_hints, "Using hints must discount mastery gain"

def test_bkt_prerequisite_propagation():
    bkt = BKTService()
    concept_map = {"c-prereq": 0.80, "c-target": 0.30, "c-unrelated": 0.75}
    edges = [{"from": "c-prereq", "to": "c-target", "type": "prerequisite_of"}]
    
    updated = bkt.propagate_prerequisite_penalty("c-target", concept_map, edges, decay_factor=0.10)
    assert updated["c-prereq"] < 0.80, "Prerequisite concept should receive decay when target fails"
    assert updated["c-unrelated"] == 0.75, "Unrelated concept should not receive decay"
