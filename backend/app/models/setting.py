from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database.session import Base

class SystemSetting(Base):
    """
    Dynamic system configuration stored in DB (e.g., threshold overrides, institute name).
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key_name = Column(String(50), unique=True, index=True, nullable=False)
    key_value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
