"""Error analysis for the best text-classification model.

Produces the part that separates a real project from a tutorial: a confusion
matrix and concrete misclassified examples, so you can say *why* it fails.

    python -m src.error_analysis
"""

from __future__ import annotations

import json
from pathlib import Path

from sklearn.metrics import confusion_matrix

from src.dataset import load_data
from src.models import build_models


def run(model_name: str = "logreg-tfidf", out_dir: Path = Path("results")) -> None:
    data = load_data()
    pipe = build_models()[model_name]
    pipe.fit(data.X_train, data.y_train)
    preds = pipe.predict(data.X_test)

    cm = confusion_matrix(data.y_test, preds).tolist()

    # Collect a few concrete errors with the model's (wrong) call.
    errors = []
    for text, true, pred in zip(data.X_test, data.y_test, preds):
        if true != pred:
            errors.append({
                "true": data.target_names[true],
                "pred": data.target_names[pred],
                "snippet": " ".join(text.split())[:160],
            })

    _print_cm(cm, data.target_names)
    print(f"\n{len(errors)} misclassified of {len(data.y_test)}. Examples:")
    for e in errors[:5]:
        print(f"  [{e['true']} -> {e['pred']}] {e['snippet']}")

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "error_analysis.json").write_text(
        json.dumps(
            {"model": model_name, "confusion_matrix": cm,
             "labels": data.target_names, "errors": errors[:50]},
            indent=2,
        )
    )
    print(f"\nWrote {out_dir / 'error_analysis.json'}")


def _print_cm(cm, labels) -> None:
    width = max(len(l) for l in labels) + 2
    print("confusion matrix (rows=true, cols=pred):")
    print(" " * width + "".join(f"{l[:6]:>8}" for l in labels))
    for label, row in zip(labels, cm):
        print(f"{label:<{width}}" + "".join(f"{v:>8}" for v in row))


if __name__ == "__main__":
    run()
