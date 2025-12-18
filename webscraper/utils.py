import json
import random
import string
from datetime import datetime, timezone

def get_json(file):
    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)
    
def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))

def append_to_diagnostics_file(file, message):
    utc_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(file, "a") as f:
        f.write(f"{utc_now} --- {message}\n")
