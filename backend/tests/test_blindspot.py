import pytest
from services.bkt_service import BKTService

def test_blindspot_calculation_overconfidence():
    bkt = BKTService()
    # Student was 90% confident but scored 40%
    blindspot = bkt.compute_blindspot(confidence_0_100=90.0, score_0_100=40.0)
    assert blindspot == 50.0, f"Expected +50.0 overconfidence, got {blindspot}"

def test_blindspot_calculation_underconfidence():
    bkt = BKTService()
    # Student was 30% confident but scored 90%
    blindspot = bkt.compute_blindspot(confidence_0_100=30.0, score_0_100=90.0)
    assert blindspot == -60.0, f"Expected -60.0 underconfidence, got {blindspot}"

def test_brier_score_single_perfect():
    bkt = BKTService()
    # 100% confidence, 100% score -> Brier = (1.0 - 1.0)^2 = 0.0
    brier = bkt.compute_brier_score_single(100.0, 100.0)
    assert brier == 0.0

def test_brier_score_single_complete_miscalibration():
    bkt = BKTService()
    # 100% confidence, 0% score -> Brier = (1.0 - 0.0)^2 = 1.0
    brier = bkt.compute_brier_score_single(100.0, 0.0)
    assert brier == 1.0

def test_brier_score_single_realistic():
    bkt = BKTService()
    # 90% confidence, 40% score -> (0.9 - 0.4)^2 = 0.25
    brier = bkt.compute_brier_score_single(90.0, 40.0)
    assert brier == 0.25
