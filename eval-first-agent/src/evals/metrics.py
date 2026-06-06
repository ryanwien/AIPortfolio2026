"""Aggregate metrics from run records: pass@k, cost-per-solved, latency tails."""

from __future__ import annotations

from collections import Counter


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    idx = min(len(s) - 1, int(round((pct / 100.0) * (len(s) - 1))))
    return s[idx]


def aggregate(run_records: list[dict], k: int) -> dict:
    n_cases = len(run_records)
    pass_at_1 = 0
    pass_at_k = 0
    total_cost = 0.0
    solved_cost = 0.0
    latencies: list[float] = []
    failure_counts: Counter = Counter()

    for rec in run_records:
        attempts = rec["attempts"]
        first_passed = attempts[0]["passed"] if attempts else False
        any_passed = any(a["passed"] for a in attempts)

        pass_at_1 += int(first_passed)
        pass_at_k += int(any_passed)

        for a in attempts:
            total_cost += a["cost_usd"]
            latencies.append(a["latency_s"])
            if a["passed"]:
                solved_cost += a["cost_usd"]
            elif a["failure_category"]:
                failure_counts[a["failure_category"]] += 1

    n_solved = pass_at_k or 1  # avoid div-by-zero
    return {
        "n_cases": n_cases,
        "k": k,
        "pass@1": round(pass_at_1 / n_cases, 3) if n_cases else 0.0,
        f"pass@{k}": round(pass_at_k / n_cases, 3) if n_cases else 0.0,
        "total_cost_usd": round(total_cost, 4),
        "cost_per_solved_usd": round(solved_cost / n_solved, 4),
        "latency_p50_s": round(_percentile(latencies, 50), 3),
        "latency_p95_s": round(_percentile(latencies, 95), 3),
        "failure_breakdown": dict(failure_counts.most_common()),
    }
