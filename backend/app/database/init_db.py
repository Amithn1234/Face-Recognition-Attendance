import sys
import pymysql
from sqlalchemy import create_engine
from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.models.admin import Admin
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.models.attendance import AttendanceRecord
from app.models.setting import SystemSetting
from app.core.security import get_password_hash

def create_database_if_not_exists():
    """
    Connects to MySQL server without database specified to create `smart_attendance_db`
    if it does not already exist.
    """
    try:
        connection = pymysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            port=settings.DB_PORT,
            charset='utf8mb4'
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"Database '{settings.DB_NAME}' created or already exists.")
        connection.commit()
        connection.close()
        return True
    except Exception as e:
        print(f"Error creating database '{settings.DB_NAME}': {e}")
        return False

def init_db():
    """
    Creates all tables in MySQL and seeds the initial default Admin account.
    """
    print("Step 1: Ensuring MySQL Database exists...")
    create_database_if_not_exists()

    print("Step 2: Creating all tables defined in SQLAlchemy ORM models...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    print("Step 3: Seeding initial Admin user...")
    db = SessionLocal()
    try:
        # Check if any admin exists
        existing_admin = db.query(Admin).first()
        if not existing_admin:
            default_admin = Admin(
                username="admin",
                email="admin@college.edu",
                hashed_password=get_password_hash("Admin@123"),
                full_name="System Administrator",
                role="superadmin",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print("Default admin created: username='admin', password='Admin@123', email='admin@college.edu'")
        else:
            print(f"Admin already exists: {existing_admin.username}")

        # Seed initial system settings
        default_settings = {
            "FACE_SIMILARITY_THRESHOLD": str(settings.FACE_SIMILARITY_THRESHOLD),
            "LIVENESS_THRESHOLD": str(settings.LIVENESS_THRESHOLD),
            "ATTENDANCE_COOLDOWN_MINUTES": str(settings.ATTENDANCE_COOLDOWN_MINUTES),
            "INSTITUTION_NAME": "Department of Computer Science & Engineering"
        }
        for key, val in default_settings.items():
            existing_setting = db.query(SystemSetting).filter(SystemSetting.key_name == key).first()
            if not existing_setting:
                db.add(SystemSetting(key_name=key, key_value=val, description=f"Default {key}"))
        db.commit()
        print("Default system settings seeded.")
    except Exception as e:
        print(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
