# Hi — I build and *measure* AI systems

I am focused on the unglamorous half of the field: knowing when a
model is actually working. Demos are easy; trustworthy systems are not. My work
leans on evals, reproducibility, and honest write-ups about tradeoffs and failures.

🌐 **[ryanwien.github.io/Portfolio](https://ryanwien.github.io/Portfolio/)** — all five
projects, with their measured results and their limitations, in one place.

Five projects, each chosen to show a different competency:

### 🧭 [eval-first-agent](https://github.com/ryanwien/portfolio/tree/main/eval-first-agent)
A tool-calling agent where the **evaluation harness is the product** — held-out
eval set, pass@k / cost/latency metrics, and a documented failure taxonomy.

### 🧱 [transformer-from-scratch](https://github.com/ryanwien/portfolio/tree/main/transformer-from-scratch)
A GPT-style decoder built from first principles in PyTorch — attention, masking,
and the training loop by hand. Trained and verified to converge.

### 🗂️ [text-classification](https://github.com/ryanwien/portfolio/tree/main/text-classification)
A clean classic-ML pipeline with three baselines and **real error analysis** —
confusion matrix and concrete misclassifications, not just an accuracy number.

### 📏 [extraction-benchmark](https://github.com/ryanwien/portfolio/tree/main/extraction-benchmark)
A small, rigorous, structured-extraction benchmark with explicit normalization, a
non-trivial baseline, and a reproducible methodology.

### 📈 [stock-forecasting](https://github.com/ryanwien/portfolio/tree/main/stock-forecasting)
An LSTM return forecaster done right: no lookahead, chronological split, and a
backtest (Sharpe, drawdown) measured against buy-and-hold.

---

**The throughline:** measurement over demos. Every repo ends its README with its
own limitations and a "what I'd do next."

📫 Reach me: ryanwien3d@gmail.com_OR_https://www.linkedin.com/in/ryanwien3d/
