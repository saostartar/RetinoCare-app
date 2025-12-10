"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminStats } from "../../lib/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      try {
        await adminStats();
        if (!cancelled) router.replace("/dashboard/admin");
      } catch (e) {
        if (e?.response?.status === 403) {
          if (!cancelled) router.replace("/dashboard/doctor");
        } else {
          setErr(e.message || "Gagal mendeteksi peran");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    detect();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        {err ? (
          <div className="text-sm text-red-500">{err}</div>
        ) : (
          <div className="text-sm text-blue-600 dark:text-blue-300 animate-pulse">
            Memuat dashboard...
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}