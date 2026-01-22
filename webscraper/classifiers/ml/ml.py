import re
from scipy.stats import norm
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

from webscraper.classifiers.words.keywords import *
from webscraper.utils import *

BASE_DIR = os.path.dirname(__file__)
MODEL = None
VECTORIZER = None

def load_model(model):
    global MODEL, VECTORIZER

    MODEL_PATH = os.path.join(BASE_DIR, model, "question_classifier.joblib")
    VECTORIZER_PATH = os.path.join(BASE_DIR, model, "question_vectorizer.joblib")

    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        raise FileNotFoundError("Model files not found. Run train_and_save_model() first.")
    MODEL = joblib.load(MODEL_PATH)
    VECTORIZER = joblib.load(VECTORIZER_PATH)


# Takes either a list of questions for many clasification or just one question data dict
def classify_by_ml(questions, model_name="1.0 ml"):
    """
    question_data = {"question": "..."}
    """
    load_model(model_name)
    results = []
    isDict = False
    if type(questions) == dict:
        questions = [questions]
        isDict = True

    for question_data in questions:
        text = preprocess_text(question_data["question"])
        vec = VECTORIZER.transform([text])

        probs = MODEL.predict_proba(vec)[0]
        idx = np.argmax(probs)

        predicted_category = MODEL.classes_[idx]
        confidence = probs[idx]

        results.append({
            "category": str(predicted_category),
            "confidence": float(confidence),
            "classes": MODEL.classes_.tolist()
        })

    if isDict:
        return results[0]
    return results

def train_and_save_model(questions, model_name, diagnostics=False, confidence_threshold=0):
    """
    questions = [
        {"question": "...", "category": "..."},
        ...
    ]
    """

    texts = [preprocess_text(q["question"]) for q in questions]
    labels = [q["category"] for q in questions]

    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.2,
        stratify=labels,
        random_state=42
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_df=0.9,
        min_df=5,
        sublinear_tf=True
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(
        max_iter=500,
        class_weight="balanced"
    )

    model.fit(X_train_vec, y_train)

    # ---- Evaluation ----
    predictions = model.predict(X_test_vec)

    metrics = {
        "n": len(labels),
        "model_type": "LogisticRegression",
        "accuracy": accuracy_score(y_test, predictions),
        "confusion_matrix": np.array2string( # Make this a string
            confusion_matrix(y_test, predictions),
            separator=", ",
            max_line_width=120
        ),
    }

    if diagnostics:
        update_model_stats("./logs/classifier_stats.json", {model_name: metrics})
        append_to_diagnostics_file(diagnostics, f"COMPLETED training ML model '{model_name}':{" | ".join([f"{key}: {value}" for key, value in metrics.items()])}")

    print("Accuracy:", accuracy_score(y_test, predictions))
    print("Confusion matrix:\n", confusion_matrix(y_test, predictions))

    # ---- Save artifacts ----
    BASE_DIR = os.path.dirname(__file__)

    model_dir = os.path.join(BASE_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)

    joblib.dump(model, os.path.join(model_dir, "question_classifier.joblib"))
    joblib.dump(vectorizer, os.path.join(model_dir, "question_vectorizer.joblib"))

    
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    tokens = [
        word for word in text.split()
        if word not in ENGLISH_STOP_WORDS and len(word) > 2
    ]

    return " ".join(tokens)
