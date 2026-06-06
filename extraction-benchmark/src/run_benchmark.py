"""Structured-extraction benchmark runner.

Runs each model in the registry over the eval set, scores predictions field-by-field
against gold annotations, and writes a versioned results table. Designed so a
reader can reproduce the numbers and trust the methodology.

Usage:
    python -m src.run_benchmark --data data/eval_set.jsonl --models all --out results/
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from src.models import MODELS, get_model
from src.scoring import score_record, summarize


def load_eval_set(path: Path) -> list[dict]:
    """Each line: {"id", "input", "gold": {field: value, ...}}."""
    with path.open() as f:
        return [json.loads(line) for line in f if line.strip()]


def run(data_path: Path, model_names: list[str], out_dir: Path) -> dict:
    examples = load_eval_set(data_path)
    all_results: dict[str, list[dict]] = {}

    for name in model_names:
        model = get_model(name)
        per_example = []
        for ex in examples:
            t0 = time.time()
            pred = model.extract(ex["input"])           # -> dict[field, value]
            latency = time.time() - t0
            scored = score_record(pred, ex["gold"])
            per_example.append(
                {"id": ex["id"], "pred": pred, "scores": scored, "latency_s": latency}
            )
        all_results[name] = per_example

    summary = {name: summarize(recs) for name, recs in all_results.items()}

    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    artifact = out_dir / f"benchmark-{stamp}.json"
    with artifact.open("w") as f:
        json.dump({"summary": summary, "raw": all_results}, f, indent=2)

    _print_table(summary)
    print(f"\nWrote {artifact}")
    return summary


def _print_table(summary: dict) -> None:
    print(f"\n{'model':<24}{'field_F1':>10}{'exact':>10}{'p50_s':>10}")
    print("-" * 54)
    for name, s in summary.items():
        print(f"{name:<24}{s['field_f1']:>10.3f}{s['exact_match']:>10.3f}{s['latency_p50_s']:>10.3f}")


def main() -> None:
    p = argparse.ArgumentParser(description="Run the extraction benchmark.")
    p.add_argument("--data", type=Path, default=Path("data/eval_set.jsonl"))
    p.add_argument("--models", default="all", help="'all' or comma-separated names")
    p.add_argument("--out", type=Path, default=Path("results/"))
    args = p.parse_args()

    names = list(MODELS) if args.models == "all" else args.models.split(",")
    run(args.data, names, args.out)


if __name__ == "__main__":
    main()
