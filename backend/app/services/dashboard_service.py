from datetime import date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.models.attendance import AttendanceRecord
from app.schemas.dashboard import DashboardStatsResponse, StatCardMetrics, DepartmentStat, AttendanceTrendItem

class DashboardService:
    @staticmethod
    def get_dashboard_statistics(db: Session) -> DashboardStatsResponse:
        today = date.today()

        # Total active students
        total_students = db.query(Student).filter(Student.is_active == True).count()

        # Total registered faces
        registered_faces = db.query(FaceEmbedding).count()

        # Present today
        present_today = db.query(AttendanceRecord).filter(
            AttendanceRecord.attendance_date == today,
            AttendanceRecord.status == "PRESENT"
        ).count()

        absent_today = max(0, total_students - present_today)
        attendance_rate = round((present_today / total_students * 100.0), 1) if total_students > 0 else 0.0

        metrics = StatCardMetrics(
            total_students=total_students,
            registered_faces=registered_faces,
            present_today=present_today,
            absent_today=absent_today,
            attendance_percentage=attendance_rate
        )

        # Department breakdown
        dept_rows = db.query(
            Student.department,
            func.count(Student.id).label("total")
        ).filter(Student.is_active == True).group_by(Student.department).all()

        dept_stats: List[DepartmentStat] = []
        for dept_name, total_dept_students in dept_rows:
            present_dept = db.query(AttendanceRecord).join(Student).filter(
                Student.department == dept_name,
                AttendanceRecord.attendance_date == today,
                AttendanceRecord.status == "PRESENT"
            ).count()
            dept_rate = round((present_dept / total_dept_students * 100.0), 1) if total_dept_students > 0 else 0.0
            dept_stats.append(DepartmentStat(
                department=dept_name,
                total_students=total_dept_students,
                present_today=present_dept,
                attendance_percentage=dept_rate
            ))

        # 7-day attendance trend
        trend: List[AttendanceTrendItem] = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_present = db.query(AttendanceRecord).filter(
                AttendanceRecord.attendance_date == d,
                AttendanceRecord.status == "PRESENT"
            ).count()
            rate = round((day_present / total_students * 100.0), 1) if total_students > 0 else 0.0
            trend.append(AttendanceTrendItem(
                date=d.strftime("%b %d"),
                present_count=day_present,
                total_students=total_students,
                attendance_rate=rate
            ))

        return DashboardStatsResponse(
            metrics=metrics,
            department_stats=dept_stats,
            trend=trend
        )
