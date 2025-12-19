
from .scraping import *
from .config import *
from .classifiers.ml.ml import train_and_save_model

html = False;


# Get cursory information about a packet
# print(packet_information("./packets/2002 Michigan MLK.json"))

# Write an in-memory dict to the mysql database
# dict = get_json("./packets/2002 Michigan MLK.json")
# write_dict_to_sql(dict, "tosql.txt") 

# Categorize a question
question = {"question": 
            """
His battles with the Uzbeks, Persians, and the Deccan kingdoms served him well in his war of succession with his brother Dara Shikoh, whom he defeated and killed in 1658.  He expanded his empire to its zenith, but his Muslim militancy alienated Hindus and led to a series of revolts and economic crises.  When he died, the failure of his sons to resolve these issues led to the Mughal Empire’s breakup.  For 10 points – identify this man, the son of Shah Jehan.   
            """}

# print(categorize_question(question, model="400 words"))

# Categorize all questions
# mutate_existing_questions("recategorize.txt")

# Find population statistics for the classifier
# find_question_points_stats(500, diagnostics="stats.txt", classifier_model="400 words")

# Scrape all questions?
# scrape_questions()

# Train ML model
# train_ml_classifier("1.0 ml", diagnostics="./logs/train_ml.txt")
