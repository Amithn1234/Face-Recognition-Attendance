from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Student(Base):
    """
    Student model representing enrolled students.
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usn = Column(String(20), unique=True, index=True, nullable=False)  # University Seat Number / Roll No
    full_name = Column(String(100), nullable=False, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False, index=True)       # e.g., "Computer Science", "Information Science"
    year = Column(String(10), nullable=False, index=True)             # e.g., "4th Year", "3rd Year"
    section = Column(String(10), nullable=True, default="A")          # e.g., "A", "B", "C"
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    face_embedding = relationship("FaceEmbedding", back_populates="student", uselist=False, cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
