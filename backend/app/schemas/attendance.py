from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.schemas.student import StudentResponse

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student: Optional[StudentResponse] = None
    attendance_date: date
    attendance_time: time
    status: str
    confidence_score: float
    liveness_score: float
    verification_method: str
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceFilterQuery(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    student_id: Optional[int] = None
    department: Optional[str] = None
    year: Optional[str] = None
    status: Optional[str] = None
    limit: int = 100
    offset: int = 0
