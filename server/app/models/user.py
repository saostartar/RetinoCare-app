from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(UserMixin, db.Model):
    """
    Model pengguna aplikasi.
    - Menyimpan kredensial (hash password), email, dan username.
    - Menyimpan peran (role) untuk otorisasi berbasis peran.
      Nilai yang disarankan: 'operator' (default), 'doctor', 'admin'.
    - Relasi:
      - detections: hasil deteksi lama (DetectionResult) yang dibuat user ini.
      - exams: daftar pemeriksaan (Exam) yang dibuat user ini.
    """
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Kolom role untuk otorisasi berbasis peran
    # server_default memudahkan saat menambah kolom via migrasi pada DB yang sudah ada
    role = db.Column(db.String(50), nullable=False, default="operator", server_default="operator")

    # Relasi lama ke hasil deteksi (jika masih dipakai modul deteksi existing)
    detections = db.relationship("DetectionResult", backref="user", lazy=True)

    # Relasi baru ke pemeriksaan klinis (lihat app.models.exam.Exam dengan back_populates="user")
    exams = db.relationship("Exam", back_populates="user", lazy=True)

    def set_password(self, password: str) -> None:
        """Setel hash password dengan aman."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifikasi password dengan membandingkan hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """
        Representasi aman untuk dikirim ke klien.
        Tidak menyertakan password_hash.
        """
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username} role={self.role}>"