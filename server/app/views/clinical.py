from flask import Blueprint, request, jsonify, current_app, render_template, Response, send_file, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from werkzeug.utils import secure_filename
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import os
import uuid
import random
from datetime import datetime

from app import db
from app.models.patient import Patient
from app.models.exam import Exam
from app.models.eye_image import EyeImage
from app.models.model_output import ModelOutput
from app.models.exam_note import ExamNote
from app.utils.decorators import doctor_required
# Import fungsi prediksi riil
from app.utils.prediction import predict_image

clinical_bp = Blueprint("clinical", __name__)

FONTS_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "static", "fonts"))

def _uploads_dir() -> str:
    path = os.path.join(current_app.root_path, "uploads")
    if not os.path.exists(path):
        os.makedirs(path)
    return path

# ==================== Fase 1 ====================

@clinical_bp.route("/patients", methods=["POST"])
@jwt_required()
def create_patient():
    data = request.get_json() or {}
    try:
        patient = Patient(
            age=data.get("age"),
            gender=data.get("gender"),
            diabetes_duration_years=data.get("diabetes_duration_years"),
            hypertension=bool(data.get("hypertension")) if data.get(
                "hypertension") is not None else None,
            notes=data.get("notes"),
        )
        db.session.add(patient)
        db.session.commit()
        return jsonify({"message": "Patient created", "patient": patient.to_dict()}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500


@clinical_bp.route("/exams", methods=["POST"])
@jwt_required()
def create_exam():
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": f"Patient {patient_id} not found"}), 404

    try:
        user_id = int(get_jwt_identity())
    except Exception:
        user_id = get_jwt_identity()

    try:
        exam = Exam(patient_id=patient_id, user_id=user_id, status="created")
        db.session.add(exam)
        db.session.commit()
        return jsonify({"message": "Exam created", "exam": exam.to_dict()}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500


@clinical_bp.route('/exams/<int:exam_id>/images', methods=['POST'])
@jwt_required()
def upload_exam_image(exam_id):
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    allowed_ext = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_ext:
        return jsonify({'error': 'File type not allowed'}), 400

    eye_side = request.form.get('eye_side', 'unknown')

    try:
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(_uploads_dir(), unique_filename)
        file.save(save_path)

        eye_image = EyeImage(
            exam_id=exam.id,
            file_path=save_path,
            eye_side=eye_side
        )
        db.session.add(eye_image)
        
        if exam.status == 'created':
            exam.status = 'processing'
            
        db.session.commit()

        return jsonify({
            'message': 'File uploaded successfully',
            'image': eye_image.to_dict()
        }), 201

    except Exception as e:
        current_app.logger.error(f"Upload failed: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to save file', 'details': str(e)}), 500



@clinical_bp.route('/exams/<int:exam_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_exam(exam_id):
    """
    Trigger AI analysis using app.utils.prediction.predict_image
    """
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404

    # 1. Cek ketersediaan gambar
    if not exam.images:
        return jsonify({'error': 'No images uploaded for this exam'}), 400

    # 2. Ambil gambar TERBARU yang diupload user untuk exam ini
    # Kita urutkan berdasarkan waktu upload (atau id)
    latest_image = sorted(exam.images, key=lambda x: x.uploaded_at if x.uploaded_at else datetime.min)[-1]
    image_path = latest_image.file_path

    # Validasi file fisik
    if not os.path.exists(image_path):
        return jsonify({'error': 'Image file missing from server'}), 500

    try:
        # Update status
        exam.status = 'analyzing'
        db.session.commit()

        # 3. Panggil Model ML
        # current_app.logger.info(f"Starting analysis for {image_path}")
        result = predict_image(image_path)
        
        # 4. Cek Error dari Model
        if result.get("error"):
            exam.status = 'failed'
            exam.result_summary = f"Analisis Gagal: {result['error']}"
            db.session.commit()
            return jsonify({
                'error': 'Model prediction failed',
                'details': result['error']
            }), 500

        # 5. Simpan Hasil
        grade = result.get("class", "Unknown")
        probability = result.get("confidence", 0.0)
        raw_output = {"all_confidences": result.get("all_confidences", {})}

        output = ModelOutput(
            exam_id=exam.id,
            dr_grade=grade,
            dr_probability=probability,
            generated_at=datetime.utcnow(),
            raw_output=raw_output
        )
        db.session.add(output)
        
        # Update status Exam jadi completed
        exam.status = 'completed'
        exam.result_summary = f"Terdeteksi {grade} ({probability*100:.1f}%)"
        
        db.session.commit()

        return jsonify({
            'message': 'Analysis completed successfully',
            'exam': exam.to_dict() # Return updated exam agar frontend auto-update
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Analysis system error: {str(e)}")
        return jsonify({'error': 'Analysis system error', 'details': str(e)}), 500


@clinical_bp.route("/exams/<int:exam_id>/pdf", methods=["GET"])
@jwt_required()
def exam_pdf(exam_id: int):
    from io import BytesIO
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": f"Exam {exam_id} not found"}), 404

    inline = request.args.get("inline") == "1"
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin_l = 40
    margin_r = 40
    top_margin = 50
    bottom_margin = 40
    y = height - top_margin
    row_gap = 4

    def footer():
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.45, 0.45, 0.45)
        c.drawRightString(width - margin_r, bottom_margin -
                          25, f"Halaman {c.getPageNumber()}")
        c.setFillColorRGB(0, 0, 0)

    def draw_header():
        nonlocal y
        c.setFont("Helvetica-Bold", 16)
        c.drawString(margin_l, y, "Laporan Pemeriksaan Retina")
        y -= 22
        c.setFont("Helvetica", 9)
        created = exam.created_at.strftime(
            "%Y-%m-%d %H:%M") if exam.created_at else "-"
        c.drawString(margin_l, y, f"Exam ID: {exam.id}  •  Dibuat: {created}")
        y -= 10
        c.setStrokeColor(colors.Color(0.78, 0.78, 0.78))
        c.line(margin_l, y, width - margin_r, y)
        y -= 18

    def ensure_space(block_height):
        nonlocal y
        if y - block_height < bottom_margin:
            footer()
            c.showPage()
            y = height - top_margin
            draw_header()

    def section(title):
        nonlocal y
        ensure_space(32)
        c.setFont("Helvetica-Bold", 11.5)
        c.setFillColorRGB(0.08, 0.28, 0.55)
        c.drawString(margin_l, y, title)
        y -= 8
        c.setStrokeColor(colors.Color(0.78, 0.78, 0.78))
        c.line(margin_l, y, width - margin_r, y)
        y -= 10
        c.setFillColorRGB(0, 0, 0)

    def wrap_text(text, max_width, font_name="Helvetica", font_size=10):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        if text is None:
            return ["-"]
        t = str(text)
        words = t.split()
        if not words:
            return ["-"]
        lines = []
        current = []
        for w in words:
            trial = (" ".join(current + [w])).strip()
            if stringWidth(trial, font_name, font_size) <= max_width:
                current.append(w)
            else:
                if current:
                    lines.append(" ".join(current))
                current = [w]
        if current:
            lines.append(" ".join(current))
        return lines or ["-"]

    label_width = 115
    value_width = width - margin_r - margin_l - label_width

    def kv(label, value, font_size=9.5):
        nonlocal y
        safe_val = value if value not in (None, "") else "-"
        lines = wrap_text(safe_val, value_width, font_size=font_size)
        row_height = (len(lines) * (font_size + 2)) + row_gap
        ensure_space(row_height + 2)
        c.setFont("Helvetica-Bold", font_size)
        c.drawString(margin_l, y, f"{label}:")
        c.setFont("Helvetica", font_size)
        yy = y
        for line in lines:
            c.drawString(margin_l + label_width, yy, line)
            yy -= (font_size + 2)
        y -= (len(lines) * (font_size + 2)) + row_gap

    def boxed_note(timestamp, content):
        nonlocal y
        text_lines = []
        for raw_line in (content or '').split('\n') or ['-']:
            wrapped = wrap_text(raw_line, width - margin_l -
                                margin_r - 20, font_size=9)
            text_lines.extend(wrapped if wrapped else ['-'])
        box_height = 14 + (len(text_lines) * 12) + 8
        ensure_space(box_height)
        c.setFillColorRGB(0.97, 0.97, 0.97)
        c.setStrokeColorRGB(0.85, 0.85, 0.85)
        c.rect(margin_l, y - box_height + 6, width -
               margin_l - margin_r, box_height, fill=1, stroke=1)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin_l + 8, y - 14, timestamp)
        c.setFont("Helvetica", 9)
        line_y = y - 26
        for tl in text_lines:
            c.drawString(margin_l + 8, line_y, tl)
            line_y -= 12
        y -= box_height + 4

    draw_header()
    section("Data Pasien")
    p = exam.patient
    kv("Usia", p.age if p and p.age is not None else "-")
    kv("Jenis Kelamin", p.gender if p else "-")
    kv("Durasi Diabetes (th)",
       p.diabetes_duration_years if p and p.diabetes_duration_years is not None else "-")
    kv("Hipertensi", "Ya" if (p and p.hypertension) else "Tidak/-")
    kv("Catatan", (p.notes if p and p.notes else "-"))

    section("Informasi Pemeriksaan")
    kv("Status", exam.status or "-")
    creator = getattr(exam, "user", None)
    kv("Pembuat", getattr(creator, "username", "-"))
    kv("Ringkasan Hasil", exam.result_summary or "-")
    updated = exam.updated_at.strftime(
        "%Y-%m-%d %H:%M") if exam.updated_at else "-"
    kv("Terakhir Diperbarui", updated)

    section("Gambar Retina")
    if exam.images:
        for img in exam.images[:10]:
            uploaded = img.uploaded_at.strftime(
                "%Y-%m-%d %H:%M") if img.uploaded_at else "-"
            kv(f"#{img.id} {img.eye_side}", uploaded)
        last_img = sorted(
            exam.images, key=lambda x: x.uploaded_at or datetime.min)[-1]
        path = last_img.file_path
        if path and os.path.exists(path):
            try:
                ensure_space(200)
                c.setFont("Helvetica-Bold", 10)
                c.drawString(margin_l, y, "Pratinjau Gambar Terakhir:")
                y -= 10
                max_w = width - margin_l - margin_r
                img_reader = ImageReader(path)
                iw, ih = img_reader.getSize()
                scale = min(max_w / iw, 200 / ih)
                display_w = iw * scale
                display_h = ih * scale
                c.drawImage(img_reader, margin_l, y - display_h, width=display_w,
                            height=display_h, preserveAspectRatio=True, mask='auto')
                y -= display_h + 10
            except Exception:
                pass
    else:
        kv("Info", "Belum ada gambar diunggah.")

    section("Hasil Analisis Model")
    if exam.outputs:
        for o in exam.outputs[:15]:
            t = o.generated_at.strftime(
                "%Y-%m-%d %H:%M") if o.generated_at else "-"
            kv(f"Output #{o.id}", f"{o.dr_grade or '-'} ({o.dr_probability if o.dr_probability is not None else '-'} prob) {t}")
    else:
        kv("Info", "Belum ada hasil analisis.")

    section("Catatan Dokter")
    notes = ExamNote.query.filter_by(exam_id=exam.id).order_by(
        ExamNote.created_at.asc()).all()
    if notes:
        for n in notes:
            ts = n.created_at.strftime(
                "%Y-%m-%d %H:%M") if n.created_at else "-"
            boxed_note(ts, n.content)
    else:
        kv("Info", "Tidak ada catatan")

    ensure_space(30)
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawString(
        margin_l, y, "Dokumen ini dihasilkan otomatis oleh RetinoCare.")
    c.setFillColorRGB(0, 0, 0)
    footer()
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    resp = make_response(pdf_bytes)
    resp.headers['Content-Type'] = 'application/pdf'
    disp = 'inline' if inline else 'attachment'
    resp.headers['Content-Disposition'] = f"{disp}; filename=exam_{exam.id}.pdf"
    resp.headers['Content-Length'] = str(len(pdf_bytes))
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp

# ==================== Fase 3 ====================

@clinical_bp.route('/exams', methods=['GET'])
@jwt_required()
def list_exams():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('perPage', 20))
        status = request.args.get('status')
        q = request.args.get('q', '').strip()

        query = Exam.query.options(
            db.joinedload(Exam.patient),
            db.joinedload(Exam.images),
            db.joinedload(Exam.outputs)
        )

        if status:
            query = query.filter(Exam.status == status)

        if q:
            query = query.filter(
                db.or_(
                    Exam.result_summary.ilike(f'%{q}%'),
                    Exam.notes.ilike(f'%{q}%')
                )
            )

        query = query.order_by(Exam.created_at.desc())
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        items = []
        for exam in paginated.items:
            exam_data = exam.to_dict()
            if exam.patient:
                exam_data['patient'] = exam.patient.to_dict()
            exam_data['images'] = [img.to_dict()
                                   for img in exam.images] if exam.images else []
            outputs_data = []
            for output in exam.outputs:
                output_dict = output.to_dict()
                outputs_data.append(output_dict)
            exam_data['outputs'] = outputs_data
            items.append(exam_data)

        return jsonify({
            'items': items,
            'total': paginated.total,
            'page': paginated.page,
            'pages': paginated.pages,
            'per_page': paginated.per_page,
            'has_next': paginated.has_next,
            'has_prev': paginated.has_prev
        })

    except Exception as e:
        print(f"List exams error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@clinical_bp.route('/exams/<int:exam_id>', methods=['GET'])
@jwt_required()
def get_exam(exam_id):
    try:
        exam = Exam.query.options(
            db.joinedload(Exam.patient),
            db.joinedload(Exam.images),
            db.joinedload(Exam.outputs)
        ).get_or_404(exam_id)

        exam_data = exam.to_dict()
        if exam.patient:
            exam_data['patient'] = exam.patient.to_dict()
        exam_data['images'] = [img.to_dict()
                               for img in exam.images] if exam.images else []
        outputs_data = []
        for output in exam.outputs:
            output_dict = output.to_dict()
            outputs_data.append(output_dict)
        exam_data['outputs'] = outputs_data

        return jsonify(exam_data)
    except Exception as e:
        print(f"Get exam error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@clinical_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    try:
        uploads_dir = _uploads_dir()
        file_path = os.path.join(uploads_dir, filename)

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        try:
            real_uploads_dir = os.path.realpath(uploads_dir)
            real_file_path = os.path.realpath(file_path)
            if not real_file_path.startswith(real_uploads_dir):
                return jsonify({'error': 'Access denied'}), 403
        except Exception as e:
            return jsonify({'error': 'Access denied'}), 403

        allowed_extensions = {'.jpg', '.jpeg', '.png',
                              '.gif', '.bmp', '.webp', '.tiff', '.tif'}
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type'}), 403

        response = send_file(file_path, as_attachment=False)
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        current_app.logger.error(f"Error serving file {filename}: {str(e)}")
        return jsonify({'error': 'File access error', 'details': str(e)}), 500


@clinical_bp.route("/exams/<int:exam_id>/verify", methods=["POST"])
@jwt_required()
@doctor_required
def verify_exam(exam_id: int):
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": f"Exam {exam_id} not found"}), 404

    if exam.status not in ("completed", "verified"):
        return jsonify({"error": f"Cannot verify exam with status '{exam.status}'"}), 400

    exam.status = "verified"
    db.session.commit()
    return jsonify({"message": "Exam verified", "exam": exam.to_dict(include_related=True)}), 200


@clinical_bp.route('/exams/<int:exam_id>/notes', methods=['GET'])
@jwt_required()
def list_exam_notes(exam_id: int):
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": f"Exam {exam_id} not found"}), 404

    claims = get_jwt() or {}
    role = claims.get('role')
    if role not in ('doctor', 'operator'):
        return jsonify({'error': 'Forbidden'}), 403

    notes = ExamNote.query.filter_by(exam_id=exam.id).order_by(
        ExamNote.created_at.asc()).all()
    return jsonify({'notes': [n.to_dict() for n in notes]}), 200


@clinical_bp.route('/exams/<int:exam_id>/notes', methods=['POST'])
@jwt_required()
def create_exam_note(exam_id: int):
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"error": f"Exam {exam_id} not found"}), 404

    claims = get_jwt() or {}
    role = claims.get('role')
    if role != 'doctor':
        return jsonify({'error': 'Only doctors can add notes'}), 403

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400

    identity = get_jwt_identity()
    try:
        author_id = int(identity)
    except Exception:
        author_id = identity

    note = ExamNote(exam_id=exam.id, author_id=author_id, content=content)
    db.session.add(note)
    db.session.commit()
    return jsonify({'note': note.to_dict()}), 201