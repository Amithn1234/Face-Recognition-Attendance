from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, LargeBinary, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import json
import numpy as np
from app.database.session import Base

class FaceEmbedding(Base):
    """
    Stores the 128-d or 512-d normalized face feature vector for a registered student.
    Provides utility methods to convert to and from numpy float32 arrays.
    """
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    embedding_json = Column(Text, nullable=False)                      # Stored as JSON array of floats for transparency & portability
    quality_score = Column(Float, nullable=False, default=1.0)         # Face quality score (0.0 to 1.0)
    model_name = Column(String(50), default="sface_2021dec", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="face_embedding")

    def get_numpy_embedding(self) -> np.ndarray:
        """Returns the embedding vector as a normalized 1D float32 numpy array."""
        vector = np.array(json.loads(self.embedding_json), dtype=np.float32)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector

    def set_numpy_embedding(self, array: np.ndarray):
        """Sets the embedding JSON string from a numpy array."""
        if isinstance(array, np.ndarray):
            array = array.flatten().astype(float).tolist()
        self.embedding_json = json.dumps(array)
