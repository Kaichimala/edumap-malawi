import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

# SQLAlchemy 2.0 requires postgresql+psycopg:// for psycopg3
if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://").replace("postgresql://", "postgresql+psycopg://")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT ST_SRID(geometry) FROM mwi_districts LIMIT 1;")).fetchone()
        print(f"mwi_districts SRID: {res[0] if res else 'None'}")
        
        res = conn.execute(text("SELECT ST_SRID(geometry) FROM mwi_roads LIMIT 1;")).fetchone()
        print(f"mwi_roads SRID: {res[0] if res else 'None'}")
        
        print("Connection successful!")
except Exception as e:
    print(f"Error: {e}")
