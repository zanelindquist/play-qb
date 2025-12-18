from bs4 import BeautifulSoup
import requests
import csv
from playwright.sync_api import sync_playwright

from scraping import *
from config import *

html = False;

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
        tpacket = scrape_tournament_page(link[1:])
        break
        

    # Example: get all links
    # for row in table_rows:
    #     # Find all table data cells (<td>) within each row
    #     table_data = row.find_all('td')
        
    #     # Extract text from each <td> cell
    #     row_data = [data.get_text(strip=True) for data in table_data]
        
    #     print(row_data)

def scrape_individual_page():
    print("BEGINNING webscrape")
    tournment_packet = scrape_tournament_page("/3209/", diagnostics="logs/scrape.txt", level="College")

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
    tournament = {}
    with open(file, "r", encoding="utf-8") as f:
        tournament = json.load(f)
    tossups = 0
    bonuses = 0
    for packet in tournament.get("packets"):
        tossups += len(packet.get("tossups"))
        bonuses += len(packet.get("bonuses"))

    return {"tossups": tossups, "bonuses": bonuses}

# Get cursory information about a packet
# print(packet_information("./packets/2002 Michigan MLK.json"))

# Write an in-memory dict to the mysql database
# dict = get_json("./packets/2002 Michigan MLK.json")
# write_dict_to_sql(dict, "./logs/tosql.txt") 

# Categorize a question
question = {"question": 
            """
His battles with the Uzbeks, Persians, and the Deccan kingdoms served him well in his war of succession with his brother Dara Shikoh, whom he defeated and killed in 1658.  He expanded his empire to its zenith, but his Muslim militancy alienated Hindus and led to a series of revolts and economic crises.  When he died, the failure of his sons to resolve these issues led to the Mughal Empire’s breakup.  For 10 points – identify this man, the son of Shah Jehan.   
            """}

# print(categorize_question(question, model="400 words"))

# Categorize all questions
mutate_existing_questions("./logs/recategorize.txt")

# Find population statistics for the classifier
# find_question_points_stats(500, diagnostics="./logs/stats.txt", classifier_model="400 words")

# Scrape all questions?
# scrape_questions()
