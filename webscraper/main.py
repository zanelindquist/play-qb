# RUN FROM play-qb directory:
# python -m webscraper.main


from .scraping import *
from .config import *
from .classifiers.ml.ml import train_and_save_model
from .classifiers.bayesian.bayesian import *

html = False;

# Scrape tournament page to SQL
# scrape_tournament_to_sql("/2848/", diagnostics="./logs/tourny_to_sql.txt", level="Open")

# Get cursory information about a packet
# print(packet_information("./packets/2024 ACF Fall.json"))

# Write an in-memory dict to the mysql database
# dict = get_json("./packets/2002 Michigan MLK.json")
# write_dict_to_sql(dict, diagnostics="./logs/tosql.txt", persist_db=True) 

# Categorize a question
question = {"question":
            """
He wipes his mouth with Steve Tyler's scarf after catching it at a bar. He is amazed at the  sight of moon pie when he emerges after a brief stint as Frostillicus. He tells a drunkard, "The  sidewalk's for regular walking, not fancy walking," and sprouts hair all over his body after taking  Wednesday's pills on Friday. When he serves as a substitute teacher, he confiscates everything  made of tin, gets his beard caught in a pencil sharpener, and threatens paddlings. For 10 points - name this crotchety old companion of Abe Simpson.
            """,
            "answers": "Mexico [or United Mexican States; or Estados Unidos Mexicanos] (The photographer in the first line is Graciela Iturbide.) <Painting & Sculpture>",
            "tournament": "2002 Martin Luther King Jr. Memorial Tournament University of Michigan/Duke University"
            }

# print(categorize_question(question, model="1.0ml"))

# Categorize all questions
mutate_existing_questions(diagnostics="./logs/recategorize.txt", model="1.0 bayesian")

# result = process_question_answer(question)
# print(result)
# mutate_question_answers()
# mutate_category_to_basic()

# Find population statistics for the classifier
# find_question_points_stats(500, diagnostics="stats.txt", classifier_model="400 words")

# Scrape all questions?
# scrape_questions()

# Train ML model
# train_ml_classifier("1.1 ml", confidence_threshold=0.3, diagnostics="./logs/train_ml.txt")

# Bayesian classifier
# labeled_questions = execute_query("SELECT category FROM questions WHERE hand_labeled = TRUE;")

# create_word_histogram(labeled_questions, diagnostics="./logs/create_histogram.txt")
# create_category_frequency(labeled_questions)
