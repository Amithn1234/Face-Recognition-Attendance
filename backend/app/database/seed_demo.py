import sys
from app.database.session import SessionLocal
from app.models.student import Student
from app.models.attendance import AttendanceRecord
from datetime import date, time, datetime, timedelta

def seed_demo_students():
    db = SessionLocal()
    try:
        demo_students = [
            {
                "usn": "1RV21CS001",
                "full_name": "Aarav Sharma",
                "email": "aarav.cs21@college.edu",
                "department": "Computer Science & Engineering",
                "year": "4th Year",
                "section": "A",
                "phone": "9876543210"
            },
            {
                "usn": "1RV21CS045",
                "full_name": "Priya Patel",
                "email": "priya.cs21@college.edu",
                "department": "Computer Science & Engineering",
                "year": "4th Year",
                "section": "B",
                "phone": "9876543211"
            },
            {
                "usn": "1RV21IS012",
                "full_name": "Rohan Verma",
                "email": "rohan.is21@college.edu",
                "department": "Information Science & Engineering",
                "year": "4th Year",
                "section": "A",
                "phone": "9876543212"
            },
            {
                "usn": "1RV22AI034",
                "full_name": "Ananya Iyer",
                "email": "ananya.ai22@college.edu",
                "department": "Artificial Intelligence & Machine Learning",
                "year": "3rd Year",
                "section": "A",
                "phone": "9876543213"
            },
            {
                "usn": "1RV22EC056",
                "full_name": "Karthik Nair",
                "email": "karthik.ec22@college.edu",
                "department": "Electronics & Communication",
                "year": "3rd Year",
                "section": "B",
                "phone": "9876543214"
            }
        ]

        added_count = 0
        for s_data in demo_students:
            exists = db.query(Student).filter(Student.usn == s_data["usn"]).first()
            if not exists:
                student = Student(**s_data, is_active=True)
                db.add(student)
                added_count += 1

        db.commit()
        print(f"Successfully seeded {added_count} sample students into MySQL.")
    except Exception as e:
        print(f"Error seeding demo students: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_students()
