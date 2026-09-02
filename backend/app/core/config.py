import os
import urllib.parse
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Face Recognition & Smart Attendance System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "root@123"
    DB_NAME: str = "smart_attendance_db"

    @property
    def DATABASE_URL(self) -> str:
        # URL encode username and password to safely handle special characters like '@'
        encoded_user = urllib.parse.quote_plus(self.DB_USER)
        encoded_pwd = urllib.parse.quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{encoded_user}:{encoded_pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    # JWT Authentication
    JWT_SECRET: str = "super_secret_attendance_system_key_2026_cse_project_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Face Recognition Thresholds
    FACE_SIMILARITY_THRESHOLD: float = 0.60
    LIVENESS_THRESHOLD: float = 0.85
    ATTENDANCE_COOLDOWN_MINUTES: int = 60

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Model Weights Directory
    MODELS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models_weights"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
