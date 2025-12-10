import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function Icon({ name, className = "" }) {
  const base = "w-5 h-5";
  switch (name) {
    case "check":
      return (
        <svg className={`${base} ${className}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={`${base} ${className}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4zM19 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM13 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
        </svg>
      );
    case "exclamation":
      return (
        <svg className={`${base} ${className}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 8v5m0 4h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
        </svg>
      );
    case "alert":
      return (
        <svg className={`${base} ${className}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case "pulse":
      return (
        <svg className={`${base} ${className}`} viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    default:
      return null;
  }
}

function stylesFor(key) {
  const map = {
    no_dr: {
      grad: "from-green-50 to-white dark:from-green-900/10 dark:to-transparent",
      edge: "from-green-500 to-emerald-500",
      ring: "ring-green-300/40 dark:ring-green-400/20",
      icon: "text-green-600 dark:text-green-400",
      chip: "bg-green-500/10 text-green-700 dark:text-green-300",
      label: "Tidak Ada DR",
      iconName: "check",
    },
    mild: {
      grad: "from-amber-50 to-white dark:from-amber-900/10 dark:to-transparent",
      edge: "from-amber-500 to-yellow-500",
      ring: "ring-amber-300/40 dark:ring-amber-400/20",
      icon: "text-amber-600 dark:text-amber-400",
      chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      label: "Ringan",
      iconName: "sparkles",
    },
    moderate: {
      grad: "from-orange-50 to-white dark:from-orange-900/10 dark:to-transparent",
      edge: "from-orange-500 to-orange-600",
      ring: "ring-orange-300/40 dark:ring-orange-400/20",
      icon: "text-orange-600 dark:text-orange-400",
      chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
      label: "Sedang",
      iconName: "exclamation",
    },
    severe: {
      grad: "from-red-50 to-white dark:from-red-900/10 dark:to-transparent",
      edge: "from-red-500 to-rose-600",
      ring: "ring-red-300/40 dark:ring-red-400/20",
      icon: "text-red-600 dark:text-red-400",
      chip: "bg-red-500/10 text-red-700 dark:text-red-300",
      label: "Berat",
      iconName: "alert",
    },
    proliferative: {
      grad: "from-purple-50 to-white dark:from-purple-900/10 dark:to-transparent",
      edge: "from-purple-500 to-fuchsia-600",
      ring: "ring-purple-300/40 dark:ring-purple-400/20",
      icon: "text-purple-600 dark:text-purple-400",
      chip: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      label: "Proliferatif",
      iconName: "pulse",
    },
  };
  return map[key] ?? map.no_dr;
}

export default function EducationPage() {
  const levels = [
    {
      key: "no_dr",
      title: "No DR (Tidak Ada Retinopati)",
      desc: "Tidak ditemukan tanda retinopati diabetik. Rekomendasi: kontrol rutin sesuai jadwal.",
    },
    {
      key: "mild",
      title: "Mild NPDR",
      desc: "Mikroaneurisma kecil. Rekomendasi: pemantauan berkala dan kendali gula darah yang baik.",
    },
    {
      key: "moderate",
      title: "Moderate NPDR",
      desc: "Perdarahan & eksudat lunak mungkin muncul. Rekomendasi: evaluasi lanjutan oleh dokter mata.",
    },
    {
      key: "severe",
      title: "Severe NPDR",
      desc: "Tanda-tanda lebih berat. Rekomendasi: rujuk segera ke dokter spesialis mata.",
    },
    {
      key: "proliferative",
      title: "Proliferative DR (PDR)",
      desc: "Pertumbuhan pembuluh darah baru. Rekomendasi: terapi segera untuk mencegah kehilangan penglihatan.",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      <Navbar />

      {/* Dekorasi latar unik */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 w-[36rem] h-[36rem] rounded-full bg-orange-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-12 pt-10 md:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full glass-effect px-3 py-1 ring-1 ring-inset ring-white/20">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Edukasi</span>
        </div>

        <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-blue-200 via-blue-500 to-orange-500 bg-clip-text text-transparent">
            Retinopati Diabetik
          </span>{" "}
          — tingkat keparahan & tindak lanjut
        </h1>

        <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-600 dark:text-white/70">
          Ringkasan tiap tingkatan DR beserta rekomendasi singkat untuk membantu pengambilan keputusan klinis.
        </p>

        {/* Indeks cepat */}
        <div className="mt-6 flex flex-wrap gap-2">
          {levels.map((lv) => {
            const s = stylesFor(lv.key);
            return (
              <a
                key={lv.key}
                href={`#${lv.key}`}
                className={`group relative rounded-full px-3 py-1.5 text-xs md:text-sm transition-all hover:scale-[1.02] ring-1 ring-inset ${s.ring} ${s.chip}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name={s.iconName} className={`${s.icon}`} />
                  {lv.title}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Grid level */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-10 lg:px-12 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {levels.map((lv) => {
            const s = stylesFor(lv.key);
            return (
              <article
                key={lv.key}
                id={lv.key}
                className={`group relative overflow-hidden rounded-xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm p-5 transition-all hover:shadow-xl ${s.ring}`}
              >
                {/* Aksen tepi gradien */}
                <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${s.edge}`}></span>

                {/* Aura gradien halus */}
                <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <div className={`absolute -top-20 -right-16 h-52 w-52 rounded-full blur-3xl bg-gradient-to-br ${s.edge} opacity-20`}></div>
                </div>

                <div className="relative z-10 flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10 ring-1 ring-inset ring-white/20`}>
                    <Icon name={s.iconName} className={`${s.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-foreground">
                      {lv.title}
                    </h3>
                    <div className="mt-1 inline-flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.icon.replace("text-", "bg-")}`}></span>
                        {s.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="relative z-10 mt-4 text-sm text-gray-600 dark:text-white/70">
                  {lv.desc}
                </p>

                <div className="relative z-10 mt-5 flex items-center justify-between">
                  <a
                    href="#top"
                    className="text-xs font-medium text-blue-600 hover:underline dark:hover:text-blue-400"
                    aria-label="Kembali ke atas"
                  >
                    Kembali ke atas
                  </a>
                  <span className="text-[11px] text-gray-500 dark:text-white/50">Kode: {lv.key}</span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Catatan penting */}
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-white/20 dark:border-white/5 p-5">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl"></div>
            <div className="relative z-10 flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-md bg-blue-600/10 ring-1 ring-inset ring-blue-600/20">
                <Icon name="exclamation" className="text-blue-700 dark:text-blue-300" />
              </div>
              <p className="text-sm text-blue-900/90 dark:text-blue-200">
                Informasi ini bersifat edukatif. Keputusan klinis akhir berada pada dokter pemeriksa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}