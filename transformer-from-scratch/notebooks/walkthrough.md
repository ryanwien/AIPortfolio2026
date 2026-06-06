# Walkthrough

A guided read of `src/model.py`, component by component. This is the writeup that
turns the code from "it works" into "I understand why it works."

## 1. Token + position embeddings

A transformer has no inherent notion of order — attention is permutation-equivariant.
We inject order with a learned positional embedding added to the token embedding.
(Sinusoidal and rotary embeddings are alternatives; learned is the simplest.)

## 2. Causal self-attention

Each token produces a query, key, and value. Attention scores are `Q·Kᵀ`, scaled
by `1/√(head_dim)` to keep the softmax in a sensible range as dimension grows.
The **causal mask** sets scores for future positions to `-∞` before softmax, so a
token can only attend to itself and earlier tokens. That masking is the entire
difference between an encoder and a decoder.

Splitting into multiple heads lets the model attend to different relationships in
parallel; we reshape to `(B, n_head, T, head_dim)`, run attention per head, then
concatenate and project back.

## 3. Feed-forward (MLP)

After mixing information across positions with attention, the MLP processes each
position independently. The standard pattern is expand 4×, apply GELU, project back.

## 4. The block and residual stream

Each block is `x = x + attn(norm(x))` then `x = x + mlp(norm(x))`. The residual
connections create a clean gradient path; pre-norm (LayerNorm *before* each
sublayer) keeps training stable as depth increases.

## 5. Weight tying

The output projection shares weights with the input embedding. This saves
parameters and reflects a symmetry: mapping a token to a vector and scoring a
vector against tokens are inverse operations.

## 6. Generation

Autoregressive: predict the next token, append it, repeat — cropping the context
to `block_size` each step. Temperature scales the logits to trade off determinism
against diversity.

## Suggested experiment to include in the repo

Train with and without weight tying, plot both loss curves, and write two
sentences on what you observe. A small honest ablation reads as far more credible
than a polished demo with no analysis.
