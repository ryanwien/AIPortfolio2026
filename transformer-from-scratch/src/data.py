"""Character-level data utilities for training the from-scratch GPT.

Deliberately tiny: a character vocab over a single text file. This keeps the
project reproducible on a laptop while still exercising the full training loop.
"""

from __future__ import annotations

from pathlib import Path

import torch


class CharDataset:
    def __init__(self, text: str, block_size: int):
        chars = sorted(set(text))
        self.stoi = {c: i for i, c in enumerate(chars)}
        self.itos = {i: c for c, i in self.stoi.items()}
        self.vocab_size = len(chars)
        self.block_size = block_size
        self.data = torch.tensor([self.stoi[c] for c in text], dtype=torch.long)

    @classmethod
    def from_file(cls, path: str | Path, block_size: int) -> "CharDataset":
        return cls(Path(path).read_text(encoding="utf-8"), block_size)

    def get_batch(self, batch_size: int, device: str = "cpu"):
        # Sample random windows of length block_size; targets are inputs shifted by 1.
        ix = torch.randint(len(self.data) - self.block_size - 1, (batch_size,))
        x = torch.stack([self.data[i : i + self.block_size] for i in ix])
        y = torch.stack([self.data[i + 1 : i + 1 + self.block_size] for i in ix])
        return x.to(device), y.to(device)

    def decode(self, idx) -> str:
        return "".join(self.itos[int(i)] for i in idx)
