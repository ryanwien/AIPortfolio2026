"""Minimal tool-calling agent loop.

Provider-agnostic by design: the `complete` callable is injected so the harness
can swap models without touching agent logic. Replace the placeholder with a
real client call (Anthropic / OpenAI / local) before use.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable

from .tools import TOOLS, dispatch


@dataclass
class Trace:
    """Full record of one agent run — the unit the eval harness scores."""

    task_id: str
    steps: list[dict[str, Any]] = field(default_factory=list)
    final_answer: str | None = None
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    latency_s: float = 0.0
    terminated_reason: str = "unknown"  # "answered" | "max_steps" | "error"


# A `complete` function takes (messages, tools) and returns a provider-normalized
# dict: {"text": str|None, "tool_calls": [{"name","args"}], "usage": {...}}
CompleteFn = Callable[[list[dict], list[dict]], dict]


def run_agent(
    task_id: str,
    task_prompt: str,
    complete: CompleteFn,
    max_steps: int = 8,
) -> Trace:
    """Run the agent on a single task, returning a complete Trace."""
    trace = Trace(task_id=task_id)
    start = time.time()

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": task_prompt},
    ]

    try:
        for _ in range(max_steps):
            resp = complete(messages, TOOLS)
            trace.total_tokens += resp.get("usage", {}).get("total_tokens", 0)
            trace.total_cost_usd += resp.get("usage", {}).get("cost_usd", 0.0)

            tool_calls = resp.get("tool_calls") or []
            if not tool_calls:
                trace.final_answer = resp.get("text")
                trace.terminated_reason = "answered"
                trace.steps.append({"type": "final", "text": resp.get("text")})
                break

            # Execute each requested tool and feed results back.
            messages.append({"role": "assistant", "tool_calls": tool_calls})
            for call in tool_calls:
                result = dispatch(call["name"], call["args"])
                trace.steps.append(
                    {"type": "tool", "name": call["name"], "args": call["args"], "result": result}
                )
                messages.append(
                    {"role": "tool", "name": call["name"], "content": json.dumps(result)}
                )
        else:
            trace.terminated_reason = "max_steps"
    except Exception as exc:  # noqa: BLE001 - we want to record any failure
        trace.terminated_reason = "error"
        trace.steps.append({"type": "error", "error": repr(exc)})

    trace.latency_s = time.time() - start
    return trace


_SYSTEM_PROMPT = (
    "You are a task-solving agent. Use the available tools when they help. "
    "When you have the answer, respond with text and no tool calls. "
    "Do not fabricate results you could obtain from a tool."
)
