from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse

class StudentService:
    @staticmethod
    def get_all_students(
        db: Session,
        search: Optional[str] = None,
        department: Optional[str] = None,
        year: Optional[str] = None,
        active_only: bool = True
    ) -> List[StudentResponse]:
        query = db.query(Student)
        if active_only:
            query = query.filter(Student.is_active == True)
        
        if department:
            query = query.filter(Student.department == department)
        if year:
            query = query.filter(Student.year == year)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Student.usn.ilike(search_pattern),
                    Student.full_name.ilike(search_pattern),
                    Student.email.ilike(search_pattern)
                )
            )
        
        students = query.order_by(Student.usn.asc()).all()
        results = []
        for s in students:
            has_face = s.face_embedding is not None
            face_reg_time = s.face_embedding.created_at if has_face else None
            results.append(StudentResponse(
                id=s.id,
                usn=s.usn,
                full_name=s.full_name,
                email=s.email,
                department=s.department,
                year=s.year,
                section=s.section,
                phone=s.phone,
                is_active=s.is_active,
                has_face_registered=has_face,
                face_registered_at=face_reg_time,
                created_at=s.created_at,
                updated_at=s.updated_at
            ))
        return results

    @staticmethod
    def get_student_by_id(db: Session, student_id: int) -> Student:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found"
            )
        return student

    @staticmethod
    def create_student(db: Session, student_in: StudentCreate) -> Student:
        # Check duplicate USN
        if db.query(Student).filter(Student.usn == student_in.usn).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student with USN '{student_in.usn}' already exists"
            )
        # Check duplicate Email
        if db.query(Student).filter(Student.email == student_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student with Email '{student_in.email}' already exists"
            )

        student = Student(
            usn=student_in.usn.strip().upper(),
            full_name=student_in.full_name.strip(),
            email=student_in.email.strip().lower(),
            department=student_in.department.strip(),
            year=student_in.year.strip(),
            section=student_in.section.strip() if student_in.section else "A",
            phone=student_in.phone.strip() if student_in.phone else None,
            is_active=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def update_student(db: Session, student_id: int, student_in: StudentUpdate) -> Student:
        student = StudentService.get_student_by_id(db, student_id)
        
        if student_in.email and student_in.email != student.email:
            if db.query(Student).filter(Student.email == student_in.email, Student.id != student_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{student_in.email}' is already in use by another student"
                )
            student.email = student_in.email.strip().lower()

        if student_in.full_name is not None:
            student.full_name = student_in.full_name.strip()
        if student_in.department is not None:
            student.department = student_in.department.strip()
        if student_in.year is not None:
            student.year = student_in.year.strip()
        if student_in.section is not None:
            student.section = student_in.section.strip()
        if student_in.phone is not None:
            student.phone = student_in.phone.strip()
        if student_in.is_active is not None:
            student.is_active = student_in.is_active

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def delete_student(db: Session, student_id: int) -> bool:
        student = StudentService.get_student_by_id(db, student_id)
        db.delete(student)
        db.commit()
        return True
