from datetime import datetime
from app import db

class Exam(db.Model):
    """
    Model pemeriksaan yang menghubungkan pasien, operator/dokter (user) dan artefak analisis.
    """
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Status alur: 'created' | 'image_uploaded' | 'analyzing' | 'completed' | 'failed'
    status = db.Column(db.String(50), nullable=False, default="created")

    # Ringkasan hasil (opsional, diisi saat selesai)
    result_summary = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi
    patient = db.relationship("Patient", back_populates="exams")
    user = db.relationship("User", back_populates="exams")
    images = db.relationship("EyeImage", back_populates="exam", cascade="all, delete-orphan")
    outputs = db.relationship("ModelOutput", back_populates="exam", cascade="all, delete-orphan")

    def to_dict(self, include_related: bool = True):
        base = {
            "id": self.id,
            "patient_id": self.patient_id,
            "user_id": self.user_id,
            "status": self.status,
            "result_summary": self.result_summary,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_related:
            base["patient"] = self.patient.to_dict() if self.patient else None
            base["images"] = [img.to_dict() for img in self.images]
            base["outputs"] = [out.to_dict() for out in self.outputs]
        return base

    def __repr__(self) -> str:
        return f"<Exam id={self.id} patient_id={self.patient_id} status={self.status}>"