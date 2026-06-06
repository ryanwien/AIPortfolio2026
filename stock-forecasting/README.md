# Stock Forecasting (LSTM)

Next-day return forecasting on real market data with a PyTorch LSTM. The point of
this project is not to get rich — it's to do time-series ML *correctly*, where the
easy mistakes (lookahead bias, leaky scaling, evaluating on the wrong metric)
silently produce results that look great and mean nothing.

## What this gets right

- **No lookahead.** Every feature at time *t* uses only data available at or
  before *t*. The only forward-looking column is the label.
- **Chronological split.** The test set is strictly the most recent data — never
  a random shuffle, which would let the model train on the future.
- **Train-only scaling.** Standardization stats are fit on train and applied to
  test, so test statistics don't leak backward.
- **Honest evaluation.** Low MSE isn't the goal. We report directional accuracy
  and a long/flat backtest (annualized Sharpe, max drawdown) **against a
  buy-and-hold benchmark** — because a strategy that can't beat buy-and-hold is
  not a strategy.

## Layout

```
stock-forecasting/
├── src/
│   ├── data.py     # fetch (yfinance) + feature engineering + sequencing + split
│   ├── model.py    # the LSTM forecaster
│   └── train.py    # training loop + financial evaluation
├── data/           # cache (gitignored)
└── results/        # metrics artifacts
```

## Run it

```bash
pip install -r requirements.txt
python -m src.train --ticker AAPL --start 2015-01-01 --end 2024-01-01
```

Data is fetched live from Yahoo Finance via `yfinance`, so this step needs
network access. CPU is fine — the model is deliberately small.

## Features

Eight technical features per timestep: 1-day and 5-day returns, log volume,
price-to-moving-average ratios (5/10/20), 10-day realized volatility, and RSI(14).
All are causal (past-only) by construction.

## A note on expected results

Don't expect high directional accuracy. Daily equity returns are close to
unpredictable from price history alone; numbers near 0.5 are normal and honest.
A portfolio that *claims* 70% next-day directional accuracy almost always has a
leak. The value of this repo is showing you can build the pipeline without one.

## Limitations

- Price/volume features only — no fundamentals, news, or cross-asset signals.
- Single ticker at a time; no portfolio construction or transaction costs.
- The backtest is intentionally naive (long/flat, no costs/slippage) — it's a
  sanity check, not a tradeable strategy.

## What I'd do next

- Add transaction costs and slippage to make the backtest realistic.
- Walk-forward validation (rolling retrain) instead of a single split.
- Compare against simpler baselines (predict-zero, AR(1)) to prove the LSTM earns
  its complexity — often it doesn't, which is itself worth reporting.
