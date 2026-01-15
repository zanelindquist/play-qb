# Imports
import numpy as np
import math

# Files
from webscraper.utils import *
from webscraper.classifiers.words.keywords import COMMON_WORDS, CATEGORIES
    

histogram = get_json("classifiers/bayesian/histogram.json")
category_frequencies = get_json("classifiers/bayesian/category_frequencies.json")

def classify_by_bayesian(question, model, diagnostics=False) -> list:

    if not histogram or not category_frequencies:
        raise Exception("classify_by_bayesian(): could not find histogram or category frequencies")
    
    # 2. For each uncategorized question
    question = question.get("question")
    # - Find the cateogory with the greatest score
    category_scores = np.array([0] * len(CATEGORIES))
    #     * For each word in the processed question
    words = process_text(question)
    for word in words:
        # 1. Find the word in the word frequencies
        vector = histogram.get(word)
        if not vector:
            continue
        # 2. Multiply that matrix by the frequency of the category
        frequency = np.array(category_frequencies["categories"])
        frequency = frequency / category_frequencies["TOTAL"]

        # 3. Add that matrix to the category matricies
        category_scores = category_scores + vector * frequency


    #     * Select the category with the maximum score
    category_index = np.argmax(category_scores)
    category = CATEGORIES[category_index]

    # Calculate confidence
    category_confidences = softmax(category_scores)
    confidence = category_confidences[category_index]

    print(category, category_scores)

    # - Set confidence
    return {"category": category, "confidence": confidence}

def create_word_histogram(labeled_questions: list, diagnostics=False):
    try:
        # For each word in each question
        histogram = {}
        words_encountered = 0

        # - Strip the question of all punctuation, ect
        # - Remove short words or common words
        # - Consider vectorizing words in future models

        for question in labeled_questions:
            text, category = question

            filtered_words = process_text(text)

            for word in filtered_words:
                words_encountered += 1

                category_index = CATEGORIES.index(category)
                if category_index < -1:
                    print("Category not found: " + category)
                    if diagnostics:
                        append_to_diagnostics_file(diagnostics, f"create_word_histogram(): category not found: {category}")
                    return

                if histogram.get(word):
                    histogram[word][category_index] += 1
                else:
                    histogram[word] = [0] * len(CATEGORIES)
                    histogram[word][category_index] += 1

        # At the end, divide each word by the total amount of words
        histogram["TOTAL_WORDS"] = words_encountered

        # Save it to a json file
        write_to_json("classifiers/bayesian/histogram.json", histogram)

        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"create_word_histogram(): successfully wrote {words_encountered} words to histogram")
    
        print(f"create_word_histogram(): successfully wrote {words_encountered} words to histogram")
    except Exception as e:
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"create_word_histogram(): failure: {e}")

def create_category_frequency(labeled_questions: list):
    frequency_chart = {
        "categories": [0] * len(CATEGORIES),
        "TOTAL": 0
    }

    questions_encountered = 0

    for question in labeled_questions:
        questions_encountered += 1

        category, = question

        category_index = CATEGORIES.index(category)

        if category_index < -1:
            print(f"Unexpected category: {category}")
            continue

        frequency_chart["categories"][category_index] += 1

    frequency_chart["TOTAL"] = questions_encountered

    write_to_json("classifiers/bayesian/category_frequencies.json", frequency_chart)

    print(f"create_category_frequency(): wrote {questions_encountered} items")

def process_text(text: str) -> list:
        if not text:
            return []
        # 1. Lowercase everything
        text = text.lower()
        # 2. Remove punctuation
        text = text.translate(str.maketrans("", "", string.punctuation))
        # 3. Split into words
        words = text.split()
        # 4. Filter out common words and words shorter than 4 characters
        return [w for w in words if w not in COMMON_WORDS and len(w) >= 4]

def softmax(log_scores):
    max_score = max(log_scores)  # numerical stability
    exps = [math.exp(s - max_score) for s in log_scores]
    total = sum(exps)
    return [e / total for e in exps]

