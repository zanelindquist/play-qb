import requests
import math
import re
from html import unescape
import time
import json
import gzip
import io
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

from .config import *
from .utils import *
# Import database connection
from .database import *

BASE_DIR = os.path.dirname(__file__)

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

# Google drive information
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials/oauth-client.json")
FOLDER_ID = '1O8vUu3j-5RlBdoyheuWhRDFHpcmK8tzj'

creds = InstalledAppFlow.from_client_secrets_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)

def get_drive_service():
    creds = None

    PICKLE_PATH = os.path.join(BASE_DIR, 'credentials/token.pickle')

    # Token file stores user's access & refresh tokens
    if os.path.exists(PICKLE_PATH):
        with open(PICKLE_PATH, 'rb') as token:
            creds = pickle.load(token)

    # If no valid credentials, log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                SERVICE_ACCOUNT_FILE,
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save token for future runs
        with open(PICKLE_PATH, 'wb') as token:
            pickle.dump(creds, token)

    return build('drive', 'v3', credentials=creds)

service = get_drive_service()


# Parsing
# Underlined AND bold
ACCEPT_RE = re.compile(
    r'(?:<b>\s*<u>|<u>\s*<b>)(.+?)(?:</u>\s*</b>|</b>\s*</u>)',
    re.IGNORECASE | re.DOTALL
)
# Underlined, but not bold
PROMPT_RE = re.compile(
    r'<u>(?!\s*<b>)(.+?)(?<!</b>)</u>',
    re.IGNORECASE | re.DOTALL
)

# SCRAPER

# Scrapes  a number of questions from the qb reader query api
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

# Scrapes tournaments from the set list api
def scrape_tournaments(limit=100, save_to_drive=True):
    # Get offset
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    # Open the tournaments id data
    file = os.path.join(BASE_DIR, "./qbreader_data/tournaments.json")
    all_tournaments = {}
    with open(file, "r", encoding="utf-8") as f:
        all_tournaments = json.load(f)

    # Find our base scrape index
    scrape_index = 0

    query = """
        SELECT value
        FROM rating_params
        WHERE name = %s
        LIMIT 1;
        """
    
    cursor.execute(query, ("scrape_index",))
    row = cursor.fetchone()

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

    # Loop and 
    for i in range(limit):
        # Sometimes the cursor can disconnect while we are scraping since it could take a second
        if not connection.is_connected():
            connection.reconnect()
        cursor = connection.cursor()


        # Increment the number of tournaments scraped by 1 each iteration in case of fail
        query = """
        UPDATE rating_params
        SET value = value + %s
        WHERE name = %s;
        """
        # Increment this first in case it fails so we can move on from the bad packet
        cursor.execute(query, (1, "scrape_index"))
        connection.commit()

        # Get scraping data and scrape tournament
        scraping_tournament = all_tournaments[scrape_index + i]
        result = scrape_single_tournament(scraping_tournament, save_to_drive=save_to_drive, diagnostics="./logs/scrape_qbreader.txt")

        # If we hit a fatal tournament-level error
        if result == 1:
            continue

        # Sleep 1 seconds to go slow on the API
        time.sleep(1)


    cursor.close()

    return;

# Used by scrape_all_questions
# uses itertaion to scrape from the query api
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

# Used by scrape_tournaments
# uses iteration to scrape from the set list api
def scrape_single_tournament(tournament_data, save_to_drive=True, diagnostics="./logs/scrape_qbreader.txt"):
    if not tournament_data:
        append_to_diagnostics_file(diagnostics, f"scrape_single_tournament(): tournament data not given")
        return 1
        
    append_to_diagnostics_file(diagnostics, f"SCRAPING QUESTIONS from {tournament_data.get("setName")}")
    
    url = TOURNAMENT_METADATA_URL + f"?setId={tournament_data.get("_id")}"
    questions_written = 0
    total_questions = 0
    drive_questions = []

    # GET the packet information from the tournament page
    response = requests.get(url)
    packet_list = None
    if response.status_code == 200:
        packet_list = response.json()
    else:
        append_to_diagnostics_file(diagnostics, f"query_questions(): Error while scraping metadata: code {response.status_code} while querrying {url}")
        # Fatal error, continue to the next tournament
        return 1
    
    # Now for each packet in this tournament
    for packet in packet_list.get("data"):
        packet_response = requests.get(PACKET_URL + f"?_id={packet.get("_id")}")
        append_to_diagnostics_file(diagnostics, f"Scraping packet url: {PACKET_URL + f"?_id={packet.get("_id")}"}")
        if packet_response.status_code == 200:
            questions = packet_response.json()

            result = write_questions_to_sql(questions, save_to_drive=True, diagnostics=diagnostics)
            if result and result != 1:
                if save_to_drive:
                    drive_questions.extend(result.get("drive_questions"))
                questions_written += result.get("questions_written")
                total_questions += result.get("total_questions")
            else:
                append_to_diagnostics_file(diagnostics, f"Error occurred while scraping. Check logs.")
                # Continue on, non-fatal error
        else:
            append_to_diagnostics_file(diagnostics, f"query_questions(): Error while scraping packet: code {packet_response.status_code} while querrying {url}")
            # Just continue on, one packet failed but we can keep going
        
    # Write questions to drive if need be
    if save_to_drive:
        try:
            compressed = compress_questions_to_memory(drive_questions)

            file_id = upload_compressed_to_drive(
                service,
                FOLDER_ID,
                tournament_data.get("setName"),
                compressed
            )

            append_to_diagnostics_file(diagnostics, f"UPLOADED TO DRIVE: {file_id}")
        except Exception as e:
            append_to_diagnostics_file(diagnostics, f"ERROR UPLOADING TO DRIVE --continuing: {e}")
            # Debugging

    
    append_to_diagnostics_file(diagnostics, f"Wrote {result.get("questions_written")} / {result.get("total_questions")} questions. Sleeping 2 seconds...")

    append_to_diagnostics_file(diagnostics, f"SUCCESS: Process complete. Wrote {questions_written} / {total_questions} questions.")

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

# Writes a given question dict object with bonuses and tossups to the database
def write_questions_to_sql(questions, diagnostics=False, save_to_drive=True):
    if not connection.is_connected():
        connection.reconnect()
    cursor = connection.cursor()

    base = None

    drive_questions = []

    if type(questions.get("tossups")) == dict and questions["tossups"].get("questionArray"):
        base = {"tossups": questions["tossups"]["questionArray"], "bonuses": questions["bonuses"]["questionArray"]}
    else:
        base = questions

    questions_written = 0
    total_questions = len(base.get("tossups")) + len(base.get("bonuses"))

    for tossup in base.get("tossups"):
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
            hash = generate_unique_hash()
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
        
            # Now write to the drive
            if save_to_drive:
                question_obj = {
                    "hash": hash,
                    "meta": {
                        "tournament": tournament,
                        "year": year,
                        "level": level,
                        "type": 0,
                    },
                    "classification": {
                        "category": category,
                        "subcategory": subcategory,
                        "confidence": 1.0
                    },
                    "rating": {
                        "difficulty": difficulty,
                        "mu": difficulty_mu,
                        "sigma": difficulty_sigma
                    },
                    "content": {
                        "question": question,
                        "answers": parsed_answer
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "hand_labeled": False
                }

                drive_questions.append(question_obj)
        except Exception as e:
            #TODO: Have error checking and logging for malformed data
            
            append_to_diagnostics_file(diagnostics, f"Error while creating question SQL row: {e}")
            connection.rollback()
            # Throw the error again so that the final code does notrun
            print(e)

    # TODO: add bonuses
    # The bonus element seperater is ||| and the part seperater is || and the answer seperater is |
    for bonus in base.get("bonuses"):
        # Save tossups to DB
        try:
            scraped_hex = bonus["_id"]

            # If this question is already in the database, don't write it
            query = """
            SELECT 1
            FROM questions
            WHERE scraped_hex = %s
            LIMIT 1
            """

            # Make sure we have not already scraped this exact question
            cursor.execute(query, (scraped_hex,))
            exists = cursor.fetchone() is not None

            if exists:
                append_to_diagnostics_file(diagnostics, "WRITE TO SQL: question already exists: " + scraped_hex)
                print("QUESTION EXISTS", scraped_hex)
                continue

            # Set data properties
            hash = generate_unique_hash()
            tournament = bonus["set"]["name"]
            year = bonus["set"]["year"]
            difficulty = bonus["difficulty"]
            level = bonus["difficulty"]
            category = bonus["category"].lower()
            subcategory = bonus["subcategory"].lower() or bonus["alternate_subcategory"].lower()
            question = bonus["leadin_sanitized"] + " " + "  ||| ".join(bonus["parts_sanitized"])
            answers = bonus["answers"]
            # Bonuses are normally a little easier that tossups, so subtract some mu from it
            difficulty_mu = 1000 + difficulty * 115 - 150
            difficulty_sigma = 300 - difficulty * 10

            # Parse answer into the parts "main1 || main2 || main3 ||| accept1 || NONE || accept2_1 | accept2_2 | accept2_3 ||| prompt1 || prompt2 || prompt3 ||| NONE"
            parsed_answers = " ||| ".join([parse_answer_html(answer) for answer in answers])

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
                hash, # hash
                scraped_hex, # scraped_hex
                tournament, # tournament
                1,        # type (bonus)
                year, # year
                level, # level(ms, hs, college, open)
                difficulty, # difficulty
                category, # category
                1.0, # category_confidence
                subcategory,
                question,  # question
                parsed_answers,  # answers
                datetime.now(timezone.utc), # created_at

                False, #hand_labeled
                difficulty_mu, # difficulty mu
                difficulty_sigma # difficulty sigma
            )

            # Execute and commit
            cursor.execute(query, values)
            connection.commit()
            
            # For diagnostics
            questions_written += 1;
        
            # Now write to the drive
            if save_to_drive:
                question_obj = {
                    "hash": generate_unique_hash(),
                    "meta": {
                        "scraped_hex": scraped_hex,
                        "tournament": tournament,
                        "year": year,
                        "level": level,
                        "type": 1  # bonus
                    },
                    "classification": {
                        "category": category,
                        "subcategory": subcategory,
                        "confidence": 1.0
                    },
                    "rating": {
                        "difficulty": difficulty,
                        "mu": difficulty_mu,
                        "sigma": difficulty_sigma
                    },
                    "content": {
                        "question": question,
                        "answers": parsed_answers
                    },
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "hand_labeled": False
                }

                drive_questions.append(question_obj)

        except Exception as e:
            #TODO: Have error checking and logging for malformed data
            
            append_to_diagnostics_file(diagnostics, f"Error while creating question SQL row: {e}")
            connection.rollback()
            # Throw the error again so that the final code does notrun
            print(e)

    append_to_diagnostics_file(diagnostics, f"SUCCESS: wrote {questions_written} of {total_questions} to database")
            
    cursor.close()
    connection.close()

    return {
        "questions_written": questions_written,
        "total_questions": total_questions,
        "drive_questions": drive_questions
    }

def compress_questions_to_memory(drive_questions):
    """
    Takes a Python dict/list (drive_questions),
    returns gzipped JSON as bytes in memory.
    """

    # Convert dict to JSON string
    json_string = json.dumps(drive_questions, ensure_ascii=False)

    # Create in-memory bytes buffer
    buffer = io.BytesIO()

    # Write compressed data into buffer
    with gzip.GzipFile(fileobj=buffer, mode="wb") as gz_file:
        gz_file.write(json_string.encode("utf-8"))

    # Move cursor back to start
    buffer.seek(0)

    return buffer.getvalue()

def upload_compressed_to_drive(service, folder_id, filename, compressed_bytes):

    file_metadata = {
        "name": filename,
        "parents": [folder_id]
    }

    media = MediaIoBaseUpload(
        io.BytesIO(compressed_bytes),
        mimetype="application/gzip",
        resumable=True
    )

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id"
    ).execute()

    return file.get("id")

# Parses a qbreader question based on the html tags attached to the unparsed questions and answers
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

    # Just don't do rejects

    # Fill "NONE" for empty fields
    main = accepts[0] if accepts else "NONE"
    accepts_str = ' | '.join(accepts[1:]) if len(accepts) > 1 else "NONE"
    prompts_str = ' | '.join(prompts) if prompts else "NONE"
    rejects_str = "NONE"

    return f"{main} || {accepts_str} || {prompts_str} || {rejects_str}"

# Test the parsing to see if it gets everything correct
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

        # Test bonuses
        index = 0
        html_content +="\n<h1> ===== BONUSES ====="
        for tossup in data.get("bonuses"):
            if index >= limit:
                break;
            
            question = tossup["leadin_sanitized"] + " " + " ||| ".join(tossup["parts_sanitized"])
            answers = tossup["answers"]

            # Parse answer into the parts "main1 || main2 || main3 ||| accept1 || NONE || accept2_1 | accept2_2 | accept2_3 ||| prompt1 || prompt2 || prompt3 ||| NONE"
            parsed_answers = " ||| ".join([parse_answer_html(answer) for answer in answers])


            html_content += f"""
            <h1>{question}</h1>
            <h2>{" ||| ".join(answers)}</h2>
            <h2>{parsed_answers}</h2>
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

