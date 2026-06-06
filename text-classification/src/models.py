"""Model baselines for text classification.

Three sklearn pipelines of increasing strength. Reporting all three makes the
writeup honest: it shows how much each modeling choice actually buys.
"""

from __future__ import annotations

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC


def build_models() -> dict[str, Pipeline]:
    """Return named, untrained pipelines keyed by a short identifier."""
    return {
        "nb-count": Pipeline([
            ("tfidf", TfidfVectorizer(use_idf=False, stop_words="english")),
            ("clf", MultinomialNB()),
        ]),
        "logreg-tfidf": Pipeline([
            ("tfidf", TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), min_df=2, sublinear_tf=True
            )),
            ("clf", LogisticRegression(max_iter=1000, C=1.0)),
        ]),
        "linsvc-tfidf": Pipeline([
            ("tfidf", TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), min_df=2, sublinear_tf=True
            )),
            ("clf", LinearSVC(C=1.0)),
        ]),
    }
