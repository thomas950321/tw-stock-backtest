import sys
import os
# Ensure app module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, Base
from app import models

def init_db():
    print("🚀 Initializing MySQL database tables...")
    try:
        # This will create all tables defined in models.py
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully in MySQL!")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")

if __name__ == "__main__":
    init_db()
