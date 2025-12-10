"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { listExams, verifyExam } from "../../../lib/api";

export default function DoctorDashboardPage() {
  const [latest, setLatest] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const r = await listExams({ page: 1, perPage: 10 });
      setLatest(r.items || []);
    } catch (err) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleVerify(id) {
    try {
      setInfo(null);
      await verifyExam(id);
      setInfo(`Exam #${id} terverifikasi`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Verifikasi gagal");
    }
  }

  const ui = {
    toneChip: "text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-600/20",
    heroTitle: "Dashboard Dokter",
    heroDesc: "Antrian verifikasi dan ringkasan klinis terbaru.",
    glowA: "bg-emerald-500/10",
    glowB: "bg-blue-500/10",
    cardRing: "ring-emerald-300/40",
    cardAccent: "text-emerald-200",
    badgeTone: "bg-emerald-500/10 text-emerald-300",
    actionPrimary: "btn-primary bg-emerald-600 hover:bg-emerald-700 text-white",
    verifyTone: "bg-emerald-600 hover:bg-emerald-700 text-white",
    borderTone: "border-white/20 dark:border-white/5",
  };

  const unverifiedCount = useMemo(
    () => latest.filter((x) => x.status !== "verified").length,
    [latest]
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className={`absolute -top-28 -left-28 w-[28rem] h-[28rem] rounded-full blur-3xl ${ui.glowA}`}></div>
        <div className={`absolute top-1/3 -right-24 w-[36rem] h-[36rem] rounded-full blur-3xl ${ui.glowB}`}></div>
      </div>

      <main className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12 py-8 md:py-10 space-y-8">
        <section className={`relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm ${ui.borderTone} p-6`}>
          <div className="relative z-10 flex items-start justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${ui.toneChip}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current/50"></span>
                Dokter
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {ui.heroTitle}
              </h1>
              <p className={`mt-1.5 text-sm ${ui.cardAccent}`}>{ui.heroDesc}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/exam" className={`rounded-md px-3 py-2 text-sm font-medium ${ui.actionPrimary}`}>
                Pemeriksaan Baru
              </Link>
              <Link href="/riwayat" className="rounded-md px-3 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white/90">
                Lihat Riwayat
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className={`relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm ${ui.borderTone}`}>
              <div className="flex items-center justify-between px-5 pt-5">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-white">Pemeriksaan Terbaru</h2>
                  <p className={`text-xs ${ui.cardAccent}`}>Antrian verifikasi: {unverifiedCount}</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-white/70">
                    <tr className="border-b border-white/10">
                      <th className="px-5 py-2 font-medium">ID</th>
                      <th className="px-5 py-2 font-medium">Tanggal</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                      <th className="px-5 py-2 font-medium">Ringkasan</th>
                      <th className="px-5 py-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((ex) => {
                      const verified = ex.status === "verified";
                      const completable = ex.status === "completed" || verified;
                      return (
                        <tr key={ex.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-5 py-3 text-white/90">#{ex.id}</td>
                          <td className="px-5 py-3 text-white/70">{new Date(ex.created_at).toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ui.badgeTone}`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 max-w-[22rem] truncate text-white/80">
                            {ex.result_summary || "-"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                className="rounded-md px-2.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white"
                                href={`/riwayat/${ex.id}`}
                              >
                                Detail
                              </Link>
                              {completable && (
                                <button
                                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${ui.verifyTone} disabled:opacity-60`}
                                  onClick={() => handleVerify(ex.id)}
                                  disabled={verified}
                                  title={verified ? "Sudah terverifikasi" : "Verifikasi hasil"}
                                >
                                  {verified ? "Terverifikasi" : "Verifikasi"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {latest.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-white/60">
                          Tidak ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {loading && <div className="px-5 py-6 text-sm text-white/70">Memuat...</div>}
              {error && <div className="px-5 py-4 text-sm text-red-400">{error}</div>}
              {info && <div className="px-5 py-4 text-sm text-emerald-300">{info}</div>}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className={`relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm ${ui.borderTone} p-5`}>
              <h3 className="text-sm font-semibold text-white">Ringkas Peran</h3>
              <p className={`mt-1 text-xs ${ui.cardAccent}`}>
                Tinjau hasil, verifikasi temuan, dan lanjutkan tindak klinis.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link href="/riwayat" className="rounded-md px-3 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white">
                  Telusuri Riwayat
                </Link>
                <Link href="/exam" className={`rounded-md px-3 py-2 text-xs font-medium ${ui.actionPrimary}`}>
                  Pemeriksaan Baru
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}