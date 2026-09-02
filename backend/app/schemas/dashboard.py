from pydantic import BaseModel
from typing import List, Dict, Any

class StatCardMetrics(BaseModel):
    total_students: int
    registered_faces: int
    present_today: int
    absent_today: int
    attendance_percentage: float

class DepartmentStat(BaseModel):
    department: str
    total_students: int
    present_today: int
    attendance_percentage: float

class AttendanceTrendItem(BaseModel):
    date: str
    present_count: int
    total_students: int
    attendance_rate: float

class DashboardStatsResponse(BaseModel):
    metrics: StatCardMetrics
    department_stats: List[DepartmentStat]
    trend: List[AttendanceTrendItem]
