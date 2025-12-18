import re
from scipy.stats import norm

from keywords import *
from utils import *


MODELS = {
    "words": classify_by_keywords,
    "ml": classify_by_ml
}


def classify_by_keywords(question_data, model):

    category_scores = {}

    question = question_data.get("question")
    answers = question_data.get("answers")
    
    # Parse question into different parts (first sentance, middle, last sentance)
    sentances = question.split(".")
    # Each question has three parts
    question_parts = [sentances[0], ".".join(sentances[1:-2]), sentances [-1]]

    # Search each part for words in each category
    for i in range(len(question_parts)):
        part_multiplier = QUESTION_PART_WEIGHTS[i]
        part = question_parts[i]

        # Loop through each category
        for category in CATEGORIZATION_KEYWORDS:
            category_total = 0;
            # loop through each power level
            for (power_level, words) in CATEGORIZATION_KEYWORDS[category].items():
                for word in words:
                    # Search the part for each word
                    tokens = re.findall(r'\b\w+\b', part.lower())  # splits into words ignoring punctuation
                    if word.lower() in tokens:
                        category_total += power_level * part_multiplier
            if category not in category_scores:
                category_scores[category] = 0

            # Assign points to the category a word belongs to
            category_scores[category] += category_total
    
    sorted_categories = sorted(
        category_scores.items(),
        key=lambda cat: cat[1],
        reverse=True
    )
    

    # Compute a confidence level?
    all_model_statistics = get_json("./logs/classifier_stats.json")
    model_stats = all_model_statistics.get(model)
    
    mean_diff = POPULATION_STATISTICS.get("mean_diff")
    std_diff = POPULATION_STATISTICS.get("std_diff")
    if not model_stats:
        print("categorize_question(): no model statistics, falling back onto old stats")
    mean_diff = model_stats.get("mean_diff")
    std_diff = model_stats.get("std_diff")

    confidence_level = 0
    if mean_diff and std_diff:
        # Handle case where there's only one category matched
        if sorted_categories[1][1] == 0:
            # If only one category has points, perfect confidence
            confidence_level = 1.0 if sorted_categories[0][1] > 0 else 0.5
        else:
            # Find the difference between the first and second
            d_bar = sorted_categories[0][1] - sorted_categories[1][1]
            # z = (d_bar - u) / std
            z = (d_bar - mean_diff) / std_diff
            # Find the area that this z value offsets
            area = norm.cdf(z)
            
            confidence_level = area

    top = sorted_categories[0]
    second = sorted_categories[1]

    data = {
        "category": top[0],
        "points": top[1],
        "points_diff": top[1] - second[1],
        "confidence_level": confidence_level
    }

    return data


def classify_by_ml(question_data, model):
    