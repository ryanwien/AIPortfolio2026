"""Model adapters for the benchmark.

Each model exposes the same interface — `extract(text) -> dict[field, value]` —
so the runner is model-agnostic. Add real provider calls in the marked spots.
A trivial regex baseline is included so the harness produces real numbers out of
the box and so every LLM has a non-trivial floor to beat.
"""

from __future__ import annotations

import re
from typing import Protocol


# Fields this benchmark extracts. Tailor to the domain you know.
TARGET_FIELDS = ["invoice_number", "date", "total_amount", "vendor"]


class Model(Protocol):
    name: str

    def extract(self, text: str) -> dict: ...


class RegexBaseline:
    """A deliberately simple baseline. If an LLM can't beat this, that's a finding."""

    name = "regex-baseline"

    def extract(self, text: str) -> dict:
        out: dict[str, str | None] = {f: None for f in TARGET_FIELDS}
        if m := re.search(r"\b(?:invoice|inv)[#\s:]*([A-Z0-9-]+)", text, re.I):
            out["invoice_number"] = m.group(1)
        if m := re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text):
            out["date"] = m.group(1)
        if m := re.search(r"\$?\s?([0-9][0-9,]*\.\d{2})", text):
            out["total_amount"] = m.group(1).replace(",", "")
        return out


class LLMExtractor:
    """Adapter for an LLM with structured-output prompting.

    Fill in `_call` with your provider. Prompt the model to return JSON with
    exactly TARGET_FIELDS keys, parse defensively, and never trust the model to
    return valid JSON without a fallback.
    """

    def __init__(self, name: str, model_id: str):
        self.name = name
        self.model_id = model_id

    def extract(self, text: str) -> dict:
        raw = self._call(self._prompt(text))
        return self._parse(raw)

    def _prompt(self, text: str) -> str:
        fields = ", ".join(TARGET_FIELDS)
        return (
            f"Extract these fields as JSON ({fields}). "
            f"Use null for anything not present. Return only JSON.\n\n{text}"
        )

    def _call(self, prompt: str) -> str:  # noqa: ARG002
        raise NotImplementedError(
            f"Wire LLMExtractor._call to your provider for model_id={self.model_id!r}."
        )

    def _parse(self, raw: str) -> dict:
        import json

        out = {f: None for f in TARGET_FIELDS}
        try:
            data = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
            for f in TARGET_FIELDS:
                out[f] = data.get(f)
        except (json.JSONDecodeError, ValueError):
            pass  # malformed output is itself a measurable failure
        return out


# Registry. Uncomment / add real models once adapters are wired.
MODELS: dict[str, Model] = {
    "regex-baseline": RegexBaseline(),
    # "model-a": LLMExtractor("model-a", "provider-model-id"),
    # "model-b": LLMExtractor("model-b", "provider-model-id"),
}


def get_model(name: str) -> Model:
    if name not in MODELS:
        raise KeyError(f"unknown model {name!r}; available: {list(MODELS)}")
    return MODELS[name]
