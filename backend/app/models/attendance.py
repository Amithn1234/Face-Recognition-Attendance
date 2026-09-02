from sqlalchemy import Column, Integer, Float, String, Date, Time, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, date, time
from app.database.session import Base

class AttendanceRecord(Base):
    """
    Stores verified attendance logs with biometric scores and liveness proof.
    """
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(Date, default=date.today, nullable=False, index=True)
    attendance_time = Column(Time, default=lambda: datetime.utcnow().time(), nullable=False)
    status = Column(String(20), default="PRESENT", nullable=False)     # "PRESENT", "LATE"
    confidence_score = Column(Float, nullable=False)                   # Face similarity score (e.g. 0.88)
    liveness_score = Column(Float, nullable=False)                     # Anti-spoofing score (e.g. 0.96)
    verification_method = Column(String(50), default="FACE_RECOGNITION", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")

    # Constraint to prevent accidental duplicate logs for same student on the same calendar day
    __table_args__ = (
        UniqueConstraint('student_id', 'attendance_date', name='uq_student_attendance_date'),
    )
