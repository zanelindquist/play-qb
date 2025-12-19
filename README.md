# Classifier
## Words
1. For each category, create a list of keywords, some with more precedence than others, and then match them to the question content.
    - The category with the highest number of points selects the question
        * First and last sentances of the question should have more weight for their keywords
    - Add a confidence leve in the question

## ML
1. Preproccess data
    - Raw qeustions + categories
    - Text pre-processing
        * Remove puncutuation, whitespace, stopwords
        * Lemmatize
    - Vectorization

2. Train the model
    - Supervised learning off of the words model's categories, even if they are only like 52% accurate

3. Test the model
    - Evaluate conficence and accuracy
    - Use probabilities to score confidence

# Answer Checker
