from flask import request, jsonify
from app.models.user import User
from app import db
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

def register():
    """
    Registrasi pengguna baru.
    Role akan mengikuti default dari model User (operator).
    """
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "username, email, dan password wajib diisi"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email sudah terdaftar"}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registrasi berhasil"}), 201

def login():
    """
    Login pengguna.
    - Jika sukses, kembalikan access_token dan refresh_token.
    - Tambahkan role user ke dalam JWT additional_claims agar bisa dipakai otorisasi.
    """
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "email dan password wajib diisi"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Email atau password salah"}), 401

    # Sertakan role pada claims token
    additional_claims = {"role": user.role}

    # Catatan: identity diset ke string agar kompatibel dengan kode lama.
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)
    
    return jsonify({
        "message": "Login berhasil",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,  # expose role agar frontend bisa menyesuaikan UI
        }
    }), 200

@jwt_required()
def logout():
    """
    Endpoint placeholder untuk logout di sisi server.
    Jika diperlukan, implementasikan token revocation/blacklist.
    """
    return jsonify({"message": "Logout berhasil"}), 200

# Refresh access token dengan mewariskan role terbaru dari user.
@jwt_required(refresh=True)
def refresh():
    """
    Menghasilkan access token baru dari refresh token.
    - Muat kembali user dari DB untuk memastikan role terbaru ikut dipakai.
    """
    current_user_id = get_jwt_identity()
    try:
        user = User.query.get(int(current_user_id))
    except (TypeError, ValueError):
        user = None

    if not user:
        return jsonify({"error": "User tidak ditemukan"}), 404

    additional_claims = {"role": user.role}
    new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    
    return jsonify({
        "access_token": new_access_token
    }), 200