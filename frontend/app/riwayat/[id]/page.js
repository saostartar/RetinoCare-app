"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import {
  getExam,
  downloadExamPdf,
  listExamNotes,
  createExamNote,
  fetchExamPdfBlob,
} from "../../../lib/api";
import { getUser } from "../../../lib/auth";

export default function HistoryDetailPage() {
  const { id: examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const handleImageLoad = (imageId) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
    setImageErrors((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const handleImageError = (imageId) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
    setImageErrors((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getImageUrl = (filePath, filename, imageUrl) => {
    // Prefer explicit image_url from backend which already contains /api prefix
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (imageUrl) {
      // If backend returns relative path like /api/uploads/xyz use it directly
      return imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`;
    }
    if (!filePath && !filename) return "";
    const name = filename || (filePath ? filePath.split(/[/\\]/).pop() : "");
    return `${baseUrl}/api/uploads/${name}`;
  };

  const openPdfPreview = async () => {
    if (!examId || pdfLoading) return;
    setPdfError(null);
    setPdfLoading(true);
    try {
      const blob = await fetchExamPdfBlob(examId);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setPdfPreviewOpen(true);
    } catch (e) {
      console.error("Failed to load PDF preview", e);
      setPdfError("Gagal memuat PDF");
      alert("Gagal memuat PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadExamPdf(examId);
    } catch (e) {
      console.error("Download failed", e);
      alert("Download gagal");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPdf = () => {
    if (!pdfBlobUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.src = pdfBlobUrl;
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 100);
    };
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 10000);
  };

  // Event handler untuk keyboard shortcuts di modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && selectedImage) {
        closeImageModal();
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  // Load exam data
  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getExam(examId);
        const examData = res.exam || res;
        setExam(examData);

        // Initialize loading states untuk semua images
        if (examData.images && examData.images.length > 0) {
          const loadingStates = {};
          examData.images.forEach((img) => {
            loadingStates[img.id] = true;
          });
          setImageLoadingStates(loadingStates);
        }
      } catch (err) {
        console.error("Load exam error:", err);
        setError(err.message || "Gagal memuat detail pemeriksaan");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  // Load user role client-side
  useEffect(() => {
    const u = getUser();
    if (u?.role) setUserRole(u.role);
  }, [examId]);

  // Load notes
  useEffect(() => {
    if (!examId) return;
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        const res = await listExamNotes(examId);
        setNotes(res.notes || []);
      } catch (e) {
        console.error("Failed to load notes", e);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [examId]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      setSubmittingNote(true);
      const res = await createExamNote(examId, noteContent.trim());
      setNotes((prev) => [...prev, res.note]); // backend returns ascending list expectation
      setNoteContent("");
    } catch (err) {
      console.error("Create note failed", err);
      alert(err.response?.data?.error || "Gagal menambah catatan");
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-transparent">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-500/10 blur-3xl rounded-full" />
      </div>

      <Navbar />

      <main className="relative container mx-auto max-w-5xl px-6 md:px-10 lg:px-12 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900/90 dark:text-white/90">
              Detail Pemeriksaan #{examId}
            </h1>
            <p className="mt-2 text-sm text-blue-900/60 dark:text-white/60">
              Ringkasan hasil, data pasien, dan output model.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-colors"
              onClick={openPdfPreview}
              disabled={pdfLoading}>
              {pdfLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-30"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Memuat PDF...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Lihat PDF
                </>
              )}
            </button>
            <Link
              href="/riwayat"
              className="rounded-lg bg-white/70 dark:bg-gray-900/40 text-sm px-4 py-2.5 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-900 transition-colors">
              Kembali
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-effect rounded-xl p-6 animate-pulse">
            <div className="h-4 w-40 bg-blue-900/10 dark:bg-white/10 rounded mb-3" />
            <div className="h-3 w-64 bg-blue-900/10 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-56 bg-blue-900/10 dark:bg-white/10 rounded" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        {exam && (
          <div className="space-y-6">
            {/* Ringkasan */}
            <section className="glass-effect rounded-xl p-6">
              <h2 className="font-semibold text-blue-900 dark:text-white mb-3">
                Diagnosis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-blue-900/80 dark:text-white/70">
                  <span className="text-blue-900/60 dark:text-white/60">
                    Status:
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      exam.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : exam.status === "analyzing"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }`}>
                    {exam.status}
                  </span>
                </div>
                <div className="text-blue-900/80 dark:text-white/70">
                  <span className="text-blue-900/60 dark:text-white/60">
                    Dibuat:
                  </span>{" "}
                  {new Date(exam.created_at).toLocaleString("id-ID")}
                </div>
                <div className="text-blue-900/80 dark:text-white/70">
                  <span className="text-blue-900/60 dark:text-white/60">
                    Diperbarui:
                  </span>{" "}
                  {new Date(exam.updated_at).toLocaleString("id-ID")}
                </div>
              </div>
              {exam.result_summary && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Hasil:{" "}
                  </span>
                  <span className="text-sm text-blue-900/80 dark:text-blue-200">
                    {exam.result_summary}
                  </span>
                </div>
              )}
            </section>

            {/* Data Pasien */}
            <section className="glass-effect rounded-xl p-6">
              <h2 className="font-semibold text-blue-900 dark:text-white mb-4">
                Data Pasien
              </h2>
              {exam.patient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-blue-900/80 dark:text-white/70">
                    <span className="text-blue-900/60 dark:text-white/60">
                      Usia:
                    </span>{" "}
                    {exam.patient.age ?? "-"}
                  </div>
                  <div className="text-blue-900/80 dark:text-white/70">
                    <span className="text-blue-900/60 dark:text-white/60">
                      Jenis Kelamin:
                    </span>{" "}
                    {exam.patient.gender ?? "-"}
                  </div>
                  <div className="text-blue-900/80 dark:text-white/70">
                    <span className="text-blue-900/60 dark:text-white/60">
                      Durasi Diabetes (th):
                    </span>{" "}
                    {exam.patient.diabetes_duration_years ?? "-"}
                  </div>
                  <div className="text-blue-900/80 dark:text-white/70">
                    <span className="text-blue-900/60 dark:text-white/60">
                      Hipertensi:
                    </span>{" "}
                    {exam.patient.hypertension === true
                      ? "Ya"
                      : exam.patient.hypertension === false
                      ? "Tidak"
                      : "-"}
                  </div>
                  {exam.patient.notes && (
                    <div className="md:col-span-2 text-blue-900/80 dark:text-white/70">
                      <span className="text-blue-900/60 dark:text-white/60">
                        Catatan:
                      </span>{" "}
                      {exam.patient.notes}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-900/60 dark:text-white/60">
                  Tidak ada data pasien
                </p>
              )}
            </section>

            {/* Gambar dengan Preview */}
            <section className="glass-effect rounded-xl p-6">
              <h2 className="font-semibold text-blue-900 dark:text-white mb-4">
                Gambar Retina
              </h2>
              {exam.images && exam.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exam.images.map((img) => (
                    <div key={img.id} className="group relative">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-white/20 dark:border-white/10 cursor-pointer">
                        {/* Loading State */}
                        {imageLoadingStates[img.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <svg
                              className="h-8 w-8 animate-spin text-blue-500"
                              viewBox="0 0 24 24"
                              fill="none">
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="opacity-30"
                              />
                              <path
                                d="M21 12a9 9 0 0 0-9-9"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Error State */}
                        {imageErrors[img.id] ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                            <svg
                              className="h-12 w-12 mb-2"
                              viewBox="0 0 24 24"
                              fill="none">
                              <path
                                d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-xs text-center px-2">
                              Gambar tidak dapat dimuat
                            </span>
                            <span className="text-xs text-center px-2 mt-1 opacity-60">
                              Klik untuk mencoba lagi
                            </span>
                          </div>
                        ) : (
                          /* Image */
                          <Image
                            src={getImageUrl(
                              img.file_path,
                              img.filename,
                              img.image_url
                            )}
                            alt={`Gambar retina ${img.eye_side} - ID: ${img.id}`}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            onLoad={() => handleImageLoad(img.id)}
                            onError={() => handleImageError(img.id)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={false}
                          />
                        )}

                        {/* Overlay info */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => handleImageClick(img)}>
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm font-medium">
                              #{img.id}
                            </p>
                            <p className="text-white/80 text-xs capitalize">
                              {img.eye_side}
                            </p>
                          </div>
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(img);
                              }}
                              className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-white/30 transition-colors"
                              aria-label="Lihat gambar penuh">
                              <svg
                                className="h-4 w-4 text-white"
                                viewBox="0 0 24 24"
                                fill="none">
                                <path
                                  d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Click area untuk error state */}
                        {imageErrors[img.id] && (
                          <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => {
                              // Reset error state dan coba load ulang
                              setImageErrors((prev) => ({
                                ...prev,
                                [img.id]: false,
                              }));
                              setImageLoadingStates((prev) => ({
                                ...prev,
                                [img.id]: true,
                              }));

                              // Force reload image dengan timestamp baru
                              const imgElement = document.querySelector(
                                `img[alt*="ID: ${img.id}"]`
                              );
                              if (imgElement) {
                                const newUrl =
                                  getImageUrl(
                                    img.file_path,
                                    img.filename,
                                    img.image_url
                                  ) +
                                  "?retry=" +
                                  Date.now();
                                imgElement.src = newUrl;
                              }
                            }}
                          />
                        )}
                      </div>

                      {/* Image info below */}
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-blue-900 dark:text-white">
                          {img.eye_side === "left"
                            ? "Mata Kiri"
                            : img.eye_side === "right"
                            ? "Mata Kanan"
                            : img.eye_side}
                        </p>
                        <p className="text-xs text-blue-900/60 dark:text-white/60 truncate">
                          {img.filename || img.file_path.split(/[/\\]/).pop()}
                        </p>
                        {img.uploaded_at && (
                          <p className="text-xs text-blue-900/50 dark:text-white/50">
                            {new Date(img.uploaded_at).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="h-16 w-16 text-gray-400 mx-auto mb-4"
                    viewBox="0 0 24 24"
                    fill="none">
                    <path
                      d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-blue-900/60 dark:text-white/60">
                    Belum ada gambar
                  </p>
                </div>
              )}
            </section>

            {/* Catatan Dokter (menggantikan Output Model) */}
            <section className="glass-effect rounded-xl p-0 overflow-hidden">
              <div className="px-6 pt-6 flex items-center justify-between">
                <h2 className="font-semibold text-blue-900 dark:text-white mb-3">
                  Catatan Dokter
                </h2>
              </div>
              <div className="px-6 pb-6 space-y-4">
                {notesLoading ? (
                  <p className="text-sm text-blue-900/60 dark:text-white/60">
                    Memuat catatan...
                  </p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-blue-900/60 dark:text-white/60">
                    Belum ada catatan
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {notes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg bg-white/60 dark:bg-gray-900/40 border border-white/40 dark:border-white/10 p-3 shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-blue-900/80 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                              {n.content}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {userRole === "doctor" && (
                  <form
                    onSubmit={handleCreateNote}
                    className="space-y-2 pt-2 border-t border-white/30 dark:border-white/10">
                    <textarea
                      className="w-full rounded-lg border border-white/40 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y min-h-[90px]"
                      placeholder="Tulis catatan untuk operator..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      disabled={submittingNote}
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-900/40 dark:text-white/40">
                        {noteContent.length}/1000
                      </span>
                      <button
                        type="submit"
                        disabled={submittingNote || !noteContent.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-500 text-white text-xs font-medium px-4 py-2 hover:bg-blue-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors">
                        {submittingNote ? "Menyimpan..." : "Tambah Catatan"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Tutup preview">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Image container */}
            <div className="relative aspect-square w-full max-h-[80vh] rounded-lg overflow-hidden bg-gray-900">
              <Image
                src={getImageUrl(
                  selectedImage.file_path,
                  selectedImage.filename,
                  selectedImage.image_url
                )}
                alt={`Gambar retina ${selectedImage.eye_side} - ID: ${selectedImage.id}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
                onError={(e) => {
                  console.error(
                    "Failed to load modal image:",
                    getImageUrl(selectedImage.file_path, selectedImage.filename)
                  );
                  // Optional: show error state in modal
                }}
              />
            </div>

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white font-medium text-lg">
                Gambar Retina #{selectedImage.id}
              </h3>
              <p className="text-white/80 text-sm capitalize">
                {selectedImage.eye_side === "left"
                  ? "Mata Kiri"
                  : selectedImage.eye_side === "right"
                  ? "Mata Kanan"
                  : selectedImage.eye_side}
              </p>
              <p className="text-white/60 text-xs mt-1">
                {selectedImage.filename ||
                  selectedImage.file_path.split(/[/\\]/).pop()}
              </p>
              {selectedImage.uploaded_at && (
                <p className="text-white/60 text-xs">
                  Diunggah:{" "}
                  {new Date(selectedImage.uploaded_at).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
      {pdfPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Preview PDF Pemeriksaan #{examId}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 focus:outline-none">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9V4h12v5M6 18h12v2H6v-2ZM6 14h12v4H6v-4Zm0 0H4v-4h16v4h-2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 text-white text-xs font-medium hover:bg-blue-400 disabled:opacity-50 focus:outline-none">
                  {downloading ? "Mengunduh..." : "Download"}
                </button>
                <button
                  onClick={() => {
                    setPdfPreviewOpen(false);
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-medium hover:bg-red-400 focus:outline-none">
                  Tutup
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
              {pdfBlobUrl ? (
                <iframe
                  title="PDF Preview"
                  src={pdfBlobUrl}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  {pdfError || "Memuat..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
