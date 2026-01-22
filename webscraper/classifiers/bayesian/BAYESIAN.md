## Bayesian Classifier

# ALGORITHM
1. Compile word frequencies for categorized questions
    - Strip the question of all punctuation, ect
    - Remove short words or common words
    - Consider vectorizing words in future models
2. For each uncategorized question
    - Find the cateogory with the greatest score
        * For each word in the processed question
            1. Find the word in the word frequencies
            2. Multiply that matrix by the frequency of the category
            3. Add that matrix to the category matricies
        * Select the category with the maximum score
    - Set confidence

# DATA STRUCTURES
1. Word frequencies
    {
        "category": {
            "word": frequency,
            ...
        },
        ...
    }

    or
    WINNER:
    {
        "word": [0.1, 0.05, 0.5, ...]
    }