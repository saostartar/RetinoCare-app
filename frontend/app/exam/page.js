"use client";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PatientForm from "../../components/PatientForm";
import DetectionForm from "../../components/DetectionForm";
import { createExam } from "../../lib/api";

/**
 * Halaman alur pemeriksaan terpadu:
 * 1) Input data pasien -> createPatient (via PatientForm)
 * 2) Buat exam -> createExam
 * 3) Upload & analisis -> DetectionForm (mode exam)
 * 4) Tampilkan ringkasan hasil
 */

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function gradeToLabel(g) {
  const s = (g || "").toLowerCase();
  return s === "no_dr" || s === "no dr" ? "Tidak Ada DR"
    : s === "mild" ? "Ringan"
    : s === "moderate" ? "Sedang"
    : s === "severe" ? "Berat"
    : s === "proliferative" || s === "proliferative dr" ? "Proliferatif"
    : g || "-";
}

export default function ExamPage() {
  const [patient, setPatient] = useState(null);
  const [exam, setExam] = useState(null);
  const [error, setError] = useState(null);
  const isMakingExam = !!patient && !exam;

  async function handlePatientSuccess(res) {
    setPatient(res.patient);
    setError(null);
    try {
      const ex = await createExam(res.patient.id);
      setExam(ex.exam);
    } catch (err) {
      setError(err.message || "Gagal membuat exam");
    }
  }

  const step1Done = !!patient;
  const step2Done = !!exam;
  const step3Done = !!exam?.result_summary;

  function Step({ index, title, active, done }) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative h-9 w-9 rounded-full flex items-center justify-center ring-1 ring-inset transition-all",
            done
              ? "bg-green-500/15 ring-green-500/30"
              : active
              ? "bg-blue-600/10 ring-blue-600/30"
              : "bg-white/60 dark:bg-gray-900/30 ring-white/20 dark:ring-white/5"
          )}
        >
          {done ? (
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className={cn(
              "text-sm font-semibold",
              active ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-white/70"
            )}>
              {index}
            </span>
          )}
          <span className={cn(
            "pointer-events-none absolute -inset-1 rounded-full blur-lg",
            active ? "bg-blue-500/10" : "bg-transparent"
          )}/>
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-semibold",
            done ? "text-green-700 dark:text-green-300" : active ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-white/70"
          )}>
            {title}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-white/50">
            {done ? "Selesai" : active ? "Sedang berlangsung" : "Menunggu"}
          </span>
        </div>
      </div>
    );
  }

  // Panel hasil yang lebih enak dibaca
  const output = exam?.outputs?.[0];
  const prob = typeof output?.dr_probability === "number" ? output.dr_probability : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* Dekorasi latar unik */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[36rem] h-[36rem] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <section className="relative mx-auto max-w-6xl px-6 md:px-10 lg:px-12 pt-10">
        <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm p-6 md:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Proses Pemeriksaan
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-white/70">
              Isi data pasien, sistem membuat sesi pemeriksaan, lalu unggah foto retina untuk analisis AI.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm p-4">
            <Step index={1} title="Data Pasien" active={!step1Done} done={step1Done} />
          </div>
          <div className="rounded-xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm p-4">
            <Step index={2} title="Pembuatan Exam" active={step1Done && !step2Done} done={step2Done} />
          </div>
          <div className="rounded-xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm p-4">
            <Step index={3} title="Unggah & Analisis" active={step2Done && !step3Done} done={step3Done} />
          </div>
        </div>
      </section>

      {/* Konten */}
      <section className="relative mx-auto max-w-6xl px-6 md:px-10 lg:px-12 py-8 md:py-10 space-y-6">
        {/* Form Data Pasien */}
        {!patient && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm p-5 md:p-6 transition-all hover:shadow-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-3 text-foreground">1) Data Pasien</h2>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
                Masukkan data pasien untuk memulai sesi pemeriksaan.
              </p>
              <PatientForm onSuccess={handlePatientSuccess} />
            </div>
          </div>
        )}

        {/* Status Pembuatan Exam */}
        {isMakingExam && (
          <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-blue-50 dark:bg-blue-900/20 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600/10 ring-1 ring-inset ring-blue-600/20">
                <svg className="w-5 h-5 text-blue-700 dark:text-blue-300 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200">Membuat exam untuk pasien...</p>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Harap tunggu sesaat</p>
              </div>
            </div>
          </div>
        )}

        {/* Kartu Exam + Form Analisis */}
        {exam && (
          <div className="space-y-5">
            <div className="group relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm p-5 transition-all hover:shadow-xl">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-white/60">ID Pemeriksaan</p>
                  <p className="font-semibold">Exam #{exam.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-white/60">Status:</span>
                  <span className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                    exam?.status === "completed"
                      ? "bg-green-500/10 text-green-700 dark:text-green-300 ring-green-500/30"
                      : exam?.status === "processing" || exam?.status === "analyzing"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30"
                      : "bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-blue-600/30"
                  )}>
                    <span className="inline-block h-2 w-2 rounded-full bg-current" />
                    {exam.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm p-5 md:p-6 transition-all hover:shadow-xl">
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-3 text-foreground">2) Unggah Foto Retina & Analisis AI</h2>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
                  Unggah gambar fundus untuk dideteksi oleh model. Hasil akan diperbarui otomatis.
                </p>
                <DetectionForm
                  examId={exam.id}
                  onAnalysisComplete={(updatedExam) => {
                    setExam(updatedExam);
                  }}
                />
              </div>
            </div>

            {/* Panel hasil ringkas */}
            {exam?.result_summary && (
              <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-green-50 dark:bg-green-900/20 p-5">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">Ringkasan Hasil</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-500/30">
                      {gradeToLabel(output?.dr_grade)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-white/80">{exam.result_summary}</p>
                  {typeof prob === "number" && (
                    <p className="text-[12px] text-gray-600 dark:text-white/70">
                      Keyakinan model: {(prob * 100).toFixed(2)}%
                    </p>
                  )}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a href="/riwayat" className="btn btn-sm">Lihat Riwayat</a>
                    <a href={`/edukasi`} className="btn btn-sm btn-ghost">Panduan Tingkatan DR</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="relative overflow-hidden rounded-xl border border-white/20 dark:border-white/5 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{error}</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}