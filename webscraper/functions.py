from bs4 import BeautifulSoup
import requests
import csv
import os
from config import *
from PyPDF2 import PdfReader
import io
import re
from datetime import datetime
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

def write_data(rows):
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

def dict_to_sql(dict):
    meta = dict["tournament_metadata"]

    tournament = meta["name"]
    level = meta["level"]
    difficulty = meta["difficulty"]
    subjects = meta["subjects"]
    season = meta["season"]
    packet_length = meta["packet_length"]

    for packet in dict.get("packets"):
        # Save tossups to DB
        print(packet["name"])
        # Save bonuess to DB
    

    return {"status": 200, "message": "Success!"}

