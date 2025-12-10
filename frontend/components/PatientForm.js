"use client";
import { useState } from "react";

// Util kelas
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Form metadata pasien (non-identitas).
 * onSuccess: callback({ patient }) dipanggil setelah berhasil create.
 */
export default function PatientForm({ onSuccess }) {
  const [form, setForm] = useState({
    age: "",
    gender: "",
    diabetes_duration_years: "",
    hypertension: false,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        diabetes_duration_years: form.diabetes_duration_years ? parseInt(form.diabetes_duration_years, 10) : null,
        hypertension: !!form.hypertension,
        notes: form.notes || null,
      };
      const { createPatient } = await import("../lib/api");
      const res = await createPatient(payload);
      onSuccess?.(res);
    } catch (err) {
      setError(err.message || "Gagal menyimpan data pasien");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {/* Accent + deskripsi singkat */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500/15 ring-1 ring-blue-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 3v18m9-9H3" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] text-gray-500 dark:text-white/60">Data non-identitas untuk analisis risiko</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200/60 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/20 px-3 py-2">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Usia */}
        <div className="relative group">
          <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-white/70">Usia</label>
          <div className="mt-1 relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM21 21a8.5 8.5 0 10-17 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="Mis. 55"
              className={cn(
                "input input-bordered w-full pl-9",
                "bg-white/80 dark:bg-gray-900/60",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              )}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div className="relative group">
          <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-white/70">Jenis Kelamin</label>
          <div className="mt-1 relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M13 11a5 5 0 11-10 0 5 5 0 0110 0zM22 2l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={cn(
                "select select-bordered w-full pl-9",
                "bg-white/80 dark:bg-gray-900/60",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              )}
              disabled={submitting}
            >
              <option value="">Pilih</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Durasi Diabetes */}
        <div className="relative group">
          <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-white/70">Durasi Diabetes (tahun)</label>
          <div className="mt-1 relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 2M3 12a9 9 0 1118 0 9 9 0 01-18 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="number"
              name="diabetes_duration_years"
              value={form.diabetes_duration_years}
              onChange={handleChange}
              placeholder="Mis. 8"
              className={cn(
                "input input-bordered w-full pl-9",
                "bg-white/80 dark:bg-gray-900/60",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              )}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Hipertensi */}
        <div className="relative">
          <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-white/70">Hipertensi</label>
          <div className="mt-1 flex items-center justify-between rounded-lg bg-white/70 dark:bg-gray-900/50 ring-1 ring-inset ring-white/20 dark:ring-white/5 px-3 py-2">
            <span className="text-sm text-gray-600 dark:text-white/70">Riwayat hipertensi</span>
            <input
              id="hypertension"
              type="checkbox"
              name="hypertension"
              checked={form.hypertension}
              onChange={handleChange}
              className="toggle toggle-primary"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      {/* Catatan */}
      <div className="relative group">
        <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-white/70">Catatan</label>
        <div className="mt-1 relative">
          <span className="pointer-events-none absolute left-3 top-3 text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Opsional"
            className={cn(
              "textarea textarea-bordered w-full pl-9",
              "bg-white/80 dark:bg-gray-900/60",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            )}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Aksi */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-white/50">Data membantu personalisasi rekomendasi model.</p>
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "btn btn-primary btn-md px-5",
            "shadow-md shadow-blue-500/20"
          )}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="loading loading-spinner loading-xs" />
              Menyimpan...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Simpan & Lanjut
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}