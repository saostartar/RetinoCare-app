from app import db

class DetectionResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=False)
    result = db.Column(db.JSON, nullable=False)  # Format: {"class": "Mild", "confidence": 0.85}
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)