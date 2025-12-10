from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config

# Ekstensi dibuat di level paket agar bisa diimport oleh model
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
jwt = JWTManager()


def create_app():
    """
    Factory aplikasi Flask.
    - Inisialisasi ekstensi (SQLAlchemy, Migrate, LoginManager, JWT)
    - Registrasi blueprint utama dan klinis
    - Import model setelah db.init_app untuk menghindari circular import
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Konfigurasi CORS
    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        expose_headers=["Content-Type", "Content-Disposition"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

    # Inisialisasi ekstensi
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    jwt.init_app(app)
    
    
    from app.models.user import User
    from app.models.detection_result import DetectionResult
    from app.models.patient import Patient
    from app.models.exam import Exam
    from app.models.eye_image import EyeImage
    from app.models.model_output import ModelOutput
    from app.models.exam_note import ExamNote

    # Registrasi blueprint yang sudah ada
    from app.routes import bp
    app.register_blueprint(bp)

    # Registrasi blueprint klinis baru di prefix /api
    from app.views.clinical import clinical_bp
    app.register_blueprint(clinical_bp, url_prefix="/api")

    # Registrasi blueprint admin
    from app.views import admin
    app.register_blueprint(admin.admin_bp, url_prefix="/api/admin")

    # Opsional: buat tabel otomatis saat dev pertama kali
    with app.app_context():
        db.create_all()

    return app


# Integrasi Flask-Login
@login_manager.user_loader
def load_user(user_id):
    # Import lokal untuk menghindari circular import
    from app.models.user import User
    return User.query.get(int(user_id))