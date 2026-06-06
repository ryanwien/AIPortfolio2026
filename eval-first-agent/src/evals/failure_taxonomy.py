"""Failure taxonomy.

Turns a failed trace into a single category so the writeup can report *how* the
agent fails, not just the pass rate. These are heuristics over the trace — refine
them for your domain, and consider hand-labeling a sample to check their accuracy.
"""

from __future__ import annotations

# Canonical categories. Keep this list short and meaningful.
CATEGORIES = (
    "wrong_tool",                 # picked an inappropriate tool
    "tool_error",                 # tool called with malformed args
    "hallucinated_result",        # answered without using available tools
    "gave_up",                    # terminated with no answer
    "loop",                       # repeated the same failing action
    "correct_path_wrong_answer",  # right approach, wrong final output
    "max_steps",                  # ran out of steps mid-task
    "runtime_error",              # exception during the run
    "unclassified",               # heuristics didn't match — review manually
)


def classify_failure(trace) -> str:
    steps = trace.steps

    if trace.terminated_reason == "error":
        return "runtime_error"
    if trace.terminated_reason == "max_steps":
        # Distinguish "stuck in a loop" from "just slow".
        return "loop" if _has_repeated_action(steps) else "max_steps"
    if trace.final_answer is None:
        return "gave_up"

    tool_steps = [s for s in steps if s.get("type") == "tool"]
    if not tool_steps:
        # Produced an answer but never consulted a tool — suspicious for
        # tool-dependent tasks.
        return "hallucinated_result"
    if any("error" in (s.get("result") or {}) for s in tool_steps):
        return "tool_error"
    if _has_repeated_action(steps):
        return "loop"

    # Reached the end, used tools, no obvious mechanical fault — the model just
    # got the answer wrong.
    return "correct_path_wrong_answer"


def _has_repeated_action(steps) -> bool:
    seen = set()
    for s in steps:
        if s.get("type") != "tool":
            continue
        key = (s.get("name"), str(s.get("args")))
        if key in seen:
            return True
        seen.add(key)
    return False
