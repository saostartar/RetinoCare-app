"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadExamImage, startExamAnalysis, getExam } from "../lib/api";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ORDERED_CLASSES = [
  { key: "No DR", label: "Tidak Ada DR", color: "emerald" },
  { key: "Mild", label: "Ringan", color: "amber" },
  { key: "Moderate", label: "Sedang", color: "orange" },
  { key: "Severe", label: "Berat", color: "red" },
  { key: "Proliferative DR", label: "Proliferatif", color: "purple" },
];

const GRADE_STYLES = {
  no_dr: {
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  },
  mild: {
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  },
  moderate: {
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/30",
  },
  severe: {
    chip: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/30",
  },
  proliferative: {
    chip: "bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-purple-500/30",
  },
};

function gradeToKeyLabel(grade) {
  const g = (grade || "").toLowerCase();
  switch (g) {
    case "no_dr":
    case "no dr":
      return { key: "no_dr", label: "Tidak Ada DR" };
    case "mild":
      return { key: "mild", label: "Ringan" };
    case "moderate":
      return { key: "moderate", label: "Sedang" };
    case "severe":
      return { key: "severe", label: "Berat" };
    case "proliferative":
    case "proliferative dr":
      return { key: "proliferative", label: "Proliferatif" };
    default:
      return { key: "unknown", label: grade || "-" };
  }
}

export default function DetectionForm({ examId = null, onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [eyeSide, setEyeSide] = useState("unknown");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | uploading | analyzing | done
  const [error, setError] = useState(null);
  const [latestExam, setLatestExam] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setError(null);
    }
  }

  async function pollExamUntilDone(
    id,
    { interval = 1500, maxMs = 120000 } = {}
  ) {
    const start = Date.now();
    while (true) {
      const ex = await getExam(id);
      // PERBAIKAN: API getExam mengembalikan object exam langsung, bukan dibungkus dalam properti .exam
      // Jadi kita cek ex.status, bukan ex.exam.status
      if (ex?.status === "completed" || ex?.status === "failed") {
        return ex;
      }
      if (Date.now() - start > maxMs) {
        throw new Error("Analisis melebihi batas waktu, coba lagi.");
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  async function handleAnalyze() {
    if (!examId) {
      setError("Mode ini membutuhkan examId. Buka alur melalui halaman /exam.");
      return;
    }
    if (!file) {
      setError("Pilih gambar terlebih dahulu.");
      return;
    }
    setBusy(true);
    setPhase("uploading");
    setError(null);
    try {
      // Pass plain string (previously sent an object, causing '[object Object]' stored)
      await uploadExamImage(examId, file, eyeSide);
      setPhase("analyzing");
      await startExamAnalysis(examId);
      const ex = await pollExamUntilDone(examId, {
        interval: 1500,
        maxMs: 120000,
      });
      setLatestExam(ex);
      setPhase("done");
      if (onAnalysisComplete) onAnalysisComplete(ex);
    } catch (err) {
      setError(err.message || "Gagal melakukan analisis");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setFile(null);
    setPreviewUrl(null);
    setPhase("idle");
    setError(null);
    setLatestExam(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const output = latestExam?.outputs?.[0] || null;
  const gradeInfo = useMemo(() => {
    const g = output?.dr_grade || latestExam?.dr_grade || null;
    return gradeToKeyLabel(g);
  }, [output, latestExam]);

  const probability = useMemo(() => {
    const p = output?.dr_probability;
    return typeof p === "number" ? p : null;
  }, [output]);

  const confidences = useMemo(() => {
    const conf = output?.raw_output?.all_confidences || null;
    if (!conf) return null;
    // Normalisasi ke 0..1 jika belum
    const entries = ORDERED_CLASSES.map((c) => {
      const v = conf[c.key];
      return typeof v === "number" ? Math.max(0, Math.min(1, v)) : 0;
      // kunci lain diabaikan
    });
    return entries;
  }, [output]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm p-5 transition-all hover:shadow-xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative z-10">
            <h3 className="text-base font-semibold mb-2 text-foreground">
              Unggah Gambar Retina
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
              Format disarankan: JPG/PNG, resolusi jelas.
            </p>

            <div className="flex items-center gap-2 mb-3">
              {[
                { v: "left", label: "Kiri" },
                { v: "right", label: "Kanan" },
                { v: "unknown", label: "Tidak Diketahui" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition",
                    eyeSide === opt.v
                      ? "bg-orange-500 text-white shadow"
                      : "text-gray-600 dark:text-white/70 hover:bg-white/70 dark:hover:bg-gray-800/60"
                  )}
                  onClick={() => setEyeSide(opt.v)}>
                  {opt.label}
                </button>
              ))}
            </div>

            <label
              htmlFor="file"
              className={cn(
                "mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition",
                "border-white/30 dark:border-white/10 hover:border-blue-400/50 hover:bg-white/50 dark:hover:bg-gray-900/40"
              )}>
              <input
                id="file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
                disabled={busy}
              />
              <svg
                className="w-6 h-6 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                Tarik & letakkan file di sini
              </span>
              <p className="text-xs text-gray-500 dark:text-white/60">
                atau klik untuk memilih dari perangkat
              </p>
              {file && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-white/50">
                  Dipilih: {file.name} — {(file.size / 1024 / 1024).toFixed(2)}{" "}
                  MB
                </p>
              )}
            </label>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-5">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-white/30 dark:ring-white/10 bg-white/70 dark:bg-gray-900/40">
                  <img
                    src={previewUrl}
                    alt="preview retina"
                    className="w-full object-contain max-h-80"
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                className={cn(
                  "btn btn-primary",
                  busy && "opacity-70 cursor-not-allowed"
                )}
                onClick={handleAnalyze}
                disabled={busy || !file}>
                {phase === "uploading"
                  ? "Mengunggah..."
                  : phase === "analyzing"
                  ? "Menganalisis..."
                  : "Mulai Analisis"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={resetForm}
                disabled={busy}>
                Reset
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Result card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm p-5">
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-green-500/10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                Hasil Analisis
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                  latestExam?.status === "completed"
                    ? "bg-green-500/10 text-green-700 dark:text-green-300 ring-green-500/30"
                    : phase === "analyzing" ||
                      latestExam?.status === "analyzing" ||
                      latestExam?.status === "processing"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30"
                    : "bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-blue-600/30"
                )}>
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                {latestExam?.status
                  ? latestExam.status
                  : phase === "analyzing"
                  ? "analyzing"
                  : "idle"}
              </span>
            </div>

            {/* Loading state */}
            {!latestExam &&
              (phase === "idle" ||
                phase === "uploading" ||
                phase === "analyzing") && (
                <div className="mt-6 flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                  <svg
                    className="w-5 h-5 animate-spin text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true">
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-80"
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  Menunggu hasil analisis...
                </div>
              )}

            {/* Completed result */}
            {latestExam && (
              <div className="mt-5 space-y-4">
                {/* Grade + prob */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                        GRADE_STYLES[gradeInfo.key]?.chip ||
                          "bg-gray-500/10 text-gray-700 dark:text-white/70 ring-white/20"
                      )}>
                      Tingkat: {gradeInfo.label}
                    </span>
                    {typeof probability === "number" && (
                      <span className="text-sm text-gray-600 dark:text-white/80">
                        Keyakinan: {(probability * 100).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  {latestExam?.created_at && (
                    <span className="text-[11px] text-gray-500 dark:text-white/50">
                      {new Date(
                        latestExam.updated_at || latestExam.created_at
                      ).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Confidence bars */}
                {confidences && (
                  <div className="space-y-2">
                    {ORDERED_CLASSES.map((c, i) => {
                      const v = confidences[i] || 0;
                      const pct = Math.round(v * 100);
                      const color = c.color;
                      return (
                        <div key={c.key} className="w-full">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-white/70">
                              {c.label}
                            </span>
                            <span className="text-gray-600 dark:text-white/70">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-2 rounded bg-gray-200/60 dark:bg-gray-800/60 overflow-hidden">
                            <div
                              className={cn(
                                "h-2 rounded",
                                color === "emerald" && "bg-emerald-500",
                                color === "amber" && "bg-amber-500",
                                color === "orange" && "bg-orange-500",
                                color === "red" && "bg-red-500",
                                color === "purple" && "bg-purple-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-xl border border-white/20 dark:border-white/5 bg-green-50/60 dark:bg-green-900/10 p-4">
                  <p className="text-sm text-foreground">
                    {latestExam?.result_summary || "Ringkasan tidak tersedia."}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/edukasi#${gradeInfo.key}`}
                    className="btn btn-sm btn-primary">
                    Pelajari tindak lanjut
                  </a>
                  <a href="/riwayat" className="btn btn-sm">
                    Lihat Riwayat
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={resetForm}>
                    Analisis lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catatan kecil */}
      <p className="text-[11px] text-gray-500 dark:text-white/50">
        Pastikan pencahayaan baik dan fokus tajam untuk hasil optimal.
      </p>
    </div>
  );
}