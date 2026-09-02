from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, USN, or email"),
    department: Optional[str] = Query(None, description="Filter by department"),
    year: Optional[str] = Query(None, description="Filter by academic year"),
    active_only: bool = Query(True, description="Return active students only"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get all registered students with face registration status.
    """
    return StudentService.get_all_students(
        db, search=search, department=department, year=year, active_only=active_only
    )

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Register a new student in the system.
    """
    student = StudentService.create_student(db, student_in)
    return StudentResponse(
        id=student.id,
        usn=student.usn,
        full_name=student.full_name,
        email=student.email,
        department=student.department,
        year=student.year,
        section=student.section,
        phone=student.phone,
        is_active=student.is_active,
        has_face_registered=False,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get a student by ID.
    """
    student = StudentService.get_student_by_id(db, student_id)
    has_face = student.face_embedding is not None
    face_time = student.face_embedding.created_at if has_face else None
    return StudentResponse(
        id=student.id,
        usn=student.usn,
        full_name=student.full_name,
        email=student.email,
        department=student.department,
        year=student.year,
        section=student.section,
        phone=student.phone,
        is_active=student.is_active,
        has_face_registered=has_face,
        face_registered_at=face_time,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Update student details.
    """
    student = StudentService.update_student(db, student_id, student_in)
    has_face = student.face_embedding is not None
    face_time = student.face_embedding.created_at if has_face else None
    return StudentResponse(
        id=student.id,
        usn=student.usn,
        full_name=student.full_name,
        email=student.email,
        department=student.department,
        year=student.year,
        section=student.section,
        phone=student.phone,
        is_active=student.is_active,
        has_face_registered=has_face,
        face_registered_at=face_time,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.delete("/{student_id}", status_code=status.HTTP_200_OK)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Delete student and cascading face embedding & attendance records.
    """
    StudentService.delete_student(db, student_id)
    return {"success": True, "message": f"Student {student_id} deleted successfully"}
