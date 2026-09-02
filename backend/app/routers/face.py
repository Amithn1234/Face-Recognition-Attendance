from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import numpy as np

from app.database.session import get_db
from app.core.dependencies import get_current_admin
from app.core.config import settings
from app.models.admin import Admin
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.schemas.face import (
    FaceRegistrationRequest, FaceRegistrationResponse,
    FaceRecognitionRequest, FaceRecognitionResponse
)
from app.schemas.student import StudentResponse
from app.utils.image_utils import base64_to_cv2, check_image_blur
from app.face.detector import get_face_detector
from app.face.recognizer import get_face_recognizer
from app.face.anti_spoofing import get_anti_spoofing_classifier
from app.services.student_service import StudentService
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/face", tags=["Face Recognition & Biometrics"])

@router.post("/register", response_model=FaceRegistrationResponse)
def register_face(
    req: FaceRegistrationRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Captures, validates, aligns, and registers a student's facial biometric embedding.
    Ensures single face, sharp focus, and genuine quality before saving to MySQL.
    """
    # 1. Verify student exists
    student = StudentService.get_student_by_id(db, req.student_id)

    # 2. Decode image
    img_bgr = base64_to_cv2(req.image_base64)
    if img_bgr is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data. Could not decode base64 stream."
        )

    # 3. Quality & Blur Check
    is_sharp, blur_score = check_image_blur(img_bgr, threshold=40.0)
    if not is_sharp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image is too blurry for reliable face registration (sharpness: {blur_score:.1f} < 40.0). Please hold still in good lighting."
        )

    # 4. Face Detection
    detector = get_face_detector()
    faces = detector.detect_faces(img_bgr)

    if len(faces) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in the frame. Please look directly at the camera."
        )
    if len(faces) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Multiple faces ({len(faces)}) detected in the frame. Exactly one person must be present during registration."
        )

    face_info = faces[0]
    bbox = face_info["bbox"]
    det_score = face_info["score"]
    raw_face = face_info["raw_face"]

    # Face size validation
    h, w, _ = img_bgr.shape
    face_w, face_h = bbox[2], bbox[3]
    if face_w < 60 or face_h < 60:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face is too far from camera. Please move closer to the camera."
        )

    # 5. Extract Feature Embedding
    recognizer = get_face_recognizer()
    embedding_vector = recognizer.extract_embedding(img_bgr, raw_face)

    # Calculate overall quality score [0.0 - 1.0]
    quality_score = float(min(1.0, (det_score * 0.5) + (min(blur_score, 200.0) / 200.0 * 0.5)))

    # 6. Store in MySQL
    existing_embedding = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).first()
    if existing_embedding:
        existing_embedding.set_numpy_embedding(embedding_vector)
        existing_embedding.quality_score = quality_score
        existing_embedding.model_name = "sface_2021dec"
    else:
        new_embedding = FaceEmbedding(
            student_id=student.id,
            quality_score=quality_score,
            model_name="sface_2021dec"
        )
        new_embedding.set_numpy_embedding(embedding_vector)
        db.add(new_embedding)

    db.commit()

    student_response = StudentResponse(
        id=student.id,
        usn=student.usn,
        full_name=student.full_name,
        email=student.email,
        department=student.department,
        year=student.year,
        section=student.section,
        phone=student.phone,
        is_active=student.is_active,
        has_face_registered=True,
        face_registered_at=student.created_at,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

    return FaceRegistrationResponse(
        success=True,
        message=f"Face biometric registered successfully for {student.full_name} ({student.usn})",
        student=student_response,
        quality_score=quality_score
    )

@router.post("/recognize", response_model=FaceRecognitionResponse)
def recognize_and_mark_attendance(
    req: FaceRecognitionRequest,
    db: Session = Depends(get_db)
):
    """
    Real-time face recognition and attendance endpoint.
    Workflow:
    1. Detect face in frame
    2. Deep learning anti-spoofing / liveness test (MiniFASNet + Fourier)
    3. If spoof/fake -> reject immediately
    4. Extract face embedding
    5. Compare against all registered student embeddings using Cosine Similarity
    6. If best match >= threshold -> mark attendance in MySQL
    """
    # 1. Decode image
    img_bgr = base64_to_cv2(req.image_base64)
    if img_bgr is None:
        return FaceRecognitionResponse(
            face_detected=False,
            is_live=False,
            liveness_score=0.0,
            student_identified=False,
            message="Invalid image payload"
        )

    # 2. Detect face
    detector = get_face_detector()
    faces = detector.detect_faces(img_bgr)
    if len(faces) == 0:
        return FaceRecognitionResponse(
            face_detected=False,
            is_live=False,
            liveness_score=0.0,
            student_identified=False,
            message="No face detected in camera view"
        )

    # Primary face (largest in frame)
    face_info = faces[0]
    bbox = face_info["bbox"]
    raw_face = face_info["raw_face"]

    # 3. Anti-Spoofing / Liveness Check
    anti_spoof = get_anti_spoofing_classifier()
    is_live, liveness_score, liveness_details = anti_spoof.check_liveness(img_bgr, bbox)

    if not is_live:
        return FaceRecognitionResponse(
            face_detected=True,
            is_live=False,
            liveness_score=liveness_score,
            student_identified=False,
            message="Spoof detected! Presentation attack rejected (Photo/Screen/Replay)."
        )

    # 4. Extract Face Embedding
    recognizer = get_face_recognizer()
    query_embedding = recognizer.extract_embedding(img_bgr, raw_face)

    # 5. Retrieve all registered student face embeddings
    registered_embeddings = db.query(FaceEmbedding).join(Student).filter(Student.is_active == True).all()
    if len(registered_embeddings) == 0:
        return FaceRecognitionResponse(
            face_detected=True,
            is_live=True,
            liveness_score=liveness_score,
            student_identified=False,
            message="No students have registered face biometrics yet in the database."
        )

    best_match_student = None
    best_similarity = -1.0

    for record in registered_embeddings:
        known_vector = record.get_numpy_embedding()
        similarity = recognizer.match_embeddings(query_embedding, known_vector)
        if similarity > best_similarity:
            best_similarity = similarity
            best_match_student = record.student

    # 6. Apply threshold
    threshold = settings.FACE_SIMILARITY_THRESHOLD
    if best_similarity < threshold or best_match_student is None:
        return FaceRecognitionResponse(
            face_detected=True,
            is_live=True,
            liveness_score=liveness_score,
            student_identified=False,
            confidence_score=round(float(best_similarity), 4),
            message=f"Unrecognized face (similarity {best_similarity:.2f} < threshold {threshold:.2f})"
        )

    # 7. Student identified! Mark attendance if requested
    attendance_marked = False
    attendance_status = None
    attendance_msg = f"Recognized {best_match_student.full_name} ({best_match_student.usn})"

    if req.mark_attendance:
        marked, att_msg, att_record = AttendanceService.mark_attendance(
            db=db,
            student_id=best_match_student.id,
            confidence_score=best_similarity,
            liveness_score=liveness_score
        )
        attendance_marked = marked
        attendance_status = att_record.status if att_record else "PRESENT"
        attendance_msg = att_msg

    student_response = StudentResponse(
        id=best_match_student.id,
        usn=best_match_student.usn,
        full_name=best_match_student.full_name,
        email=best_match_student.email,
        department=best_match_student.department,
        year=best_match_student.year,
        section=best_match_student.section,
        phone=best_match_student.phone,
        is_active=best_match_student.is_active,
        has_face_registered=True,
        created_at=best_match_student.created_at,
        updated_at=best_match_student.updated_at
    )

    return FaceRecognitionResponse(
        face_detected=True,
        is_live=True,
        liveness_score=round(liveness_score, 4),
        student_identified=True,
        student=student_response,
        confidence_score=round(float(best_similarity), 4),
        attendance_marked=attendance_marked,
        attendance_status=attendance_status,
        message=attendance_msg
    )
