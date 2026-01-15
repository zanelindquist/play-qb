from .classifiers.ml.ml import classify_by_ml
from .classifiers.words.words import classify_by_keywords
from .classifiers.bayesian.bayesian import classify_by_bayesian

# EXPORT

MODELS = {
    "words": classify_by_keywords,
    "ml": classify_by_ml,
    "bayesian": classify_by_bayesian
}