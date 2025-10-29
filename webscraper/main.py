from bs4 import BeautifulSoup
import requests
import csv
from playwright.sync_api import sync_playwright

from functions import *
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

    table_rows = soup.find_all('tr')
    links = soup.find_all("a")

    valid_links = []

    for link in links:
        href = link.get("href")
        if href and len(href) > 1 and href[0] == "/" and href[1].isdigit():
            # This is a valid link that we would like to explore
            valid_links.append(href)

    for link in valid_links:
        scrape_tournament_page(link[1:])
        break
        

    # Example: get all links
    # for row in table_rows:
    #     # Find all table data cells (<td>) within each row
    #     table_data = row.find_all('td')
        
    #     # Extract text from each <td> cell
    #     row_data = [data.get_text(strip=True) for data in table_data]
        
    #     print(row_data)

# scrape_questions()
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
