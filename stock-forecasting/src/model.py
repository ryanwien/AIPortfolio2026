"""LSTM forecaster for financial time series.

Predicts next-step return from a window of engineered features. Kept deliberately
small and regularized — financial series are noisy and overfitting is the default
failure mode, so the architecture errs toward simplicity.
"""

from __future__ import annotations

from dataclasses import dataclass

import torch
import torch.nn as nn


@dataclass
class LSTMConfig:
    n_features: int           # number of input features per timestep
    hidden_size: int = 64
    num_layers: int = 2
    dropout: float = 0.2
    seq_len: int = 30         # lookback window


class LSTMForecaster(nn.Module):
    """Many-to-one LSTM: a sequence of feature vectors -> a single scalar prediction.

    Predicts the next-period *return* (not raw price). Predicting returns avoids
    the trap of a model that looks accurate only because it learned to echo
    yesterday's price.
    """

    def __init__(self, cfg: LSTMConfig):
        super().__init__()
        self.cfg = cfg
        self.lstm = nn.LSTM(
            input_size=cfg.n_features,
            hidden_size=cfg.hidden_size,
            num_layers=cfg.num_layers,
            dropout=cfg.dropout if cfg.num_layers > 1 else 0.0,
            batch_first=True,
        )
        self.head = nn.Sequential(
            nn.Linear(cfg.hidden_size, cfg.hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(cfg.dropout),
            nn.Linear(cfg.hidden_size // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, n_features)
        out, _ = self.lstm(x)
        last = out[:, -1, :]          # take the final timestep's hidden state
        return self.head(last).squeeze(-1)  # (batch,)
