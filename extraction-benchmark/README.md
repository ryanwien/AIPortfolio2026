# Extraction Benchmark

A small, rigorous benchmark for **structured extraction** — pulling typed fields
out of messy text. Benchmarks get shared and cited, so the credibility here comes
from a defensible methodology, not a leaderboard-topping score.

The example task is invoice field extraction; swap in a domain you actually know,
because the value of the benchmark is in the quality and realism of the eval set.

## What's here

```
extraction-benchmark/
├── src/
│   ├── run_benchmark.py   # runs all models, scores, writes results table
│   ├── models.py          # model adapters (regex baseline + LLM slots)
│   └── scoring.py         # field-level F1, exact match, normalization
├── data/
│   └── eval_set.jsonl     # gold-labeled examples (start small, hand-label)
└── results/               # versioned result artifacts
```

## Run it

```bash
pip install -r requirements.txt
python -m src.run_benchmark --data data/eval_set.jsonl --models all --out results/
```

Out of the box this runs a **regex baseline** so the harness produces real numbers
immediately. Wire real models in `models.py` (`LLMExtractor._call`) to compare them.

Sample output:

```
model                     field_F1     exact     p50_s
------------------------------------------------------
regex-baseline               0.800     0.000     0.000
```

## Methodology (the part reviewers scrutinize)

- **Field-level F1** is the headline metric — partial credit per field, computed
  from precision/recall over correctly extracted fields.
- **Exact match** is reported alongside as a stricter view: did the *entire*
  record match? The gap between the two is informative.
- **Normalization is explicit** (`scoring.py`): case, whitespace, currency symbols
  and thousands separators are normalized so "$1,250.00" == "1250.00". This is
  documented because silent normalization choices are how benchmarks mislead.
- **A non-trivial baseline** (regex) gives every model a floor to beat. A model
  that can't beat regex on this task is itself a result worth reporting.

## Limitations

- The shipped eval set is 3 illustrative examples. A credible benchmark needs
  50+ hand-labeled, realistic cases — generating them with an LLM defeats the point.
- Single annotator. For a public benchmark, a second annotator and an inter-annotator
  agreement number would strengthen it.
- Exact/normalized matching can be too strict for free-text fields like vendor
  names; a fuzzy-match variant is noted below.

## What I'd do next

- Expand to 50–100 hand-labeled real documents and report a confidence interval.
- Add fuzzy matching for name-like fields and report both strict and fuzzy F1.
- Add cost-per-document so the quality/cost tradeoff across models is visible.
