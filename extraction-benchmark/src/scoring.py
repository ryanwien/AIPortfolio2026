"""Scoring for structured extraction.

Two complementary metrics:
  - field-level F1: partial credit per field, the headline number
  - exact match: did the whole record match? a stricter, honest second view

Normalization is explicit and documented so the scoring is reproducible and the
methodology is defensible — the part of a benchmark people actually scrutinize.
"""

from __future__ import annotations

import re


def _normalize(value) -> str | None:
    if value is None:
        return None
    s = str(value).strip().lower()
    s = re.sub(r"\s+", " ", s)
    # Treat "1234.00" and "$1,234.00" as equal for amount-like fields.
    s = s.replace("$", "").replace(",", "")
    return s


def score_record(pred: dict, gold: dict) -> dict:
    """Per-field correctness for one example."""
    fields = {}
    for field, gold_val in gold.items():
        p = _normalize(pred.get(field))
        g = _normalize(gold_val)
        fields[field] = {
            "correct": p == g,
            # Distinguish "wrong value" from "missed entirely" — useful in the writeup.
            "predicted_present": p is not None,
            "gold_present": g is not None,
        }
    return fields


def summarize(records: list[dict]) -> dict:
    """Aggregate per-example scores into headline metrics for one model."""
    tp = fp = fn = 0
    exact = 0
    latencies = []

    for rec in records:
        scores = rec["scores"]
        all_correct = True
        for f in scores.values():
            if f["gold_present"] and f["predicted_present"]:
                tp += int(f["correct"])
                fp += int(not f["correct"])
            elif f["predicted_present"] and not f["gold_present"]:
                fp += 1
            elif f["gold_present"] and not f["predicted_present"]:
                fn += 1
            if not f["correct"]:
                all_correct = False
        exact += int(all_correct)
        latencies.append(rec.get("latency_s", 0.0))

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    return {
        "field_f1": round(f1, 3),
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "exact_match": round(exact / len(records), 3) if records else 0.0,
        "latency_p50_s": round(_p50(latencies), 3),
        "n": len(records),
    }


def _p50(xs: list[float]) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    return s[len(s) // 2]
