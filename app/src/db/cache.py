from src.db.db import *
from .models import *
from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case, exists, update

QUESTION_ID_CACHE = {}

def get_cached_question_ids(type=0, difficulty="all", category=11, tournament="all"):
    key = (difficulty, category, tournament, type)

    # If already cached, return immediately
    if key in QUESTION_ID_CACHE:
        return QUESTION_ID_CACHE[key]

    session = get_session()

    query = select(Questions.id)

    query = query.where(Questions.type == type)

    if difficulty != 11:
        query = query.where(Questions.difficulty == difficulty)

    # 11 is all categories
    if category != "all":
        query = query.where(Questions.category == category)

    if tournament != "all":
        query = query.where(Questions.tournament == tournament)

    ids = session.execute(query).scalars().all()

    QUESTION_ID_CACHE[key] = ids

    print(f"Cached {len(ids)} questions for {key}")

    return ids