from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    usn: str = Field(..., min_length=3, max_length=20, description="University Seat Number / Roll Number")
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=2, max_length=50)
    year: str = Field(..., min_length=1, max_length=10)
    section: Optional[str] = "A"
    phone: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    is_active: bool
    has_face_registered: bool = False
    face_registered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
