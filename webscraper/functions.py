from bs4 import BeautifulSoup
import requests
import csv
import os
from config import *
from PyPDF2 import PdfReader
import io
import re

def scrape_link(link):
    link = link[1:]
    print(url + link)
    response = requests.get(url + link)
    html = False;
    # Check if request was successful
    if response.status_code == 200:
        html = response.text

    soup = BeautifulSoup(html, "html.parser")

    # Get information about this set of packets
    tournament = soup.find("h1").get_text()

    p = soup.find_all("p")
    difficulty = p[0].get_text().split("Difficulty: ")[1].split(" ")[0]
    subjects = p[1].get_text().split("Subjects: ")[1]
    season = p[2].get_text().split("Season primarily used: ")[1]

    #TODO, MAKE MANIFEST WITH METADATA

    print(tournament, difficulty, subjects, season)

    # Get packet downloads
    packet_downloads = soup.find_all("li")

    for packet in packet_downloads:
        a = packet.find("a")
        text = a.get_text()
        if not text or not text.endswith(".pdf"):
            continue

        # Acutal quiz bowl packets
        href = a.get('href')
        name = text[3:-4]

        response = requests.get(href)

        reader = PdfReader(io.BytesIO(response.content))

        with open("packets/Claremont.txt", "w", encoding="utf-8") as f:
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    f.write(text)
                    f.write("\n\n")

        # Basically, we need to just cut out each question individually so that we can process and store each answer like that

        # for page in reader.pages:
        #     print(page.extract_text())


        return


    return 

def load_text_from_file(file):
    with open(file, "r", encoding="utf-8") as f:
        return f.read()

def parse_text(text):
    tossups, bonuses = text.split("Bonuses")
    # divide up the questions
    tossup_questions = re.split(r"^\d+\.\s*", tossups, flags=re.MULTILINE)[1:]
    # Remove empty strings that may appear
    tossup_questions = [re.split(r"answer: ", q.strip().replace("\n", " "), flags=re.IGNORECASE) for q in tossup_questions if q.strip()]
    print(tossup_questions[2])
    return 0;

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