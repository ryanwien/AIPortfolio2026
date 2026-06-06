"""Training loop for the from-scratch GPT.

Single-file, runnable on CPU for a tiny corpus. Demonstrates the full path:
data -> batches -> forward/loss -> backward -> step -> eval -> sample.

Usage:
    python -m src.train --data path/to/corpus.txt --steps 2000
"""

from __future__ import annotations

import argparse
from pathlib import Path

import torch

from src.data import CharDataset
from src.model import GPT, Config


def set_seed(seed: int = 1337) -> None:
    torch.manual_seed(seed)


@torch.no_grad()
def estimate_loss(model, dataset, batch_size, device, iters=20):
    model.eval()
    losses = torch.zeros(iters)
    for i in range(iters):
        x, y = dataset.get_batch(batch_size, device)
        _, loss = model(x, y)
        losses[i] = loss.item()
    model.train()
    return losses.mean().item()


def train(args) -> None:
    set_seed()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    dataset = CharDataset.from_file(args.data, block_size=args.block_size)
    cfg = Config(
        vocab_size=dataset.vocab_size,
        block_size=args.block_size,
        n_layer=args.n_layer,
        n_head=args.n_head,
        n_embd=args.n_embd,
    )
    model = GPT(cfg).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"device={device}  params={n_params/1e6:.2f}M  vocab={dataset.vocab_size}")

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr)

    for step in range(args.steps):
        x, y = dataset.get_batch(args.batch_size, device)
        _, loss = model(x, y)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()

        if step % args.eval_every == 0 or step == args.steps - 1:
            val = estimate_loss(model, dataset, args.batch_size, device)
            print(f"step {step:5d} | train {loss.item():.3f} | est {val:.3f}")

    # Sample to eyeball that it learned something.
    ctx = torch.zeros((1, 1), dtype=torch.long, device=device)
    out = model.generate(ctx, max_new_tokens=300, temperature=0.8)[0]
    print("\n--- sample ---")
    print(dataset.decode(out))

    if args.save:
        Path(args.save).parent.mkdir(parents=True, exist_ok=True)
        torch.save({"model": model.state_dict(), "cfg": cfg.__dict__}, args.save)
        print(f"\nsaved checkpoint to {args.save}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True, help="path to a .txt corpus")
    p.add_argument("--steps", type=int, default=2000)
    p.add_argument("--batch_size", type=int, default=32)
    p.add_argument("--block_size", type=int, default=128)
    p.add_argument("--n_layer", type=int, default=4)
    p.add_argument("--n_head", type=int, default=4)
    p.add_argument("--n_embd", type=int, default=128)
    p.add_argument("--lr", type=float, default=3e-4)
    p.add_argument("--eval_every", type=int, default=200)
    p.add_argument("--save", default="checkpoints/model.pt")
    train(p.parse_args())


if __name__ == "__main__":
    main()
