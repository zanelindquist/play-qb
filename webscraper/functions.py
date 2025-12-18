from bs4 import BeautifulSoup
import requests
import csv
import os
from config import *
from PyPDF2 import PdfReader
import io
import re
from datetime import datetime, timezone
from striprtf.striprtf import rtf_to_text
from docx import Document
# import textract
from odf.opendocument import load
from odf.text import P
from io import BytesIO
import tempfile
import json
import mysql.connector
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import random
import string
import numpy as np
from scipy.stats import norm, sem
from pathlib import Path

from keywords import *


connection = mysql.connector.connect(
    host="127.0.0.1",
    port=3306,
    user="root",
    password="password",
    database="play-qb"
)

# Connect to database
DATABASE_URL = "mysql+mysqlconnector://root:password@localhost:3306/play-qb"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()


def scrape_tournament_page(link, diagnostics=False, level="College"):
    # Text fetching and metadata
    html = ""
    difficulty = ""
    subjects = ""
    season = ""
    # Diagnostics
    failed_packets = 0

    response = requests.get(url + link)
    # Check if request was successful
    if response.status_code == 200:
        html = response.text

    soup = BeautifulSoup(html, "html.parser")

    # Get information about this set of packets
    tournament = soup.find("h1").get_text()

    ps = soup.find_all("p")

    if len(ps) < 1:
        return {"error": "No packet metadata found."}
    
    for p in ps:
        text = p.get_text()
        if re.match(r"Difficulty", text, flags=re.IGNORECASE):
            difficulty = text.split("Difficulty: ")[1].split(" ")[0];
        elif re.match(r"Subjects", text, flags=re.IGNORECASE):
            subjects = text.split("Subjects: ")[1];
        elif re.match(r"Season", text, flags=re.IGNORECASE):
            season = text.split("Season primarily used: ")[1];
        else:
            if diagnostics:
                append_to_diagnostics_file(diagnostics, "New tournament page metadata encountered: " + text)

   # Get packet downloads
    packet_downloads = soup.find_all("li")

    processed_packets = []

    for packet in packet_downloads:
        a = packet.find("a")
        text = a.get_text()
        if not text or not (text.endswith(".pdf") or text.endswith(".rtf") or text.endswith(".docx")):
            continue

        # Acutal quiz bowl packets
        href = a.get('href')
        name = text.split(".")
        if len(name) == 2:
            name = name[0]
        if len(name) == 3:
            name = name[1]
        else:
            name = text

        response = requests.get(href)
        full_text = ""

        # Preprocess the raw text based on the file format
        if text.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(response.content))
            for page in reader.pages:
                text = page.extract_text()
                if text:  # skip empty pages
                    full_text += text + "\n"  # add newline between pages
        elif text.endswith(".txt"):
            with open("file.txt", "r", encoding="utf-8") as f:
                full_text = f.read()
        elif text.endswith(".rtf"):
            full_text = rtf_to_text(response.text)
        elif text.endswith(".docx"):
            doc = Document(BytesIO(response.content))
            full_text = "\n".join([p.text for p in doc.paragraphs])
        # elif text.endswith(".doc"):
        #     full_text = textract.process("file.doc")
        elif text.endswith(".odt"):
            doc = load(BytesIO(response.content))
            text = "\n".join([str(p) for p in doc.getElementsByType(P)])
        elif text.endswith(".html") or text.endswith(".htm"):
            soup = BeautifulSoup(response.text, "html.parser")
            full_text = soup.get_text()
        elif text.endswith(".md"):
            full_text = response.text
        else:
            append_to_diagnostics_file(diagnostics, "New filetype encountered: ." + text[-5:].split(".")[1])
            # Try to persist anyway, just getting raw text
            full_text = response.text

        if not full_text:
            failed_packets += 1
            append_to_diagnostics_file(diagnostics, "Full text not found with filetype: ." + text[-5:].split(".")[1])
            continue

        parsed_packet = parse_packet(full_text)
        if not parsed_packet.get("error"):
            parsed_packet["name"] = name
            parsed_packet["tossups_length"] = len(parsed_packet.get("tossups"))
            parsed_packet["bonuses_length"] = len(parsed_packet.get("bonuses"))
            processed_packets.append(parsed_packet)
        else:
            failed_packets += 1
            append_to_diagnostics_file(diagnostics, "Error while parsing packet \"" + name + "\":" + parsed_packet["error"])
            continue

    try:
        append_to_diagnostics_file(diagnostics, "COMPLETED tournament scrape: " + tournament + f"STATS: (success rate: {(len(processed_packets)/(len(processed_packets) + failed_packets))})")
    except Exception as error:
        print(error)

    return {
        "tournament_metadata": {
            "name": tournament,
            "level": level,
            "difficulty": difficulty,
            "subjects": subjects,
            "season": season,
            "packet_length": len(processed_packets)
        },
        "packets": processed_packets
    }

def load_text_from_file(file):
    with open(file, "r", encoding="utf-8") as f:
        return f.read()

def parse_packet(text):
    try:
        split_sections = re.split(r"Bonuses", text, flags=re.IGNORECASE)
        tossups = "";
        bonuses = "";
        tossup_questions = []
        bonus_questions = []
        compiled_bqs = []
        if len(split_sections) >= 2:
            tossups = split_sections[0]
            bonuses = split_sections[1]

        if tossups:
            # divide up the questions
            tossup_questions = re.split(r"^\d+\.\s*", tossups, flags=re.MULTILINE)[1:]
            # Remove empty strings that may appear
            tossup_questions = [re.split(r"answer: ", q.strip().replace("\n", " ").replace(" .", "."), flags=re.IGNORECASE) for q in tossup_questions if q.strip()]
            
        if bonuses:
            bonus_questions = re.split(r"^\d+\.\s*", bonuses, flags=re.MULTILINE)[1:]
            for q in bonus_questions:
                elements = re.split(r"[A-Z]\.\s*\(\d+\)|\[\d+[A-z]?\]", q.strip().replace("\n", " ").replace(" .", "."), flags=re.IGNORECASE)
                compiled_bqs.append({
                    "intro": elements[0],
                    "questions": [re.split(r"answer: ", element, flags=re.IGNORECASE) for element in elements[1:]]
                })
        
        # tossups = [["question", "answer"]]
        # bonus_question = [{"intro": "...", "questions": [["question", "answer"]]}]
        return {
            "tossups": tossup_questions,
            "bonuses": compiled_bqs
        }
    except Exception as error:
        return {"error": f"{error}"}

def write_csv(rows):
    with open(destination, "wb", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

def write_to_file(href, tournament, name):
        # Build the full directory path
        directory = os.path.join(packet_prefix, tournament)
        os.makedirs(directory, exist_ok=True)  # Create folder(s) if missing

        # Build the full file path
        file_path = os.path.join(directory, f"{name}.pdf")

        response = requests.get(href)

        # Save it locally
        with open(packet_prefix + tournament + "/" + name + ".pdf", "wb") as f:
            f.write(response.content)
        
        print("Wrote " + name + " to " + packet_prefix + tournament)

def append_to_diagnostics_file(file, message):

    utc_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(file, "a") as f:
        f.write(f"{utc_now} --- {message}\n")

def save_tpacket_to_json(tpacket, file):
    if not file.endswith(".json"):
        raise ValueError("save_tpacket_to_json: file must be json format")

    # make sure the folder exists
    os.makedirs(os.path.dirname(file) or ".", exist_ok=True)

    with open(file, "w", encoding="utf-8") as f:
        json.dump(tpacket, f, ensure_ascii=False, indent=4)

    print(f"SAVED tpackt to {file}")

def get_json(file):
    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)

def update_model_stats(json_file_path, param_dict, save=True):
    """
    Updates the statistics of classifier models stored in a JSON file.
    
    Parameters:
    - json_file_path (str or Path): path to the JSON file.
    - param_dict (dict): dictionary of parameters to update, keyed by model name.
        Example: {"history_model": {"mean": 0.8, "std": 0.1}, ...}
    - save (bool): whether to save the updated JSON back to file.
    
    Returns:
    - updated_data (dict): the updated dictionary from the JSON.
    """
    json_file_path = Path(json_file_path)
    
    # 1️⃣ Load existing JSON
    if not json_file_path.exists():
        raise FileNotFoundError(f"File {json_file_path} not found")
    
    with open(json_file_path, "r") as f:
        data = json.load(f)
    
    # 2️⃣ Update statistics
    for model_name, stats in param_dict.items():
        if model_name in data:
            # Update existing stats
            data[model_name].update(stats)
        else:
            # If model doesn't exist, add it
            data[model_name] = stats
    
    # 3️⃣ Optionally save back to JSON
    if save:
        with open(json_file_path, "w") as f:
            json.dump(data, f, indent=4)
    
    return data

def write_dict_to_sql(dict, diagnostics=False):
    meta = dict["tournament_metadata"]

    tournament = meta["name"]
    level = meta["level"]
    difficulty = meta["difficulty"]
    subjects = meta["subjects"]
    season = meta["season"]
    packet_length = meta["packet_length"]

    if level == "Middle School":
        level = 0;
    elif level == "High School":
        level = 1;
    elif level == "College":
        level = 2;
    else:
        level = 3;

    questions_written = 0;
    total_questions = 0;

    cursor = connection.cursor()

    # Prevent collisions. If another packet with the name is found, don't write the questions
    query = """
    SELECT * FROM questions WHERE tournament = %s
    """

    cursor.execute(query, (tournament,))
    questions_exist = cursor.fetchone()is not None

    if questions_exist:
        print("FAILURE: packet already exists in database")
        if diagnostics:
            append_to_diagnostics_file(diagnostics, "FAILURE: packet already exists in database")
        return {"status": 400, "message": "FAILURE: packet already exists in database"}


    for packet in dict.get("packets"):
        # Save tossups to DB
        for tossup in packet.get("tossups"):
            # Increment for diagnostics
            total_questions += 1

            if len(tossup) < 2:
                continue

            try:
                question = tossup[0]
                answer = tossup[1]

                category = categorize_question(tossup)

                # Define query
                query = """
                INSERT INTO questions (hash, tournament, type, year, level, category, question, answers, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """

                # Define values
                values = (
                    # id auto generates
                    generate_unique_hash(), # hash
                    tournament, # tournament
                    0,        # type (tossup or bonus)
                    season, # year
                    level, # level(ms, hs, college, open)
                    category, # category
                    question,  # question
                    answer,  # answer
                    datetime.now(timezone.utc) # created_at
                )

                # Execute and commit
                cursor.execute(query, values)
                connection.commit()
                
                # For diagnostics
                questions_written += 1;
            except Exception as e:
                #TODO: Have error checking and logging for malformed data
                if diagnostics:
                    append_to_diagnostics_file(diagnostics, f"Error while creating question SQL row: {e}")
                connection.rollback()
        # Save bonuess to DB

    cursor.close()
    connection.close()

    if diagnostics:
        append_to_diagnostics_file(diagnostics, f"COMPLETED translating questions from json to sql: STATS: (created_questions: {questions_written} | success_rate: {questions_written/total_questions})")
    
    print(f"Completed writing {questions_written} new questions to MySQL database")

    return {"status": 200, "message": "Success!"}

# Find questions in the database and change their fields
def mutate_existing_questions(diagnostics=False):
    cursor = connection.cursor()
    questions_encountered = 0
    questions_mutated = 0

    # ===== Re-classify questions =====
    try: 
        cursor.execute("SELECT id, difficulty, category, question, answers FROM questions")
        questions = cursor.fetchall()

        for question in questions:
            questions_encountered += 1
            id, difficulty, category, question_text, answers = question

            question_data = {
                "id": id,
                "difficulty": difficulty,
                "category": category,
                "question": question_text,
                "answers": answers
            }

            new_category = categorize_question(question_data)

            if not new_category:
                print(f"mutate_existing_questions(): Failed to re-categorize question WHERE id = {id}")
                if diagnostics:
                    append_to_diagnostics_file(diagnostics, "FAILED to re-categorize question WHERE id = {id}")
                continue;

            updated_question = (new_category, id)

            cursor.execute("UPDATE questions SET category = %s WHERE id = %s", updated_question)
            questions_mutated += 1
    except Exception as e:
        print(f"mutate_existing_questions(): Failed with error {e}")
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"FAILED recategorizing question: {e}")


    if diagnostics:
        append_to_diagnostics_file(diagnostics, f"SUCCESS recategorized {questions_mutated} out of {questions_encountered}")

def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))

def categorize_question(question_data):
    if not question_data.get("question"):
        return None
    
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
    mean = POPULATION_STATISTICS["mean"]
    std = POPULATION_STATISTICS["std"]
    confidence_level = 0;
    if mean and std:
        # Find the difference between the first and second
        x = sorted_categories[0][1]
        # z = (d_bar - u) / std
        z = (x - mean) / std;
        # Find the area that this z value offsets
        area = norm.cdf(z)

        confidence_level = area

    top = sorted_categories[0]

    data = {
        "category": top[0],
        "points": top[1],
        "confidence_level": confidence_level
    }
    
    return data

def find_question_points_stats(n, diagnostics=False, classifier_model="unnamed"):
    cursor = connection.cursor()
    cursor.execute("SELECT question FROM questions LIMIT %s", (n,))
    questions = cursor.fetchall()

    means = []
    confidence_levels = []

    for question in questions:
        q_text = question[0]
        result = categorize_question({"question": q_text})
        means.append(result.get("points"))
        confidence_levels.append(result.get("confidence_level"))

    mean = np.mean(means)
    std = np.std(means)
    standard_error = sem(means)

    mean_confidence_level = np.mean(confidence_levels)

    data = {
        "n": n,
        "mean": mean,
        "std": std,
        "standard_error": standard_error,
        "mean_confidence_level": mean_confidence_level
    }

    if diagnostics:
        update_model_stats("./logs/classifier_stats.json", {classifier_model: data})
        append_to_diagnostics_file(diagnostics, f"CALCULATED stats for classifier model: {classifier_model}: {" | ".join([f"{key}: {value}" for (key, value) in data.items()])}")

    return data
