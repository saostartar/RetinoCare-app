from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(*allowed_roles: str):
    """
    Batasi akses berdasarkan role yang tersimpan pada JWT claims ("role").
    Penggunaan:
      @jwt_required()
      @role_required("admin", "doctor")
      def endpoint(): ...
    """
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt() or {}
            role = claims.get("role")
            if role not in allowed_roles:
                return jsonify({"error": "Forbidden", "required_roles": allowed_roles, "role": role}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

def admin_required(fn):
    @wraps(fn)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt() or {}
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin only"}), 403
        return fn(*args, **kwargs)
    return decorated

def doctor_required(fn):
    @wraps(fn)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt() or {}
        if claims.get("role") not in ("doctor", "admin"):
            return jsonify({"error": "Doctor or Admin only"}), 403
        return fn(*args, **kwargs)
    return decorated