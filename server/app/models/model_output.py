from datetime import datetime
from app import db

class ModelOutput(db.Model):
    """
    Output inferensi model AI untuk sebuah pemeriksaan.
    """
    __tablename__ = "model_outputs"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id"), nullable=False)

    # Kategori DR yang terdeteksi, contoh: 'no_dr', 'mild', 'moderate', 'severe', 'proliferative'
    dr_grade = db.Column(db.String(50), nullable=True)

    # Probabilitas/keyakinan model (0.0 - 1.0)
    dr_probability = db.Column(db.Float, nullable=True)

    # Opsional: path heatmap/visualisasi
    heatmap_path = db.Column(db.String(512), nullable=True)

    # Simpan struktur hasil mentah dari model (dictionary) dalam kolom JSON
    raw_output = db.Column(db.JSON, nullable=True)

    generated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    exam = db.relationship("Exam", back_populates="outputs")

    def to_dict(self):
        return {
            "id": self.id,
            "exam_id": self.exam_id,
            "dr_grade": self.dr_grade,
            "dr_probability": self.dr_probability,
            "heatmap_path": self.heatmap_path,
            "raw_output": self.raw_output,
            "generated_at": self.generated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<ModelOutput id={self.id} exam_id={self.exam_id} grade={self.dr_grade}>"