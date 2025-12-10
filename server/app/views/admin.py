from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.patient import Patient
from app.models.exam import Exam
from app.models.eye_image import EyeImage
from app.models.model_output import ModelOutput
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def list_users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify({
        "items": [
            {"id": u.id, "username": u.username, "email": u.email, "role": u.role}
            for u in users
        ]
    }), 200

@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
@admin_required
def update_user_role(user_id: int):
    data = request.get_json() or {}
    new_role = (data.get("role") or "").strip()
    if new_role not in ("admin", "doctor", "operator"):
        return jsonify({"error": "Invalid role. Allowed: admin, doctor, operator"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": f"User {user_id} not found"}), 404

    user.role = new_role
    db.session.commit()
    return jsonify({"message": "Role updated", "user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role}}), 200

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def stats():
    total_users = db.session.query(func.count(User.id)).scalar()
    total_patients = db.session.query(func.count(Patient.id)).scalar()
    total_exams = db.session.query(func.count(Exam.id)).scalar()
    total_images = db.session.query(func.count(EyeImage.id)).scalar()
    total_outputs = db.session.query(func.count(ModelOutput.id)).scalar()

    # Aggregasi status exam
    status_counts = dict(
        db.session.query(Exam.status, func.count(Exam.id))
        .group_by(Exam.status)
        .all()
    )

    # 5 terbaru
    latest_exams = (
        Exam.query.order_by(Exam.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "totals": {
            "users": total_users,
            "patients": total_patients,
            "exams": total_exams,
            "images": total_images,
            "outputs": total_outputs,
        },
        "exams_by_status": status_counts,
        "latest_exams": [e.to_dict(include_related=False) for e in latest_exams],
    }), 200