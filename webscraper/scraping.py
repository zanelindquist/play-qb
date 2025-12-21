from bs4 import BeautifulSoup
import requests
import csv
import os
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
import numpy as np
from scipy.stats import norm, sem
from pathlib import Path
from playwright.sync_api import sync_playwright

from .config import *
from .keywords import *
from .classifier_models import *
from .utils import *
from .classifiers.ml.ml import *



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


# SCRAPING

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

def scrape_tournament_to_sql(link, diagnostics=False, level="College"):
    # Returns a dict
    tpacket = scrape_tournament_page(link, diagnostics=diagnostics, level=level)
    
    # save_tpacket_to_json(tpacket, f"./packets/{tpacket["tournament_metadata"].get("name")}.json")

    # Write the dict to SQL
    try:
        write_dict_to_sql(tpacket, diagnostics=diagnostics)
        if diagnostics:
            append_to_diagnostics_file(diagnostics, "SUCCESS wrote tournament packet to SQL database")
    except Exception as e:
        print(f"Writing to SQL failed: falling back to saving to JSON: {e}")
        # Fallback and save to JSON
        save_tpacket_to_json(tpacket, f"./packets/{tpacket["tournament_metadata"].get("name")}.json")
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"FALLBACK wrote tournament packet to JSON instead of SQL database: {e}")


# NOT READY
def scrape_questions():
    if USE_PLAYWRIGHT:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle")
            
            # wait for table to load
            page.wait_for_selector("table")
            
            html = page.content()
    else:
        response = requests.get(url)

        # Check if request was successful
        if response.status_code == 200:
            html = response.text


    soup = BeautifulSoup(html, "html.parser")

    links = soup.find_all("a")
    valid_links = []

    for link in links:
        href = link.get("href")
        if href and len(href) > 1 and href[0] == "/" and href[1].isdigit():
            # This is a valid link that we would like to explore
            valid_links.append(href)

    for link in valid_links:
        tpacket = scrape_tournament_to_sql(link[1:], diagnostics="./logs/full_scrape.txt", level="College")
        

def scrape_individual_page_to_json():
    print("BEGINNING webscrape")
    tournment_packet = scrape_tournament_page("/3209/", diagnostics="./logs/scrape.txt", level="College")

    if not tournment_packet:
        print("There was an error scraping that packet. Check the logs")
    else:
        tournment_name = tournment_packet.get("tournament_metadata").get("name")

        # TODO: Save these questions to a mysql database or figure out how we want to save them

        if tournment_name:
            save_tpacket_to_json(tournment_packet, "./packets/" + tournment_name + ".json")
        else:
            save_tpacket_to_json(tournment_packet, "./packets/1.json")
            print("WARNING: no name specified so data saved to ./packets/1.json. MUST RENAME")

def packet_information(file):
    # Make into an absolute paths
    BASE_DIR = os.path.dirname(__file__)
    file = os.path.join(BASE_DIR, file)

    tournament = {}
    with open(file, "r", encoding="utf-8") as f:
        tournament = json.load(f)
    tossups = 0
    bonuses = 0
    for packet in tournament.get("packets"):
        tossups += len(packet.get("tossups"))
        bonuses += len(packet.get("bonuses"))

    return {"tossups": tossups, "bonuses": bonuses}


# PARSING

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


# WRITING TO MEMORY

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

def save_tpacket_to_json(tpacket, file):
    if not file.endswith(".json"):
        raise ValueError("save_tpacket_to_json: file must be json format")

    # Make into an absolute path
    BASE_DIR = os.path.dirname(__file__)
    file = os.path.join(BASE_DIR, file)

    # Make sure the folder exists
    os.makedirs(os.path.dirname(file) or ".", exist_ok=True)

    with open(file, "w", encoding="utf-8") as f:
        json.dump(tpacket, f, ensure_ascii=False, indent=4)

    print(f"SAVED tpacket to {file}")

def write_dict_to_sql(dict, diagnostics=False, persist_db=False):
    meta = dict["tournament_metadata"]

    tournament = meta["name"]
    level = meta["level"]
    difficulty = meta["difficulty"]
    subjects = meta["subjects"]
    season = meta["season"]
    packet_length = meta["packet_length"]

    if not difficulty:
        difficulty = 2
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"write_dict_to_sql(): Difficulty not specified for {tournament}. Setting difficulty to Medium (2)")

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
    bonuses_written = 0;
    total_bonuses = 0;

    cursor = connection.cursor(buffered=True)

    # Prevent collisions. If another packet with the name is found, don't write the questions
    query = """
    SELECT * FROM questions WHERE tournament = %s
    """

    cursor.execute(query, (tournament,))
    questions_exist = cursor.fetchone()is not None

    if questions_exist and not persist_db:
        print("FAILURE: packet already exists in database")
        if diagnostics:
            append_to_diagnostics_file(diagnostics, "FAILURE: packet already exists in database")
        return {"status": 400, "message": "FAILURE: packet already exists in database"}


    for packet in dict.get("packets"):
        # Save tossups to DB
        # for tossup in packet.get("tossups"):
        #     # Increment for diagnostics
        #     total_questions += 1

        #     if len(tossup) < 2:
        #         continue

        #     try:
        #         question = remove_whitespace(tossup[0])
        #         answer = remove_whitespace(tossup[1])

        #         if not question or not answer:
        #             continue

        #         classifier_data = categorize_question({"question": question, "answer": answer}, model="1.0 ml")
        #         # If there is an error in this for some reason
        #         if not classifier_data:
        #             continue

        #         category = classifier_data.get("category")

        #         if not category:
        #             continue

        #         # Define query
        #         query = """
        #         INSERT INTO questions (hash, tournament, type, year, level, category, question, answers, created_at)
        #         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        #         """

        #         # Define values
        #         values = (
        #             # id auto generates
        #             generate_unique_hash(), # hash
        #             tournament, # tournament
        #             0,        # type (tossup or bonus)
        #             season, # year
        #             level, # level(ms, hs, college, open)
        #             category, # category
        #             question,  # question
        #             answer,  # answer
        #             datetime.now(timezone.utc) # created_at
        #         )

        #         # Execute and commit
        #         cursor.execute(query, values)
        #         connection.commit()
                
        #         # For diagnostics
        #         questions_written += 1;
        #     except Exception as e:
        #         #TODO: Have error checking and logging for malformed data
        #         if diagnostics:
        #             append_to_diagnostics_file(diagnostics, f"Error while creating question SQL row: {e}")
        #         connection.rollback()
        #         # Throw the error again so that the final code does notrun
        #         raise e;
        
        # Save bonuess to DB
        for bonus in packet.get("bonuses"):
            total_bonuses += 1
            try:
                intro = bonus.get("intro");
                if not intro:
                    continue

                questions = bonus.get("questions")
                question_parts = [intro]
                answer_parts = []

                malformed_data = False

                for q in questions:
                    if len(q) < 2:
                        malformed_data = True
                        break

                    question_parts.append(remove_whitespace(q[0]))
                    answer_parts.append(remove_whitespace(q[1]))

                if malformed_data:
                    continue

                question = " ||| ".join(question_parts)
                answer = " ||| ".join(answer_parts)

                classifier_data = categorize_question({"question": intro, "answer": None}, model="1.0 ml")
                
                # If there is an error in this for some reason
                if not classifier_data:
                    continue

                category = classifier_data.get("category")
                confidence = classifier_data.get("confidence")

                if not category:
                    continue

                # Define query
                query = """
                INSERT INTO questions (hash, tournament, type, year, level, category, category_confidence, question, answers, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """

                # Define values
                values = (
                    # id auto generates
                    generate_unique_hash(), # hash
                    tournament, # tournament
                    1,        # type (tossup or bonus)
                    season, # year
                    level, # level(ms, hs, college, open)
                    category, # category
                    confidence, # category confidence
                    question,  # question
                    answer,  # answers
                    datetime.now(timezone.utc) # created_at
                )

                # Execute and commit
                cursor.execute(query, values)
                connection.commit()
                
                # For diagnostics
                bonuses_written += 1;
            except Exception as e:
                #TODO: Have error checking and logging for malformed data
                if diagnostics:
                    append_to_diagnostics_file(diagnostics, f"Error while creating bonus question SQL row: {e}")
                connection.rollback()
                # Throw the error again so that the final code does notrun
                raise e;

    cursor.close()
    connection.close()

    if total_questions == 0: total_questions = 1;
    if total_bonuses == 0: total_bonuses= 1;

    if diagnostics:
        append_to_diagnostics_file(diagnostics, f"COMPLETED translating questions from json to sql: STATS: (created_questions: {questions_written} | created_bonuses: {bonuses_written} | success_rate: {questions_written/total_questions} | success_rate_bonuses: {bonuses_written/total_bonuses})")
    
    print(f"Completed writing {questions_written}/{total_questions} new questions and {bonuses_written}/{total_bonuses} bonuses to MySQL database")

    return {"status": 200, "message": "Success!"}


# MUTATING

# Find questions in the database and change their fields
def mutate_existing_questions(diagnostics=False, model="400 words"):
    cursor = connection.cursor()
    questions_encountered = 0
    questions_mutated = 0

    # ===== Re-classify questions =====
    try: 
        cursor.execute("SELECT id, difficulty, category, question, answers FROM questions")
        questions = cursor.fetchall()

        print("LEN QUESTIONS", len(questions))

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

            categorizer_data = categorize_question(question_data, model=model)
            if not categorizer_data:
                print(f"mutate_existing_questions(): No categorizer data WHERE id = {id}")
                if diagnostics:
                    append_to_diagnostics_file(diagnostics, "FAILED: No categorizer data WHERE id = {id}")
                continue

            new_category = categorizer_data.get("category")
            category_confidence = categorizer_data.get("confidence")

            if not new_category or not category_confidence:
                print(f"mutate_existing_questions(): Failed to re-categorize question WHERE id = {id}")
                if diagnostics:
                    append_to_diagnostics_file(diagnostics, "FAILED to re-categorize question WHERE id = {id}")
                continue;

            updated_question = (new_category, category_confidence, id)

            cursor.execute("UPDATE questions SET category = %s, category_confidence = %s WHERE id = %s", updated_question)
            questions_mutated += 1
            connection.commit()
    except Exception as e:
        connection.rollback()

        print(f"mutate_existing_questions(): Failed with error {e}")
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"FAILED recategorizing question: {e}")


    if diagnostics:
        append_to_diagnostics_file(diagnostics, f"SUCCESS recategorized {questions_mutated} out of {questions_encountered}")


# CATEGORIZATION
# question_data: {"question": "...", "answers": "..."}
def categorize_question(question_data, model="400 words"):
    if not question_data.get("question"):
        return None
    
    classifier_function = None;

    # Find model
    for name, function in MODELS.items():
        if model.endswith(name):
            classifier_function = function

    result = classifier_function(question_data, model)
    

    return result

def train_ml_classifier(model, confidence_threshold=0.1, diagnostics=False):
    # Get questions to pass to the model here
    cursor = connection.cursor()

    values = (confidence_threshold,)

    # ===== Re-classify questions =====
    cursor.execute("SELECT question, category, answers FROM questions WHERE category_confidence >= %s AND category != ''", values)
    questions = cursor.fetchall()

    questions = [{"question": question[0], "category": question[1], "answers": question[2]} for question in questions]

    train_and_save_model(questions, model, diagnostics=diagnostics)

# CLASSIFIER QUANTIFICATION

def find_question_points_stats(n, diagnostics=False, classifier_model="Untitled model"):
    cursor = connection.cursor()
    cursor.execute("SELECT question FROM questions LIMIT %s", (n,))
    questions = cursor.fetchall()

    means_diff = []
    confidence_levels = []

    for question in questions:
        q_text = question[0]
        result = categorize_question({"question": q_text}, model=classifier_model)
        means_diff.append(result.get("points_diff"))
        confidence_levels.append(result.get("confidence_level"))

    mean = np.mean(means_diff)
    std = np.std(means_diff)
    standard_error = sem(means_diff)

    mean_confidence_level = np.mean(confidence_levels)

    data = {
        "n": n,
        "mean_diff": mean,
        "std_diff": std,
        "standard_error": standard_error,
        "mean_confidence_level": mean_confidence_level
    }

    if diagnostics:
        update_model_stats("classifier_stats.json", {classifier_model: data})
        append_to_diagnostics_file(diagnostics, f"CALCULATED stats for classifier model: {classifier_model}: {" | ".join([f"{key}: {value}" for (key, value) in data.items()])}")

    return data
