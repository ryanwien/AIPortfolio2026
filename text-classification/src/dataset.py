"""Dataset loading for text classification.

Uses 20 Newsgroups (built into scikit-learn, no download token, no API). Falls
back gracefully if the dataset can't be fetched so the pipeline is testable
offline with a tiny synthetic set.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TextData:
    X_train: list[str]
    y_train: list[int]
    X_test: list[str]
    y_test: list[int]
    target_names: list[str]


# A focused 4-class slice keeps the problem legible and the confusion matrix
# readable. Swap in more categories for a harder task.
DEFAULT_CATEGORIES = [
    "rec.sport.baseball",
    "sci.med",
    "comp.graphics",
    "talk.politics.guns",
]


def load_data(categories: list[str] | None = None) -> TextData:
    categories = categories or DEFAULT_CATEGORIES
    try:
        from sklearn.datasets import fetch_20newsgroups

        # Strip headers/footers/quotes so the model learns content, not metadata
        # leakage (a classic way newsgroup classifiers cheat).
        remove = ("headers", "footers", "quotes")
        train = fetch_20newsgroups(
            subset="train", categories=categories, remove=remove, random_state=42
        )
        test = fetch_20newsgroups(
            subset="test", categories=categories, remove=remove, random_state=42
        )
        return TextData(
            X_train=list(train.data),
            y_train=list(train.target),
            X_test=list(test.data),
            y_test=list(test.target),
            target_names=list(train.target_names),
        )
    except Exception as exc:  # offline / fetch failure -> synthetic fallback
        print(f"[warn] could not fetch 20newsgroups ({exc}); using synthetic data")
        return _synthetic()


def _synthetic() -> TextData:
    seeds = {
        0: ["the pitcher threw a fastball", "home run in the ninth inning"],
        1: ["the patient was prescribed medication", "symptoms of the disease"],
        2: ["rendering the 3d model in opengl", "image pixel shader graphics"],
        3: ["the second amendment and firearms", "gun control legislation debate"],
    }
    X, y = [], []
    for label, texts in seeds.items():
        for t in texts * 15:  # inflate so a split is meaningful
            X.append(t)
            y.append(label)
    # Shuffle deterministically so every class lands in both splits.
    import random
    idx = list(range(len(X)))
    random.Random(42).shuffle(idx)
    X = [X[i] for i in idx]
    y = [y[i] for i in idx]
    split = int(0.7 * len(X))
    return TextData(
        X_train=X[:split], y_train=y[:split],
        X_test=X[split:], y_test=y[split:],
        target_names=["baseball", "med", "graphics", "guns"],
    )
