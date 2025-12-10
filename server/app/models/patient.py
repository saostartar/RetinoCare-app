from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# db diinject dari package app
from app import db

class Patient(db.Model):
    """
    Model pasien tanpa identitas langsung (non-PII).
    Simpan hanya metadata klinis yang diperlukan untuk analisis.
    """
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    age = db.Column(db.Integer, nullable=True)  # usia dalam tahun
    gender = db.Column(db.String(10), nullable=True)  # 'male' | 'female' | 'other'
    diabetes_duration_years = db.Column(db.Integer, nullable=True)  # durasi DM
    hypertension = db.Column(db.Boolean, nullable=True, default=False)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relasi ke pemeriksaan
    exams = db.relationship("Exam", back_populates="patient", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "age": self.age,
            "gender": self.gender,
            "diabetes_duration_years": self.diabetes_duration_years,
            "hypertension": self.hypertension,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Patient id={self.id} age={self.age} gender={self.gender}>"