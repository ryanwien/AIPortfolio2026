# Transformer From Scratch

A decoder-only (GPT-style) transformer implemented from first principles in
PyTorch — no `nn.Transformer`, no high-level wrappers. The point is to show the
mechanics are understood, not assembled.

## What's here

```
transformer-from-scratch/
├── src/
│   ├── model.py     # the transformer: attention, MLP, blocks, GPT
│   ├── data.py      # char-level dataset + batching
│   └── train.py     # full training loop with eval + sampling
└── notebooks/
    └── walkthrough.md   # annotated explanation of each component
```

Every non-obvious decision is commented in `model.py`: why scaled dot-product
attention divides by √d, why the mask makes it a decoder, why pre-norm over
post-norm, and why the input embedding is tied to the output projection.

## Run it

```bash
pip install -r requirements.txt
# any plain-text file works; a few hundred KB is plenty for a demo
python -m src.train --data data/corpus.txt --steps 2000
```

On CPU with the default tiny config (~0.5M params) this trains in a few minutes
and produces coherent character-level samples — enough to prove the loop works
end to end. Bump `--n_layer/--n_head/--n_embd` if you have a GPU.

## What this demonstrates

- Multi-head causal self-attention written out by hand, including the mask logic.
- A correct training loop: batching, loss, gradient clipping, AdamW, eval, sampling.
- Understanding of the design choices, documented inline rather than copied.

## Limitations

- Character-level tokenization, chosen for simplicity — no BPE.
- No KV-cache, so generation is O(n²) per step; fine at this scale, not for serving.
- Trained on a toy corpus to keep the repo reproducible on a laptop.

## What I'd do next

- Add a BPE tokenizer and compare convergence vs char-level.
- Implement a KV-cache and benchmark generation speedup.
- Ablation: pre-norm vs post-norm, weight tying on/off — with loss curves.
