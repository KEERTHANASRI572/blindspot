import json
import os
import pytest

def get_nested_keys(d, prefix=""):
    keys = set()
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_nested_keys(v, full_key))
        else:
            keys.add(full_key)
    return keys

def test_i18n_key_parity():
    locales_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "locales"))
    
    en_path = os.path.join(locales_dir, "en.json")
    ta_path = os.path.join(locales_dir, "ta.json")
    hi_path = os.path.join(locales_dir, "hi.json")

    assert os.path.exists(en_path), "en.json must exist"
    assert os.path.exists(ta_path), "ta.json must exist"
    assert os.path.exists(hi_path), "hi.json must exist"

    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    with open(ta_path, "r", encoding="utf-8") as f:
        ta_data = json.load(f)
    with open(hi_path, "r", encoding="utf-8") as f:
        hi_data = json.load(f)

    en_keys = get_nested_keys(en_data)
    ta_keys = get_nested_keys(ta_data)
    hi_keys = get_nested_keys(hi_data)

    missing_in_ta = en_keys - ta_keys
    extra_in_ta = ta_keys - en_keys
    missing_in_hi = en_keys - hi_keys
    extra_in_hi = hi_keys - en_keys

    assert not missing_in_ta, f"Missing keys in ta.json: {missing_in_ta}"
    assert not extra_in_ta, f"Extra keys in ta.json: {extra_in_ta}"
    assert not missing_in_hi, f"Missing keys in hi.json: {missing_in_hi}"
    assert not extra_in_hi, f"Extra keys in hi.json: {extra_in_hi}"
    
    assert en_keys == ta_keys == hi_keys, "All language dictionaries must have 100% exact key parity"
    print(f"\n✅ All {len(en_keys)} translation keys match with 100% parity across English, Tamil, and Hindi!")
