# Eval-First Agent

An agent is easy to demo and hard to trust. This project inverts the usual emphasis: the **evaluation harness is the product**, and the agent is the thing being measured. The deliverable a reviewer should care about is `src/evals/` and the `results/` it produces.

## The idea

Most agent repos show a happy-path screen recording. This one ships:

- A held-out eval set of real tasks (`evals/cases.jsonl`)
- A harness that runs the agent over every case and scores it (`src/evals/harness.py`)
- `pass@k` and cost/latency metrics (`src/evals/metrics.py`)
- A **failure taxonomy** — failures are categorized, not just counted (`src/evals/failure_taxonomy.py`)

The claim being demonstrated is narrow and honest: *I know how agents fail in this domain, and I can quantify it.*

## Pick a domain

The scaffold is domain-agnostic. Before publishing, swap in a domain you actually know — e.g. an agent that answers questions over a specific codebase, navigates a documented API, or operates on a structured dataset. Credibility comes from the eval set reflecting real tasks, so write the cases yourself rather than generating them.

## Layout

```
eval-first-agent/
├── src/
│   ├── agent/
│   │   ├── agent.py          # the agent loop (tool-calling)
│   │   └── tools.py          # tool definitions
│   └── evals/
│       ├── harness.py        # runs agent over all cases, collects traces
│       ├── metrics.py        # pass@k, cost, latency
│       └── failure_taxonomy.py  # classifies failed traces
├── evals/
│   └── cases.jsonl           # the eval set (start with ~50-100 real cases)
└── results/                  # versioned run outputs
```

## Running

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # or your provider of choice
python -m src.evals.harness --cases evals/cases.jsonl --k 3 --out results/
```

## Metrics this reports

- **pass@k** — fraction of cases solved within k attempts. Reported at k=1 and k=3 so the gap between "can do" and "reliably does" is visible.
- **Cost per solved task** — total spend / passes. The number that actually matters in production.
- **p50 / p95 latency** — tail latency is where agents disappoint.
- **Failure breakdown** — % of failures by category (see taxonomy).

## Failure taxonomy

Failures are bucketed so the writeup can say *how* it fails, not just *that* it fails. Starter categories in `failure_taxonomy.py`:

- `wrong_tool` — selected an inappropriate tool
- `tool_error` — tool called with malformed args
- `hallucinated_result` — fabricated an answer instead of using tools
- `gave_up` — terminated without an answer
- `loop` — repeated the same failing action
- `correct_path_wrong_answer` — right approach, wrong final output

## Limitations

- The scaffold ships with placeholder cases; the eval set must be replaced with real domain tasks to be meaningful.
- Scoring uses exact/semantic match on final answers; some domains need rubric-based or LLM-as-judge scoring, which introduces its own validation burden.
- Single-provider by default. Cross-provider comparison is left as an extension.

## What I'd do next

- Add LLM-as-judge scoring with a calibration set to validate the judge against human labels.
- Track per-category failure rates across model versions to detect regressions.
- Add a cost/quality Pareto plot across model tiers.
