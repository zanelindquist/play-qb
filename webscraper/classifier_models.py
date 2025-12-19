from .classifiers.ml.ml import classify_by_ml
from .classifiers.words.words import classify_by_keywords

# EXPORT

MODELS = {
    "words": classify_by_keywords,
    "ml": classify_by_ml
}