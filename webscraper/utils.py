import json
import random
import string
from datetime import datetime, timezone
import os
from pathlib import Path


def get_json(file_path, base_dir=None):
    """
    Load a JSON file using an absolute path.

    Parameters:
    - file_path (str | Path): path to JSON file (relative or absolute)
    - base_dir (Path | None): directory to resolve relative paths from
                              (defaults to this file's directory)

    Returns:
    - dict
    """
    if base_dir is None:
        base_dir = Path(__file__).resolve().parent

    file_path = Path(file_path)

    if not file_path.is_absolute():
        file_path = base_dir / file_path

    if not file_path.exists():
        raise FileNotFoundError(f"JSON file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
    
def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))

def append_to_diagnostics_file(file, message):
    # Resolve relative paths to absolute paths
    if file.startswith("./") or file.startswith(".\\"):
        # Make it relative to this script's directory
        base_dir = os.path.dirname(__file__)
        file_address = os.path.join(base_dir, file[2:])
    else:
        file_address = file  # absolute path or other relative path

    # Ensure the directory exists
    os.makedirs(os.path.dirname(file_address), exist_ok=True)

    utc_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(file_address, "a") as f:
        f.write(f"{utc_now} --- {message}\n")

import json
from pathlib import Path

def update_model_stats(json_file_path, param_dict, save=True):
    """
    Updates the statistics of classifier models stored in a JSON file.

    Parameters:
    - json_file_path (str | Path): path relative to THIS FILE or absolute
    - param_dict (dict): parameters to update
    - save (bool): whether to save changes

    Returns:
    - updated_data (dict)
    """

    # 🔒 Anchor relative paths to this module's directory
    base_dir = Path(__file__).resolve().parent

    json_file_path = Path(json_file_path)

    if not json_file_path.is_absolute():
        json_file_path = base_dir / json_file_path

    json_file_path = json_file_path.resolve()

    # 1️⃣ Load existing JSON
    if not json_file_path.exists():
        raise FileNotFoundError(f"File not found: {json_file_path}")

    with json_file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # 2️⃣ Update statistics
    for model_name, stats in param_dict.items():
        if model_name in data:
            data[model_name].update(stats)
        else:
            data[model_name] = stats

    # 3️⃣ Save back to JSON
    if save:
        with json_file_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    return data


def remove_whitespace(text):
    if not text:  # handle None or empty string
        return ""
    return text.strip()