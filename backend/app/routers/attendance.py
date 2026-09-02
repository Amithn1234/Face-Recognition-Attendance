from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.attendance import AttendanceRecordResponse, AttendanceFilterQuery
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("", response_model=dict)
def get_attendance_history(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    student_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Query attendance records with date range, student, department, and status filters.
    """
    filter_params = AttendanceFilterQuery(
        start_date=start_date,
        end_date=end_date,
        student_id=student_id,
        department=department,
        year=year,
        status=status,
        limit=limit,
        offset=offset
    )
    records, total_count = AttendanceService.get_attendance_records(db, filter_params)
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "records": records
    }

@router.get("/export")
def export_attendance_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Exports filtered attendance records as a downloadable CSV spreadsheet.
    """
    filter_params = AttendanceFilterQuery(
        start_date=start_date,
        end_date=end_date,
        department=department,
        year=year,
        status=status,
        limit=10000,
        offset=0
    )
    csv_data = AttendanceService.generate_csv_export(db, filter_params)
    filename = f"attendance_export_{date.today().isoformat()}.csv"
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
