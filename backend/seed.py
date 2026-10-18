"""
Seed database with synthetic demonstration data
Run: python seed.py
"""

from app.db.session import SessionLocal
from app.services.seed_data import seed_complete_database


def main():
    db = SessionLocal()
    try:
        seed_complete_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
