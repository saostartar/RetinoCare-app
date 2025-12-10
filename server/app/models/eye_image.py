from app import db
from datetime import datetime
import os


class EyeImage(db.Model):
    __tablename__ = "eye_images"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)
    eye_side = db.Column(db.String(20), nullable=False, default="unknown")
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    exam = db.relationship("Exam", back_populates="images")

    def to_dict(self):
        # Extract filename dari path untuk digunakan di frontend
        filename = None
        if self.file_path:
            # Handle both Windows dan Unix paths
            if '\\' in self.file_path:
                filename = self.file_path.split('\\')[-1]
            else:
                filename = self.file_path.split('/')[-1]
        # Build public serving URL (backend clinical blueprint mounted at /api)
        image_url = None
        if filename:
            # The uploaded_file route is registered under clinical blueprint at /api/uploads/<filename>
            image_url = f"/api/uploads/{filename}"

        return {
            "id": self.id,
            "exam_id": self.exam_id,
            "eye_side": self.eye_side,
            "file_path": self.file_path,
            "filename": filename,
            "image_url": image_url,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
