import csv
import io
from datetime import datetime, date, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from app.models.student import Student
from app.models.attendance import AttendanceRecord
from app.schemas.attendance import AttendanceRecordResponse, AttendanceFilterQuery
from app.schemas.student import StudentResponse
from app.core.config import settings

class AttendanceService:
    @staticmethod
    def mark_attendance(
        db: Session,
        student_id: int,
        confidence_score: float,
        liveness_score: float,
        verification_method: str = "FACE_RECOGNITION"
    ) -> Tuple[bool, str, Optional[AttendanceRecord]]:
        """
        Marks attendance for the identified student if not already marked today.
        Returns (success, message, record).
        """
        today = date.today()
        now_time = datetime.now().time()

        # Verify student exists and is active
        student = db.query(Student).filter(Student.id == student_id, Student.is_active == True).first()
        if not student:
            return False, f"Student ID {student_id} not found or inactive", None

        # Check if already marked today
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.attendance_date == today
        ).first()

        if existing_record:
            time_str = existing_record.attendance_time.strftime("%I:%M %p")
            return False, f"Attendance already recorded today for {student.full_name} ({student.usn}) at {time_str}", existing_record

        # Create new attendance record
        new_record = AttendanceRecord(
            student_id=student_id,
            attendance_date=today,
            attendance_time=now_time,
            status="PRESENT",
            confidence_score=round(confidence_score, 4),
            liveness_score=round(liveness_score, 4),
            verification_method=verification_method
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        time_str = new_record.attendance_time.strftime("%I:%M %p")
        return True, f"Attendance marked PRESENT for {student.full_name} ({student.usn}) at {time_str}", new_record

    @staticmethod
    def get_attendance_records(
        db: Session,
        filter_params: AttendanceFilterQuery
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Retrieves attendance records joined with student information with filters and pagination.
        """
        query = db.query(AttendanceRecord).join(Student, AttendanceRecord.student_id == Student.id)

        if filter_params.start_date:
            query = query.filter(AttendanceRecord.attendance_date >= filter_params.start_date)
        if filter_params.end_date:
            query = query.filter(AttendanceRecord.attendance_date <= filter_params.end_date)
        if filter_params.student_id:
            query = query.filter(AttendanceRecord.student_id == filter_params.student_id)
        if filter_params.department:
            query = query.filter(Student.department == filter_params.department)
        if filter_params.year:
            query = query.filter(Student.year == filter_params.year)
        if filter_params.status:
            query = query.filter(AttendanceRecord.status == filter_params.status)

        total_count = query.count()
        records = query.order_by(
            desc(AttendanceRecord.attendance_date),
            desc(AttendanceRecord.attendance_time)
        ).offset(filter_params.offset).limit(filter_params.limit).all()

        results = []
        for r in records:
            s = r.student
            student_resp = StudentResponse(
                id=s.id,
                usn=s.usn,
                full_name=s.full_name,
                email=s.email,
                department=s.department,
                year=s.year,
                section=s.section,
                phone=s.phone,
                is_active=s.is_active,
                has_face_registered=True,
                created_at=s.created_at,
                updated_at=s.updated_at
            )
            results.append({
                "id": r.id,
                "student_id": r.student_id,
                "student": student_resp,
                "attendance_date": str(r.attendance_date),
                "attendance_time": r.attendance_time.strftime("%H:%M:%S"),
                "status": r.status,
                "confidence_score": r.confidence_score,
                "liveness_score": r.liveness_score,
                "verification_method": r.verification_method,
                "created_at": r.created_at.isoformat()
            })

        return results, total_count

    @staticmethod
    def generate_csv_export(db: Session, filter_params: AttendanceFilterQuery) -> str:
        """
        Generates CSV format string of attendance records for download.
        """
        records, _ = AttendanceService.get_attendance_records(db, filter_params)

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Record ID", "USN", "Student Name", "Email", "Department",
            "Year", "Section", "Date", "Time", "Status",
            "Face Match Score", "Liveness Score", "Verification Method"
        ])

        for r in records:
            s = r["student"]
            writer.writerow([
                r["id"],
                s.usn,
                s.full_name,
                s.email,
                s.department,
                s.year,
                s.section,
                r["attendance_date"],
                r["attendance_time"],
                r["status"],
                f"{r['confidence_score']:.2%}",
                f"{r['liveness_score']:.2%}",
                r["verification_method"]
            ])

        return output.getvalue()
