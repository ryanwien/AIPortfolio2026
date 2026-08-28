# AI Portfolio

Five projects across LLM agents, deep learning, NLP, classic ML, and time series.
The throughline is measurement over demos: every project ships with an evaluation
story, documented limitations, and honest notes on what I'd do next. A few
rigorous repos beat many shallow ones.

**Live site: [ryanwien.github.io/Portfolio](https://ryanwien.github.io/Portfolio/)** — the
five projects as a browsable field station, each one showing what it proves, what
was measured, and what it cannot do.

| Project | What it proves | Stack |
|---|---|---|
| [`eval-first-agent/`](./eval-first-agent) | I build agents and, more importantly, measure when they fail | Python, tool-calling, custom eval harness |
| [`transformer-from-scratch/`](./transformer-from-scratch) | I understand model internals, not just the API | PyTorch (no nn.Transformer) |
| [`text-classification/`](./text-classification) | I ship clean ML with real error analysis | scikit-learn |
| [`extraction-benchmark/`](./extraction-benchmark) | I can design a fair benchmark and report it credibly | Python, multi-model scoring |
| [`stock-forecasting/`](./stock-forecasting) | I do time-series ML without lookahead/leakage | PyTorch LSTM, yfinance |

## What's verified

- **transformer-from-scratch** — trained end to end (loss 3.38 -> 1.93).
- **text-classification** — full pipeline + confusion matrix + error analysis run.
- **extraction-benchmark** — runner + scoring execute; regex baseline at 0.80 F1.
- **stock-forecasting** — pipeline + LSTM verified on synthetic data (live runs use yfinance).
- **eval-first-agent** — harness, metrics, and failure taxonomy wired; plug in a provider to run live.

## Reading order

Start with the eval harness in `eval-first-agent` — it's the flagship. The others
are scoped supporting pieces: depth (transformer), applied ML (text-classification),
methodology (extraction-benchmark), and time-series discipline (stock-forecasting).

## Conventions

- Reproducible: pinned deps, deterministic seeds, single-command entry points.
- Results are versioned artifacts, not screenshots.
- Each README ends with "Limitations" and "What I'd do next".
- No secrets in any repo — API keys are read from the environment at runtime.
