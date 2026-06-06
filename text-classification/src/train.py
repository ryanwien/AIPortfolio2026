"""Train and evaluate text-classification baselines.

Trains every model, reports accuracy + macro-F1 + per-class metrics, and writes
a results JSON. Run:

    python -m src.train
"""

from __future__ import annotations

import json
import time
from pathlib import Path

from sklearn.metrics import classification_report, f1_score, accuracy_score

from src.dataset import load_data
from src.models import build_models


def run(out_dir: Path = Path("results")) -> dict:
    data = load_data()
    print(f"train={len(data.X_train)}  test={len(data.X_test)}  "
          f"classes={data.target_names}")

    models = build_models()
    summary = {}

    for name, pipe in models.items():
        t0 = time.time()
        pipe.fit(data.X_train, data.y_train)
        fit_s = time.time() - t0

        preds = pipe.predict(data.X_test)
        acc = accuracy_score(data.y_test, preds)
        macro_f1 = f1_score(data.y_test, preds, average="macro")
        report = classification_report(
            data.y_test, preds,
            labels=list(range(len(data.target_names))),
            target_names=data.target_names,
            output_dict=True, zero_division=0,
        )
        summary[name] = {
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4),
            "fit_seconds": round(fit_s, 3),
            "per_class": {
                k: {"precision": round(v["precision"], 3),
                    "recall": round(v["recall"], 3),
                    "f1": round(v["f1-score"], 3)}
                for k, v in report.items()
                if k in data.target_names
            },
        }
        print(f"{name:<16} acc={acc:.3f}  macroF1={macro_f1:.3f}  ({fit_s:.2f}s)")

    out_dir.mkdir(parents=True, exist_ok=True)
    artifact = out_dir / "results.json"
    artifact.write_text(json.dumps(summary, indent=2))
    print(f"\nWrote {artifact}")
    return summary


if __name__ == "__main__":
    run()
