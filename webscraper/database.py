import os
from dotenv import load_dotenv
import mysql.connector
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# Load ENV variables for the database connection
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.prod')
load_dotenv(env_path)
# Read variables from environment
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')

# Optionally, also get SQLAlchemy URL if needed
DATABASE_URL = os.getenv('DATABASE_URL')

# Connect to MySQL
connection = mysql.connector.connect(
    # The docker container db should be exposed to the local host
    host="127.0.0.1",
    port=MYSQL_PORT,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)

print(f"Connected to {MYSQL_DATABASE} at {MYSQL_HOST}:{MYSQL_PORT} as {MYSQL_USER}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()