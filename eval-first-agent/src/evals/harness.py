"""Eval harness — the centerpiece of this project.

Runs the agent over every case in the eval set, k times each, collects traces,
scores them, classifies failures, and writes a versioned results artifact.

Usage:
    python -m src.evals.harness --cases evals/cases.jsonl --k 3 --out results/
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict
from pathlib import Path

from src.agent.agent import run_agent
from src.evals.failure_taxonomy import classify_failure
from src.evals.metrics import aggregate


def load_cases(path: Path) -> list[dict]:
    """Each line: {"task_id", "prompt", "expected"}."""
    with path.open() as f:
        return [json.loads(line) for line in f if line.strip()]


def score(trace, expected: str) -> bool:
    """Default scorer: normalized exact match on the final answer.

    Replace with semantic match or rubric/LLM-judge for open-ended domains —
    and validate any judge against human labels before trusting it.
    """
    if trace.final_answer is None:
        return False
    return _normalize(trace.final_answer) == _normalize(expected)


def _normalize(s: str) -> str:
    return " ".join(s.lower().split())


def make_complete():
    """Return a provider-normalized completion function.

    Replace the stub below with a real client call. The harness only depends on
    the normalized return shape, so models are swappable here and nowhere else.
    """

    def complete(messages, tools):  # noqa: ARG001
        raise NotImplementedError(
            "Wire make_complete() to your LLM provider. "
            "Return {'text': str|None, 'tool_calls': [...], 'usage': {...}}."
        )

    return complete


def run(cases_path: Path, k: int, out_dir: Path) -> dict:
    cases = load_cases(cases_path)
    complete = make_complete()

    run_records = []
    for case in cases:
        attempts = []
        for attempt_idx in range(k):
            trace = run_agent(case["task_id"], case["prompt"], complete)
            passed = score(trace, case["expected"])
            failure = None if passed else classify_failure(trace)
            attempts.append(
                {
                    "attempt": attempt_idx,
                    "passed": passed,
                    "failure_category": failure,
                    "cost_usd": trace.total_cost_usd,
                    "latency_s": trace.latency_s,
                    "trace": [asdict(trace) if hasattr(trace, "__dataclass_fields__") else trace][0],
                }
            )
        run_records.append({"task_id": case["task_id"], "attempts": attempts})

    summary = aggregate(run_records, k=k)

    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    artifact = out_dir / f"run-{stamp}.json"
    with artifact.open("w") as f:
        json.dump({"summary": summary, "records": run_records}, f, indent=2)

    print(json.dumps(summary, indent=2))
    print(f"\nWrote {artifact}")
    return summary


def main() -> None:
    p = argparse.ArgumentParser(description="Run the agent eval harness.")
    p.add_argument("--cases", type=Path, default=Path("evals/cases.jsonl"))
    p.add_argument("--k", type=int, default=3, help="attempts per case (for pass@k)")
    p.add_argument("--out", type=Path, default=Path("results/"))
    args = p.parse_args()
    run(args.cases, args.k, args.out)


if __name__ == "__main__":
    main()
