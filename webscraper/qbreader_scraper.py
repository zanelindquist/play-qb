import mysql.connector
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import requests
import math
import re
from html import unescape
import time
import json

from .config import *
from .utils import *
from .classifiers.ml.ml import *

# Import database connection
from .database import *

# Scraping data
BASE_URL = 'https://qbreader.org/api/query'
TOURNAMENT_METADATA_URL = 'https://www.qbreader.org/api/db-explorer/packet-metadata'
PACKET_URL = 'https://www.qbreader.org/api/packet'
QUERY_LENGTH = 500
LEVEL_DICT = {
    0: "Pop Culture",
    1: "Middle School",
    2: "Easy High School",
    3: "Regular High School",
    4: "Hard High School",
    5: "National High School",
    6: "● / Easy College",
    7: "●● / Medium College",
    8: "●●● / Regionals College",
    9: "●●●● / Nationals College",
    10: "Open"
}

# Parsing
ACCEPT_RE = re.compile(
    r'(?:<b>\s*<u>|<u>\s*<b>)(.+?)(?:</u>\s*</b>|</b>\s*</u>)',
    re.IGNORECASE | re.DOTALL
)
PROMPT_RE = re.compile(
    r'<u>(?!\s*<b>)(.+?)(?<!</b>)</u>',
    re.IGNORECASE | re.DOTALL
)
TAG_RE = re.compile(r'<[^>]+>')

# SCRAPER

def scrape_all_questions(number=2000):
    # Get offset
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    query = """
    SELECT value
    FROM rating_params
    WHERE name = %s
    LIMIT 1;
    """

    cursor.execute(query, ("scrape_offset",))
    row = cursor.fetchone()

    scrape_offset = 0

    if row is None:
        scrape_offset = 0
        # Create a row for the offset
        insert = """
        INSERT INTO rating_params
        (name, value, description, created_at)
        VALUES
        ("scrape_offset", 0, "Webscraper variable to track the question query scraping index", NOW());
        """
        cursor.execute(insert)
    else:
        scrape_offset = int(row[0])

    cursor.close()

    result = scrape_questions(number, page=scrape_offset / QUERY_LENGTH, diagnostics="./logs/scrape_qbreader.txt")

    # Update the scrape offset again
    total = result.get("total_questions")

    if not total:
        return
    
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    query = """
    UPDATE rating_params
    SET value = value + %s
    WHERE name = %s;
    """

    cursor.execute(query, (total, "scrape_offset"))
    connection.commit()

    cursor.close()

    return;

def scrape_tournament():
    # Get offset
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    query = """
    SELECT value
    FROM rating_params
    WHERE name = %s
    LIMIT 1;
    """

    cursor.execute(query, ("scrape_index",))
    row = cursor.fetchone()

    scrape_index = 0

    if row is None:
        scrape_index = 0
        # Create a row for the offset
        insert = """
        INSERT INTO rating_params
        (name, value, description, created_at)
        VALUES
        ("scrape_index", 0, "Webscraper variable to track the tournament index we have scraped", NOW());
        """
        cursor.execute(insert)
    else:
        scrape_index = int(row[0])

    cursor.close()

    # Open the tournaments id data
    BASE_DIR = os.path.dirname(__file__)
    file = os.path.join(BASE_DIR, "/qbreader_data/tournaments.json")

    all_tournaments = {}
    with open(file, "r", encoding="utf-8") as f:
        all_tournaments = json.load(f)

    scraping_tournament = all_tournaments[scrape_index]

    result = scrape_single_tournament(scraping_tournament, diagnostics="./logs/scrape_qbreader.txt")

    # Update the scrape offset again
    total = result.get("total_questions")

    if not total:
        return
    
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    query = """
    UPDATE rating_params
    SET value = value + %s
    WHERE name = %s;
    """

    # Increment the number of tournaments scraped by 1
    cursor.execute(query, (1, "scrape_index"))
    connection.commit()

    cursor.close()

    return;

def scrape_questions(limit, page=0, diagnostics=False):
    
    append_to_diagnostics_file(diagnostics, f"SCRAPING QUESTIONS limit={limit}, page={page}")
    
    questions_written = 0
    total_questions = 0

    for i in range(math.ceil(limit / QUERY_LENGTH)):
        o = page + i

        questions = query_questions(page=o, limit=QUERY_LENGTH, diagnostics="./logs/scrape_qbreader.txt")

        # If there was an error with searching
        if questions == 1:
            continue

        result = write_questions_to_sql(questions, diagnostics=diagnostics)

        if result:
            questions_written += result.get("questions_written")
            total_questions += result.get("total_questions")
        else:
            append_to_diagnostics_file(diagnostics, f"Error occurred while scraping. Check logs.")
            return
        
        append_to_diagnostics_file(diagnostics, f"Wrote {result.get("questions_written")} / {result.get("total_questions")} questions. Sleeping 2 seconds...")

        time.sleep(2)

    append_to_diagnostics_file(diagnostics, f"SUCCESS: Process complete. Wrote {questions_written} / {total_questions} questions.")

    print(f"SUCCESS: Process complete. Wrote {questions_written} / {total_questions} questions.")

    return {"questions_written": questions_written, "total_questions": total_questions}
    
def scrape_single_tournament(tournament_data, diagnostics="./logs/scrape_qbreader.txt"):
    if not tournament_data:
        append_to_diagnostics_file(diagnostics, f"scrape_single_tournament(): tournament data not given")
        return 1
        
    append_to_diagnostics_file(diagnostics, f"SCRAPING QUESTIONS from {tournament_data.get("setName")}")
    
    url = TOURNAMENT_METADATA_URL + f"?setId={tournament_data.get("_id")}"
    questions_written = 0
    total_questions = 0

    # GET the packet information from the tournament page
    response = requests.get(url)
    data = None
    if response.status_code == 200:
        data = response.json()
    else:
        
        append_to_diagnostics_file(diagnostics, f"query_questions(): Error: code {response.status_code} while querrying {url}")
        return 1
    
    # Now for each packet in this tournament
    for packet in data.get("data"):
        packet_response = requests.get(PACKET_URL + f"?_id={packet.get("_id")}")
        if packet_response.status_code == 200:
            questions = response.json()

            result = write_questions_to_sql(questions, diagnostics=diagnostics)
            if result:
                questions_written += result.get("questions_written")
                total_questions += result.get("total_questions")
            else:
                append_to_diagnostics_file(diagnostics, f"Error occurred while scraping. Check logs.")
                return 1
        else:
            append_to_diagnostics_file(diagnostics, f"query_questions(): Error: code {packet_response.status_code} while querrying {url}")
            return 1

    
    append_to_diagnostics_file(diagnostics, f"Wrote {result.get("questions_written")} / {result.get("total_questions")} questions. Sleeping 2 seconds...")

    append_to_diagnostics_file(diagnostics, f"SUCCESS: Process complete. Wrote {questions_written} / {total_questions} questions.")

    print(f"SUCCESS: Process complete. Wrote {questions_written} / {total_questions} questions.")

    return {"questions_written": questions_written, "total_questions": total_questions}
# HELPERS
def query_questions(page=0, limit=20, diagnostics=False):
    params = f"?maxReturnLength={limit}&tossupPagination={page}&bonusPagination={page}"
    
    print(f"Preparing to query: {BASE_URL}{params}")

    response = requests.get(BASE_URL + params)

    if response.status_code == 200:
        return response.json()
    else:
        
        append_to_diagnostics_file(diagnostics, f"query_questions(): Error: code {response.status_code} while querrying {BASE_URL + params}")
        return 1

def write_questions_to_sql(questions, diagnostics=False):
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    questions_written = 0
    total_questions = len(questions["tossups"]["questionArray"])

    for tossup in questions["tossups"]["questionArray"]:
        # Save tossups to DB
        try:
            scraped_hex = tossup["_id"]

            # If this question is already in the database, don't write it
            query = """
            SELECT 1
            FROM questions
            WHERE scraped_hex = %s
            LIMIT 1
            """

            cursor.execute(query, (scraped_hex,))
            exists = cursor.fetchone() is not None

            if exists:
                print("QUESTION EXISTS", scraped_hex)
                continue

            # Set data properties
            tournament = tossup["set"]["name"]
            year = tossup["set"]["year"]
            difficulty = tossup["difficulty"]
            level = tossup["difficulty"]
            category = tossup["category"].lower()
            subcategory = tossup["subcategory"].lower() or tossup["alternate_subcategory"].lower()
            question = tossup["question_sanitized"]
            answer = tossup["answer"]

            difficulty_mu = 1000 + difficulty * 115
            difficulty_sigma = 300 - difficulty * 10

            # Parse answer into the parts "main || accept || prompt || reject"
            parsed_answer = parse_answer_html(answer)

            # Define query
            query = """
                INSERT INTO questions (
                    hash, scraped_hex, tournament, type, year, level,
                    difficulty, category, category_confidence, subcategory, question, answers,
                    created_at, hand_labeled, difficulty_mu, difficulty_sigma
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            # Define values
            values = (
                # id auto generates
                generate_unique_hash(), # hash
                scraped_hex, # scraped_hex
                tournament, # tournament
                0,        # type (tossup or bonus)
                year, # year
                level, # level(ms, hs, college, open)
                difficulty, # difficulty
                category, # category
                1.0, # category_confidence
                subcategory,
                question,  # question
                parsed_answer,  # answers
                datetime.now(timezone.utc), # created_at

                False, #hand_labeled
                difficulty_mu,
                difficulty_sigma
            )

            # Execute and commit
            cursor.execute(query, values)
            connection.commit()
            
            # For diagnostics
            questions_written += 1;
        except Exception as e:
            #TODO: Have error checking and logging for malformed data
            
            append_to_diagnostics_file(diagnostics, f"Error while creating question SQL row: {e}")
            connection.rollback()
            # Throw the error again so that the final code does notrun
            print(e)

    # TODO: add bonuses


    append_to_diagnostics_file(diagnostics, f"SUCCESS: wrote {questions_written} of {total_questions} to database")
            
    cursor.close()
    connection.close()

    return {"questions_written": questions_written, "total_questions": total_questions}

def parse_answer_html(answer: str) -> str:
    """
    Convert an unsanitized answer into the format of
    main answer || accept | accept || prompt || reject || suggested category [depreciated]

    Rules:
    - Accepts = bold + underlined
    - Prompts = underlined only
    - Rejects = everything else

    :param answer: An unsanitized answer string
    """

    # Decode HTML entities (&nbsp;, etc.)
    answer = unescape(answer)

    # --- Extract accepts ---
    accepts = [a.strip() for a in ACCEPT_RE.findall(answer)]
    remaining = ACCEPT_RE.sub('', answer)

    # --- Extract prompts ---
    prompts = [p.strip() for p in PROMPT_RE.findall(remaining)]
    remaining = PROMPT_RE.sub('', remaining)

    # --- Strip all remaining tags ---
    # Just don't do rejects
    # remaining = TAG_RE.sub('', remaining)

    # # --- Split rejects ---
    # rejects = [
    #     part.strip()
    #     for part in re.split(r'[,\n;/|]+', remaining)
    #     if part.strip()
    # ]

    # Fill "NONE" for empty fields
    main = accepts[0] if accepts else "NONE"
    accepts_str = ' | '.join(accepts[1:]) if len(accepts) > 1 else "NONE"
    prompts_str = ' | '.join(prompts) if prompts else "NONE"
    rejects_str = "NONE"

    return f"{main} || {accepts_str} || {prompts_str} || {rejects_str}"

def test_parser(limit=5):
    # Open the tournaments id data
    BASE_DIR = os.path.dirname(__file__)
    file = os.path.join(BASE_DIR, "./qbreader_data/test_packet.json")

    data = None
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    html_content = """
    <!DOCTYPE html>
        <meta charset="utf-8">
    <html>
    <head>
        <title>Answer Parsing</title>
    </head>
    <style>
        b {
           color: red;
        }
    </style>
    <body>


    """

    with open(os.path.join(BASE_DIR, "./qbreader_data/answer_parse.html"), "w", encoding="utf-8") as html_file:
        index = 0
        for question in data.get("tossups"):
            if index >= limit:
                break;
            html_content += f"""
            <h1>{question.get("answer")}</h1>
            <h2>{parse_answer_html(question.get("answer"))}</h2>
            """
            # <h2>{parse_answer_html(question.get("answer"))}</h2>
            
            # print(question.get("answer"), "\n", parse_answer_html(question.get("answer")), end="\n\n")
            index += 1

        html_content +="""
        </body>
        </html>
        """
        html_file.write(html_content)
        
        print(f"Wrote {index} questions")

