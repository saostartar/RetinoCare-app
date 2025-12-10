"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated, clearAuth, getUser } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState(null); // 'operator' | 'admin' | 'doctor'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    setIsAuth(auth);
    if (auth) {
      const u = getUser();
      setRole(u?.role ?? null);
    } else {
      setRole(null);
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsAuth(false);
    setRole(null);
    router.push("/");
  };

  // Role-based navigation permissions
  const canSeeExam = role === "operator";
  const canSeeHistory = role === "operator";
  const canSeeDashboard = role === "admin" || role === "doctor";

  return (
    <nav className="backdrop-blur-sm bg-blue-600/95 text-white shadow-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-2">
            <div className="relative flex items-center justify-center h-10 w-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-accent rounded-full opacity-70 animate-pulse-ring"></div>
              <div className="absolute inset-[3px] bg-blue-600 rounded-full flex items-center justify-center z-10">
                <span className="text-xl font-bold">R</span>
              </div>
            </div>
            <div className="relative overflow-hidden">
              <span className="text-xl font-bold">RetinoCare</span>
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-gradient-to-r from-blue-300 via-white to-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Menu umum */}
            <Link href="/edukasi" className="relative overflow-hidden group">
              <span className="relative z-10 px-3 py-2 block">Edukasi</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
            </Link>
            {/* <Link href="/detect" className="relative overflow-hidden group">
              <span className="relative z-10 px-3 py-2 block">Deteksi</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
            </Link> */}

            {isAuth ? (
              <>
                {canSeeExam && (
                  <Link href="/exam" className="relative overflow-hidden group">
                    <span className="relative z-10 px-3 py-2 block">
                      Pemeriksaan
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
                  </Link>
                )}
                {canSeeHistory && (
                  <Link
                    href="/riwayat"
                    className="relative overflow-hidden group">
                    <span className="relative z-10 px-3 py-2 block">
                      Riwayat
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
                  </Link>
                )}
                {canSeeDashboard && (
                  <Link
                    href="/dashboard"
                    className="relative overflow-hidden group">
                    <span className="relative z-10 px-3 py-2 block">
                      Dashboard
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="relative px-5 py-2 rounded-md overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 z-0"></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                  <span className="absolute inset-0 border border-white/20 rounded-md z-0"></span>
                  <span className="relative z-10">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="relative overflow-hidden group">
                  <span className="relative z-10 px-3 py-2 block">Login</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform"></span>
                </Link>
                <Link
                  href="/register"
                  className="relative px-5 py-2 rounded-md overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 z-0"></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                  <span className="absolute inset-0 border border-white/20 rounded-md z-0"></span>
                  <span className="relative z-10">Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative h-10 w-10 p-2 rounded-md group"
            aria-label="Menu">
            <span className="absolute inset-0 rounded-md bg-white/10 group-hover:bg-white/20 transition-colors"></span>
            <div className="w-6 h-6 flex flex-col justify-center items-end">
              <span
                className={`block h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "w-6 -rotate-45 translate-y-[3px]" : "w-6"
                }`}></span>
              <span
                className={`block h-0.5 bg-white mt-1.5 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0 w-6" : "opacity-100 w-4"
                }`}></span>
              <span
                className={`block h-0.5 bg-white mt-1.5 transition-all duration-300 ${
                  isMobileMenuOpen ? "w-6 rotate-45 -translate-y-[9px]" : "w-5"
                }`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}>
          <div className="flex flex-col space-y-2 border-t border-white/10 pt-3">
            {/* Umum */}
            <Link
              href="/edukasi"
              className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}>
              <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
              Edukasi
            </Link>
            {/* <Link
              href="/detect"
              className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}>
              <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
              Deteksi
            </Link> */}

            {isAuth ? (
              <>
                {canSeeExam && (
                  <Link
                    href="/exam"
                    className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                    Pemeriksaan
                  </Link>
                )}
                {canSeeHistory && (
                  <Link
                    href="/riwayat"
                    className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                    Riwayat
                  </Link>
                )}
                {canSeeDashboard && (
                  <Link
                    href="/dashboard"
                    className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 rounded-md bg-red-500/80 hover:bg-red-500 transition-colors flex items-center">
                  <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                  Login
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-3 rounded-md bg-green-500/80 hover:bg-green-500 transition-colors flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="w-1 h-5 bg-white/50 rounded-full mr-3"></span>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
