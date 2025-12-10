Roadmap Pengembangan Aplikasi RetinoCare V2 (Revisi Teknis)
Rencana kerja ini disesuaikan secara spesifik dengan arsitektur Flask + Next.js dari repositori Anda untuk mengimplementasikan fitur-fitur yang diminta.

Fase 1: Penyesuaian Backend untuk Manajemen Data Klinis
Tujuan: Memperluas struktur backend Flask yang ada untuk menangani data pasien, pemeriksaan, dan peran pengguna.


Tugas-tugas:

Ekspansi Model Database (SQLAlchemy):

File: server/app/models/

Modifikasi user.py: Tambahkan kolom role = db.Column(db.String(50), nullable=False, default='operator') ke model User.

Buat file-file model baru: patient.py, exam.py, eye_image.py, model_output.py.

Definisikan skema untuk setiap model menggunakan db.Model dari Flask-SQLAlchemy, lengkap dengan relasi (db.relationship) antar model tersebut.

Jalankan flask db migrate dan flask db upgrade untuk menerapkan perubahan ke database.

Update Logika Otentikasi & Otorisasi (Flask-JWT-Extended):

File: server/app/views/auth.py

Di endpoint /login, saat membuat token (create_access_token), tambahkan peran pengguna ke dalam claims token dengan parameter additional_claims={'role': user.role}.

File: server/app/routes.py (atau buat file utilitas baru)

Buat custom decorator (misalnya @admin_required) yang memanfaatkan @jwt_required() dan get_jwt() untuk memeriksa apakah jwt['role'] == 'admin'. Ini akan digunakan untuk melindungi endpoint admin.

Pembuatan API Endpoint Baru (Flask Blueprints):

Buat blueprint baru untuk manajemen data klinis, misalnya di server/app/views/clinical.py.

Implementasikan endpoint di dalam blueprint tersebut:

POST /patients: Membuat data pasien baru.

POST /exams: Membuat record pemeriksaan baru, terhubung ke patient_id dan user_id dari token.

GET /exams/<int:exam_id>: Mengambil detail pemeriksaan.

Daftarkan blueprint baru ini di server/app/__init__.py.

Fase 2: Implementasi Alur Pemeriksaan di Frontend
Tujuan: Mengintegrasikan alur kerja pemeriksaan baru ke dalam antarmuka Next.js yang ada.

Perkiraan Waktu: 2 - 3 Minggu

Tugas-tugas:

Pembuatan Halaman Pemeriksaan Terpadu:

File: frontend/app/exam/page.js

Buat route dan halaman baru untuk proses pemeriksaan. Halaman ini akan menjadi container untuk beberapa komponen.

File: frontend/components/PatientForm.js

Buat komponen form baru khusus untuk input metadata pasien non-identitas. Gunakan state React untuk mengelola input.

File: frontend/components/DetectionForm.js

Refactor: Ubah komponen ini agar bisa digunakan kembali di dalam halaman /exam. Hapus logika yang tidak relevan dan fokus hanya pada fungsionalitas unggah gambar dan pemicu analisis.

Integrasi API untuk Alur Pemeriksaan:

File: frontend/lib/api.js

Tambahkan fungsi-fungsi baru untuk memanggil endpoint yang dibuat di Fase 1 (misalnya, createPatient, createExam, uploadImageForExam, startAnalysis).

File: frontend/app/exam/page.js

Orkestrasikan alur kerja:

Render PatientForm. Setelah data pasien dikirim dan berhasil (mendapat patient_id), render DetectionForm.

Di DetectionForm, setelah gambar diunggah, panggil API untuk memulai analisis.

Tampilkan status loading selama analisis berjalan.

Setelah selesai, panggil GET /exams/<id> untuk mengambil hasil lengkap dan menampilkannya di halaman.

Fase 3: Riwayat & Laporan PDF
Tujuan: Membangun fitur untuk melihat riwayat dan mencetak hasil pemeriksaan.


Tugas-tugas:

Halaman Riwayat Pemeriksaan:

Backend: Di server/app/views/clinical.py, buat endpoint GET /exams yang mendukung query parameter untuk pencarian dan filter.

Frontend: frontend/app/history/page.js

Buat halaman baru untuk menampilkan riwayat.

Gunakan useEffect untuk memanggil API GET /exams saat halaman dimuat.

Render data dalam bentuk tabel. Tambahkan input untuk pencarian/filter yang akan memicu pemanggilan ulang API dengan parameter yang sesuai.

Setiap baris memiliki tautan <Link href={'/history/' + exam.id}> ke halaman detail.

Generasi Laporan PDF:

Backend:

Tambahkan WeasyPrint ke server/requirements.txt dan instal.

Buat endpoint baru GET /exams/<int:exam_id>/pdf.

Di dalam fungsi ini: ambil data pemeriksaan, render ke dalam sebuah template Jinja2 (HTML+CSS), lalu gunakan WeasyPrint untuk mengubah HTML tersebut menjadi respons PDF.

Frontend:

Di halaman hasil analisis dan halaman detail riwayat, tambahkan tombol "Unduh PDF" yang mengarah ke endpoint di atas.

Fase 4 & 5: Fitur Lanjutan, Konten & Finalisasi
Tujuan: Melengkapi fungsionalitas untuk semua peran dan memoles aplikasi.


Tugas-tugas:

Dashboard Admin & Fitur Dokter:

Frontend: Buat halaman /dashboard dan /history/<id> yang menampilkan komponen berbeda atau tambahan berdasarkan peran pengguna yang disimpan dalam context atau state setelah login.

Backend: Implementasikan endpoint yang relevan (/stats, /users, /exams/<id>/verify) dan lindungi dengan decorator @admin_required atau @doctor_required yang sesuai.

Halaman Edukasi:

Frontend: frontend/app/education/page.js

Buat halaman statis baru menggunakan komponen Next.js dan Tailwind CSS untuk menampilkan gambar dan deskripsi tingkatan DR. Data bisa di-hardcode langsung di dalam komponen.

Pengujian Menyeluruh:

Lakukan pengujian manual untuk setiap alur kerja dan setiap peran pengguna untuk memastikan semua berfungsi sesuai harapan dan tidak ada bug kritis.