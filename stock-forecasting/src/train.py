"""Train the LSTM forecaster and evaluate it the way that actually matters.

For a forecaster, low MSE is necessary but not sufficient. What matters is whether
the predictions would have *made money* and at what risk. So we report directional
accuracy and a simple long/flat backtest (Sharpe, max drawdown) alongside MSE.

Usage:
    python -m src.train --ticker AAPL --start 2015-01-01 --end 2024-01-01
"""

from __future__ import annotations

import argparse

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset

from src.data import (
    engineer_features,
    fetch_prices,
    make_sequences,
    standardize,
    time_split,
)
from src.model import LSTMConfig, LSTMForecaster


def set_seed(seed: int = 42) -> None:
    torch.manual_seed(seed)
    np.random.seed(seed)


def train_model(train_X, train_y, cfg: LSTMConfig, epochs: int, lr: float, device: str):
    model = LSTMForecaster(cfg).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    loss_fn = torch.nn.MSELoss()

    ds = TensorDataset(torch.from_numpy(train_X), torch.from_numpy(train_y))
    dl = DataLoader(ds, batch_size=64, shuffle=True)  # shuffling windows is fine

    model.train()
    for epoch in range(epochs):
        total = 0.0
        for xb, yb in dl:
            xb, yb = xb.to(device), yb.to(device)
            pred = model(xb)
            loss = loss_fn(pred, yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item() * len(xb)
        if epoch % 5 == 0 or epoch == epochs - 1:
            print(f"epoch {epoch:3d} | train MSE {total/len(ds):.6f}")
    return model


@torch.no_grad()
def evaluate(model, test_X, test_y, device: str) -> dict:
    model.eval()
    preds = model(torch.from_numpy(test_X).to(device)).cpu().numpy()
    actual = test_y

    mse = float(np.mean((preds - actual) ** 2))
    # Directional accuracy: did we get the sign of the move right?
    directional = float(np.mean(np.sign(preds) == np.sign(actual)))

    # Naive long/flat strategy: go long next day iff we predict a positive return.
    strat_returns = np.where(preds > 0, actual, 0.0)
    sharpe = _annualized_sharpe(strat_returns)
    max_dd = _max_drawdown(strat_returns)
    buy_hold = _annualized_sharpe(actual)

    return {
        "mse": round(mse, 6),
        "directional_accuracy": round(directional, 3),
        "strategy_sharpe": round(sharpe, 3),
        "buy_hold_sharpe": round(buy_hold, 3),
        "max_drawdown": round(max_dd, 3),
    }


def _annualized_sharpe(returns: np.ndarray, periods: int = 252) -> float:
    if returns.std() == 0:
        return 0.0
    return float(np.sqrt(periods) * returns.mean() / returns.std())


def _max_drawdown(returns: np.ndarray) -> float:
    equity = np.cumprod(1 + returns)
    peak = np.maximum.accumulate(equity)
    return float(((equity - peak) / peak).min())


def run(args) -> dict:
    set_seed()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    df = fetch_prices(args.ticker, args.start, args.end)
    feats = engineer_features(df)
    X, y, feat_cols = make_sequences(feats, seq_len=args.seq_len)
    (trX, trY), (teX, teY) = time_split(X, y, test_frac=0.2)
    trX, teX, _ = standardize(trX, teX)

    print(f"{args.ticker}: {len(X)} sequences, {len(feat_cols)} features, "
          f"train={len(trX)} test={len(teX)}")

    cfg = LSTMConfig(n_features=len(feat_cols), seq_len=args.seq_len)
    model = train_model(trX, trY, cfg, args.epochs, args.lr, device)
    metrics = evaluate(model, teX, teY, device)

    print("\n--- test metrics ---")
    for k, v in metrics.items():
        print(f"{k:>22}: {v}")
    return metrics


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--ticker", default="AAPL")
    p.add_argument("--start", default="2015-01-01")
    p.add_argument("--end", default="2024-01-01")
    p.add_argument("--seq_len", type=int, default=30)
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--lr", type=float, default=1e-3)
    run(p.parse_args())


if __name__ == "__main__":
    main()
