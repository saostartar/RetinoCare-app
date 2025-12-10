from datetime import datetime
from app import db


class ExamNote(db.Model):
    __tablename__ = "exam_notes"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey(
        "exams.id"), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey(
        "users.id"), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)

    # simple relationships (avoid back_populates if not yet defined on Exam/User to minimize edits)
    exam = db.relationship("Exam", backref=db.backref(
        "notes", lazy="dynamic", cascade="all, delete-orphan"))
    author = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "exam_id": self.exam_id,
            "author": {
                "id": self.author.id if self.author else None,
                "username": getattr(self.author, 'username', None),
                "role": getattr(self.author, 'role', None)
            },
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
