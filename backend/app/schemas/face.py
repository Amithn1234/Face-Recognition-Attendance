from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.student import StudentResponse

class FaceRegistrationRequest(BaseModel):
    student_id: int
    image_base64: str = Field(..., description="Base64 encoded JPEG/PNG image captured from webcam")

class FaceRegistrationResponse(BaseModel):
    success: bool
    message: str
    student: StudentResponse
    quality_score: float

class FaceRecognitionRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG/PNG frame captured from webcam")
    mark_attendance: bool = True

class FaceRecognitionResponse(BaseModel):
    face_detected: bool
    is_live: bool
    liveness_score: float
    student_identified: bool
    student: Optional[StudentResponse] = None
    confidence_score: float = 0.0
    attendance_marked: bool = False
    attendance_status: Optional[str] = None
    message: str
