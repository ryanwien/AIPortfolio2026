"""Data pipeline for stock forecasting.

Fetches OHLCV via yfinance, engineers features, and builds sequences with a
strict time-ordered split. The cardinal rule here is NO LOOKAHEAD: every feature
at time t uses only information available at or before t, and the train/test split
is chronological, never shuffled.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def fetch_prices(ticker: str, start: str, end: str) -> pd.DataFrame:
    """Download daily OHLCV. Requires network access to Yahoo Finance.

    Run this on your machine; sandboxes without outbound access can't reach Yahoo.
    """
    import yfinance as yf

    df = yf.download(
        ticker, start=start, end=end, interval="1d",
        auto_adjust=True, progress=False,
    )
    if df.empty:
        raise ValueError(f"No data returned for {ticker} in {start}..{end}")
    # yfinance may return a column MultiIndex for a single ticker; flatten it.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical features. Each row uses only past/current data."""
    out = pd.DataFrame(index=df.index)
    close = df["Close"]

    out["return_1d"] = close.pct_change()
    out["return_5d"] = close.pct_change(5)
    out["log_volume"] = np.log1p(df["Volume"])

    # Moving averages and the price's position relative to them.
    for w in (5, 10, 20):
        ma = close.rolling(w).mean()
        out[f"ma_ratio_{w}"] = close / ma - 1.0

    # Rolling volatility (risk regime).
    out["volatility_10d"] = out["return_1d"].rolling(10).std()

    # RSI(14): classic momentum oscillator.
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    out["rsi_14"] = 100 - 100 / (1 + rs)

    # Target: NEXT day's return. shift(-1) is the only forward-looking column,
    # and it's the label — never used as an input feature.
    out["target"] = out["return_1d"].shift(-1)

    return out.dropna()


def make_sequences(
    features: pd.DataFrame, seq_len: int, target_col: str = "target"
):
    """Turn a feature frame into (X, y) sequence tensors.

    X[i] is the window of `seq_len` rows ending at i; y[i] is that row's target.
    """
    feat_cols = [c for c in features.columns if c != target_col]
    values = features[feat_cols].to_numpy(dtype=np.float32)
    targets = features[target_col].to_numpy(dtype=np.float32)

    X, y = [], []
    for i in range(seq_len, len(features)):
        X.append(values[i - seq_len : i])
        y.append(targets[i - 1])  # target aligned to the window's last row
    return np.asarray(X), np.asarray(y), feat_cols


def time_split(X, y, test_frac: float = 0.2):
    """Chronological split — the test set is strictly the most recent data."""
    n_test = int(len(X) * test_frac)
    n_train = len(X) - n_test
    return (X[:n_train], y[:n_train]), (X[n_train:], y[n_train:])


def standardize(train_X, test_X):
    """Fit scaling on TRAIN ONLY, then apply to both. Fitting on test leaks."""
    mean = train_X.reshape(-1, train_X.shape[-1]).mean(axis=0)
    std = train_X.reshape(-1, train_X.shape[-1]).std(axis=0) + 1e-8
    return (train_X - mean) / std, (test_X - mean) / std, (mean, std)
