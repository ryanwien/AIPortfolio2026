"""Tool definitions and dispatch.

Swap these for tools relevant to your chosen domain. Each tool is (a) declared in
TOOLS for the model and (b) implemented as a Python function registered in _REGISTRY.
Keep the two in sync — a mismatch is a common, silent source of agent failures.
"""

from __future__ import annotations

from typing import Any, Callable

# Schema advertised to the model. Keep names/params aligned with _REGISTRY.
TOOLS: list[dict[str, Any]] = [
    {
        "name": "search",
        "description": "Search the domain corpus for relevant passages.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "calculate",
        "description": "Evaluate a numeric expression. Use instead of doing math yourself.",
        "parameters": {
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"],
        },
    },
]


def _search(query: str) -> dict[str, Any]:
    # Placeholder: wire to your retriever / index for the chosen domain.
    return {"results": [], "note": "replace with real retrieval"}


def _calculate(expression: str) -> dict[str, Any]:
    # Intentionally restricted eval — never use bare eval() on model output.
    import ast
    import operator as op

    ops = {
        ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul,
        ast.Div: op.truediv, ast.Pow: op.pow, ast.USub: op.neg,
    }

    def _eval(node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.BinOp):
            return ops[type(node.op)](_eval(node.left), _eval(node.right))
        if isinstance(node, ast.UnaryOp):
            return ops[type(node.op)](_eval(node.operand))
        raise ValueError("unsupported expression")

    try:
        value = _eval(ast.parse(expression, mode="eval").body)
        return {"value": value}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"could not evaluate: {exc}"}


_REGISTRY: dict[str, Callable[..., dict[str, Any]]] = {
    "search": _search,
    "calculate": _calculate,
}


def dispatch(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Route a tool call to its implementation, returning a structured result."""
    fn = _REGISTRY.get(name)
    if fn is None:
        return {"error": f"unknown tool: {name}"}
    try:
        return fn(**args)
    except TypeError as exc:
        # Malformed args are a real failure mode — surface, don't swallow.
        return {"error": f"bad arguments for {name}: {exc}"}
