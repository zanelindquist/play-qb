import mysql.connector
from mysql.connector import Error

from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

from datetime import datetime, timezone

class CreatedAtColumn:
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

env = dict(os.environ.items())

Base = declarative_base()

host =env["MYSQL_HOST"]
user=env["MYSQL_USER"]
password=env["MYSQL_PASSWORD"]
database=env["MYSQL_DATABASE"]
port=env["MYSQL_PORT"]

db_url = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"

print(db_url)

engine = create_engine(db_url, echo=True)

def init_db():
    try:
        global engine
        connection = mysql.connector.connect(
            host=host, user=user, password=password, database=database, port=port
        )

        if connection.is_connected():
            print(f"Connection successful at {db_url}")

        Base.metadata.create_all(engine)
    except Exception as e:
        print(f'Error: {e}')