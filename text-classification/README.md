# Text Classification

An end-to-end text classification pipeline built on classic ML — no deep learning,
no API, no GPU. The value here isn't a fancy model; it's a clean, honest pipeline
with real error analysis. Often a well-tuned TF-IDF + linear model is the right
answer, and knowing that is itself a signal of judgment.

## Task

Four-way topic classification on the **20 Newsgroups** dataset (built into
scikit-learn — no download token, no API key). Headers, footers, and quotes are
stripped so the model learns content rather than metadata leakage, a common way
newsgroup classifiers silently cheat.

## What's here

```
text-classification/
├── src/
│   ├── dataset.py         # data loading (+ offline synthetic fallback)
│   ├── models.py          # three sklearn baselines
│   ├── train.py           # train all, report accuracy / macro-F1 / per-class
│   └── error_analysis.py  # confusion matrix + concrete misclassifications
└── results/               # results.json, error_analysis.json
```

## Run it

```bash
pip install -r requirements.txt
python -m src.train           # trains + evaluates all three models
python -m src.error_analysis  # confusion matrix + example errors
```

First run downloads 20 Newsgroups (~14MB, cached afterward). If offline, the code
falls back to a tiny synthetic set so the pipeline still runs.

## Models compared

| Model | What it is | Why include it |
|---|---|---|
| `nb-count` | Multinomial Naive Bayes on counts | Fast, dumb baseline — the floor |
| `logreg-tfidf` | Logistic regression on TF-IDF bigrams | The reliable workhorse |
| `linsvc-tfidf` | Linear SVM on the same features | Often the strongest linear option |

Reporting all three shows how much each modeling choice actually buys — usually
less than people expect, which is the point.

## What this demonstrates

- A leak-free pipeline (metadata stripped, fit only on train).
- Honest metrics: macro-F1 alongside accuracy, plus per-class precision/recall.
- **Real error analysis** — a confusion matrix and concrete misclassified
  examples, so the writeup can explain *which* classes get confused and why
  (e.g. med vs. politics overlap on certain vocabulary).

## Limitations

- Bag-of-words ignores word order and context; "not good" and "good" look similar.
- 20 Newsgroups is a clean benchmark; real-world text is messier (typos, mixed
  languages, class imbalance).
- No hyperparameter search beyond sensible defaults.

## What I'd do next

- Add a fine-tuned transformer (DistilBERT) as a fourth model and report the
  accuracy gain *versus the added cost/latency* — the tradeoff that matters.
- Calibrate confidence scores and add an "abstain" option for low-confidence cases.
- Cross-validation with confidence intervals instead of a single split.
