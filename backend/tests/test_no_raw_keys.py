import re
import json
import os
import glob

def test_no_missing_translation_keys_in_frontend():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    locales_dir = os.path.join(root_dir, "frontend", "src", "locales")
    
    with open(os.path.join(locales_dir, "en.json"), "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    # Flatten JSON keys into dot notation
    def flatten_keys(d, prefix=""):
        keys = set()
        for k, v in d.items():
            full_k = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                keys.update(flatten_keys(v, full_k))
            else:
                keys.add(full_k)
        return keys

    en_keys = flatten_keys(en_dict)

    # Scan all frontend tsx and ts files for t('...') or t("...") calls
    src_files = glob.glob(os.path.join(root_dir, "frontend", "src", "**", "*.tsx"), recursive=True)
    src_files += glob.glob(os.path.join(root_dir, "frontend", "src", "**", "*.ts"), recursive=True)

    t_call_pattern = re.compile(r"\bt\(['\"]([a-zA-Z0-9_.]+)['\"]\)")

    missing_keys = []
    for filepath in src_files:
        # Ignore archived legacy folder
        if "advanced" in filepath:
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            matches = t_call_pattern.findall(content)
            for m in matches:
                if m not in en_keys:
                    missing_keys.append((os.path.basename(filepath), m))

    assert len(missing_keys) == 0, f"Found missing translation keys in frontend: {missing_keys}"
