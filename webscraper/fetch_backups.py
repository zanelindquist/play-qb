import argparse
import gzip
import io
import json
import os
from datetime import datetime, timezone

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from .database import *
from .utils import *

BASE_DIR = os.path.dirname(__file__)
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'credentials/play-qb-8685a16b87c1.json')
OAUTH_CLIENT_SECRETS_FILE = os.path.join(BASE_DIR, 'credentials/oauth-client.json')
TOKEN_PATH = os.path.join(BASE_DIR, 'credentials/token.pickle')
FOLDER_ID = '1O8vUu3j-5RlBdoyheuWhRDFHpcmK8tzj'


def get_drive_service():
    """Build a Google Drive service using service account credentials first, then fallback to user OAuth."""
    creds = None

    if os.path.exists(SERVICE_ACCOUNT_FILE):
        try:
            creds = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE,
                scopes=SCOPES,
            )
        except Exception:
            creds = None

    if not creds and os.path.exists(OAUTH_CLIENT_SECRETS_FILE):
        if os.path.exists(TOKEN_PATH):
            with open(TOKEN_PATH, 'rb') as token_file:
                creds = pickle.load(token_file)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    OAUTH_CLIENT_SECRETS_FILE,
                    scopes=SCOPES,
                )
                creds = flow.run_local_server(port=0)

            with open(TOKEN_PATH, 'wb') as token_file:
                pickle.dump(creds, token_file)

    if not creds:
        raise RuntimeError('No valid credentials found for Google Drive access.')

    return build('drive', 'v3', credentials=creds)


def list_backup_files(service, folder_id=FOLDER_ID):
    query = f"'{folder_id}' in parents and trashed = false"
    files = []
    page_token = None

    while True:
        response = service.files().list(
            q=query,
            fields='nextPageToken, files(id, name, mimeType, size, createdTime)',
            pageToken=page_token,
            pageSize=100,
        ).execute()

        files.extend(response.get('files', []))
        page_token = response.get('nextPageToken')
        if not page_token:
            break

    return files


def download_file_bytes(service, file_id):
    request = service.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()

    buffer.seek(0)
    return buffer.getvalue()


def load_gzip_json_bytes(bytes_data):
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(bytes_data), mode='rb') as gz:
            return json.loads(gz.read().decode('utf-8'))
    except OSError:
        return json.loads(bytes_data.decode('utf-8'))


def safe_int(value, default=None):
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default=None):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_iso_datetime(value):
    if not value:
        return datetime.now(timezone.utc)

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        try:
            if value.endswith('Z'):
                value = value[:-1] + '+00:00'
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.now(timezone.utc)

    return datetime.now(timezone.utc)


def question_row_values(question_obj):
    meta = question_obj.get('meta', {}) or {}
    classification = question_obj.get('classification', {}) or {}
    rating = question_obj.get('rating', {}) or {}
    content = question_obj.get('content', {}) or {}

    return (
        question_obj.get('hash') or generate_unique_hash(),
        meta.get('scraped_hex'),
        meta.get('tournament') or 'Unknown Tournament',
        safe_int(meta.get('type'), 0),
        str(meta.get('year')) if meta.get('year') is not None else None,
        safe_int(meta.get('level'), 0),
        safe_int(rating.get('difficulty'), 0),
        (classification.get('category') or 'Unknown').lower(),
        safe_float(classification.get('confidence'), 0.0),
        classification.get('subcategory'),
        content.get('question') or '',
        content.get('answers') or '',
        parse_iso_datetime(question_obj.get('created_at')),
        bool(question_obj.get('hand_labeled', False)),
        safe_float(rating.get('mu'), 1500.0),
        safe_float(rating.get('sigma'), 400.0),
    )


def save_questions_to_database(question_list, diagnostics=None):
    if not isinstance(question_list, list):
        raise ValueError('Expected a list of question objects.')

    cursor = connection.cursor()
    insert_query = '''
        INSERT IGNORE INTO questions (
            hash, scraped_hex, tournament, type, year, level,
            difficulty, category, category_confidence, subcategory, question, answers,
            created_at, hand_labeled, difficulty_mu, difficulty_sigma
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    '''

    inserted = 0
    skipped = 0

    for entry in question_list:
        try:
            values = question_row_values(entry)
            if not values[10] or not values[11]:
                skipped += 1
                continue

            cursor.execute(insert_query, values)
            if cursor.rowcount == 1:
                inserted += 1
        except Exception as exc:
            if diagnostics:
                append_to_diagnostics_file(diagnostics, f'ERROR inserting question: {exc}')
            connection.rollback()
            continue

    connection.commit()
    cursor.close()
    return {'inserted': inserted, 'skipped': skipped, 'total': len(question_list)}


def restore_backup_file(service, file_id, diagnostics=None):
    raw_bytes = download_file_bytes(service, file_id)
    questions = load_gzip_json_bytes(raw_bytes)

    if diagnostics:
        append_to_diagnostics_file(diagnostics, f'Restoring backup file {file_id} with {len(questions)} questions')

    stats = save_questions_to_database(questions, diagnostics=diagnostics)

    if diagnostics:
        append_to_diagnostics_file(diagnostics, f"Finished restoring file {file_id}: {stats['inserted']} inserted, {stats['skipped']} skipped, {stats['total']} total")

    return stats


def restore_backups(folder_id=FOLDER_ID, file_id=None, file_name=None, limit=None, diagnostics=None):
    service = get_drive_service()
    if file_id or file_name:
        files = list_backup_files(service, folder_id)
        if file_name:
            files = [f for f in files if f.get('name') == file_name]
            if not files:
                raise FileNotFoundError(f'No backup file named "{file_name}" found in folder {folder_id}')

        if file_id:
            files = [f for f in files if f.get('id') == file_id]
            if not files:
                raise FileNotFoundError(f'No backup file with id "{file_id}" found in folder {folder_id}')

        selected_files = files[:1]
    else:
        selected_files = list_backup_files(service, folder_id)
        if limit:
            selected_files = selected_files[:limit]

    results = []
    for file_meta in selected_files:
        if diagnostics:
            append_to_diagnostics_file(diagnostics, f"Restoring {file_meta.get('name')} ({file_meta.get('id')})")

        result = restore_backup_file(service, file_meta.get('id'), diagnostics=diagnostics)
        results.append({'file': file_meta, 'result': result})

    return results


def fetch_backups():
    parser = argparse.ArgumentParser(description='Fetch question backups from Google Drive and save them to MySQL.')
    parser.add_argument('--folder-id', default=FOLDER_ID, help='Google Drive folder id that contains backup files.')
    parser.add_argument('--file-id', help='Restore only the backup with this file id.')
    parser.add_argument('--file-name', help='Restore only the backup with this exact file name.')
    parser.add_argument('--list', action='store_true', help='List backup files in the folder and exit.')
    parser.add_argument('--limit', type=int, help='Limit the number of backup files restored.')
    parser.add_argument('--diagnostics', default='./logs/fetch_backups.txt', help='Optional diagnostics log file path.')
    args = parser.parse_args()

    service = get_drive_service()

    if args.list:
        files = list_backup_files(service, folder_id=args.folder_id)
        for item in files:
            print(f"{item['id']}\t{item['name']}\t{item.get('mimeType')}\t{item.get('size')}\t{item.get('createdTime')}")
        return

    results = restore_backups(
        folder_id=args.folder_id,
        file_id=args.file_id,
        file_name=args.file_name,
        limit=args.limit,
        diagnostics=args.diagnostics,
    )

    for item in results:
        file_meta = item['file']
        stats = item['result']
        print(f"Restored {file_meta.get('name')} ({file_meta.get('id')}): {stats['inserted']} inserted, {stats['skipped']} skipped, {stats['total']} total")

