"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { listExams, downloadExamPdf } from "../../lib/api";
// ...existing code...

/**
 * Halaman menampilkan daftar riwayat pemeriksaan.
 * - Pencarian, filter status, rentang tanggal, pagination.
 * - Klik baris membuka detail /riwayat/[id].
 * - Unduh PDF per baris.
 */
export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [meta, setMeta] = useState({ total: 0, pages: 0, page: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  function statusChipClasses(s) {
    switch (s) {
      case "created":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20";
      case "image_uploaded":
        return "bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-400/20";
      case "analyzing":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20";
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20";
      default:
        return "bg-white/10 text-blue-900/80 dark:text-white/70 border border-white/10";
    }
  }

  async function handleDownloadPdf(id) {
    try {
      setDownloadingId(id);
      await downloadExamPdf(id);
    } catch (e) {
      alert(e.message || "Gagal mengunduh PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  async function fetchData({ resetPage = false } = {}) {
    setLoading(true);
    setError(null);
    try {
      const p = resetPage ? 1 : page;
      const res = await listExams({
        q: q || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: p,
        perPage,
      });
      setItems(res.items || []);
      setMeta({
        total: res.total ?? 0,
        pages: res.pages ?? 0,
        page: res.page ?? p,
        per_page: res.per_page ?? perPage,
      });
      if (resetPage) setPage(1);
    } catch (err) {
      setError(err.message || "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-transparent">
      {/* Dekorasi latar lembut */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      <main className="relative container mx-auto max-w-7xl px-6 md:px-10 lg:px-12 py-10 space-y-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900/90 dark:text-white/90">
              Riwayat Pemeriksaan
            </h1>
            <p className="mt-2 text-sm text-blue-900/60 dark:text-white/60">
              Telusuri hasil analisis dan unduh laporan PDF kapan saja.
            </p>
          </div>
        </header>

        {/* Filter Card */}
        <section className="glass-effect rounded-xl p-5 md:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchData({ resetPage: true });
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            {/* Search */}
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-blue-900/70 dark:text-white/70 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-blue-900/40 dark:text-white/40">
                  {/* icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  className="w-full rounded-lg bg-white/60 dark:bg-gray-900/40 border border-white/30 dark:border-white/10 pl-9 pr-3 py-2.5 text-sm placeholder:text-blue-900/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Cari ringkasan atau catatan"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-blue-900/70 dark:text-white/70 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg bg-white/60 dark:bg-gray-900/40 border border-white/30 dark:border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Semua status</option>
                  <option value="created">created</option>
                  <option value="image_uploaded">image_uploaded</option>
                  <option value="analyzing">analyzing</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-900/40 dark:text-white/40">
                  ▾
                </span>
              </div>
            </div>

            {/* Date From */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-blue-900/70 dark:text-white/70 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-lg bg-white/60 dark:bg-gray-900/40 border border-white/30 dark:border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-blue-900/70 dark:text-white/70 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-lg bg-white/60 dark:bg-gray-900/40 border border-white/30 dark:border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-1 flex items-end gap-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-500 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Terapkan
              </button>
            </div>
            <div className="md:col-span-12 md:col-start-auto md:justify-self-end flex items-end">
              <button
                type="button"
                className="rounded-lg bg-white/60 dark:bg-gray-900/40 text-sm px-4 py-2.5 border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-gray-900/50"
                onClick={() => {
                  setQ(""); setStatus(""); setDateFrom(""); setDateTo("");
                  setPage(1);
                  fetchData({ resetPage: true });
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Tabel */}
        <section className="glass-effect rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-white/30 dark:border-white/10">
                <tr className="text-left text-blue-900/70 dark:text-white/70">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Diagnosis</th>
                  <th className="px-4 py-3 font-semibold">Pasien</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-14 bg-blue-900/10 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-40 bg-blue-900/10 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 bg-blue-900/10 dark:bg-white/10 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-64 bg-blue-900/10 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 bg-blue-900/10 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-8 w-24 bg-blue-900/10 dark:bg-white/10 rounded-lg inline-block" /></td>
                  </tr>
                ))}

                {items.map((ex) => (
                  <tr
                    key={ex.id}
                    onClick={() => router.push(`/riwayat/${ex.id}`)}
                    className="group cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-blue-900 dark:text-white">#{ex.id}</td>
                    <td className="px-4 py-3 text-blue-900/80 dark:text-white/70">
                      {new Date(ex.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusChipClasses(ex.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-blue-900/80 dark:text-white/70 truncate" title={ex.result_summary || "-"}>
                        {ex.result_summary || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-blue-900/80 dark:text-white/70">
                      {ex.patient ? `${ex.patient.age ?? "-"} th / ${ex.patient.gender ?? "-"}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-white/10 px-3 py-2 text-xs font-medium text-blue-900/80 dark:text-white/80 hover:bg-white dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(ex.id); }}
                        disabled={downloadingId === ex.id}
                        aria-label={`Unduh PDF #${ex.id}`}
                      >
                        {downloadingId === ex.id ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Mengunduh...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Unduh PDF
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="mx-auto w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                          <path d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-sm text-blue-900/70 dark:text-white/70">Tidak ada data untuk filter saat ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer tabel: pagination */}
          <div className="flex items-center justify-between gap-4 border-t border-white/30 dark:border-white/10 px-4 py-3">
            <div className="text-xs text-blue-900/60 dark:text-white/60">
              Total: {meta.total} • Halaman {meta.page}/{meta.pages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg px-3 py-2 text-xs bg-white/70 dark:bg-gray-900/40 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-900 disabled:opacity-50"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="rounded-lg px-3 py-2 text-xs bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50"
                disabled={(meta.pages && page >= meta.pages) || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300 px-4 py-3">
            {error}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}