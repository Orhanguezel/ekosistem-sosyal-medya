export const POST_TYPES = [
  "haber",
  "etkilesim",
  "ilan",
  "nostalji",
  "tanitim",
  "kampanya",
] as const;

// ─── Icerik Alt-Kategorileri ──────────────────────────────────
// Her ana tip altinda cesitli icerik formatlari
export const SUB_TYPES = {
  haber: [
    "yerel_haber",       // Bolgesel guncel gelismeler
    "hava_durumu",       // Gunluk hava durumu + tavsiye
    "bugun_tarihte",     // "Bugun tarihte..."
    "belediye",          // Belediye haberleri, kararlar
    "esnaf_haberi",      // Yerel isletme haberleri
    "spor",              // Spor haberleri
  ],
  etkilesim: [
    "soru",              // "Bolgede en iyi X nerede?"
    "anket",             // Evet/Hayir veya secenekli
    "tartisma",          // Goruslerin bolunecegikonular
    "quiz",              // Genel bilgi sorulari
    "tamamla",           // "Bu bolge denince aklima ___"
    "tahmin",            // "Bu yerin neresi oldugunu bildiniz mi?"
    "oneri_iste",        // "Bu konuda nereyi onerirsiniz?"
    "iki_secenekli",     // "A mi B mi? Yorumlarda belirtin!"
  ],
  ilan: [
    "yeni_ilan",         // Yeni ilan duyurusu
    "firsatlar",         // Indirimli ilanlar
    "kategori_ozet",     // "Bu hafta eklenen 15 araba ilani"
    "esnaf_vitrin",      // Yerel esnaf vitrini
    "vefat",             // Vefat / taziye ilani
  ],
  nostalji: [
    "eski_foto",         // Eski fotograflar
    "hatira",            // "X'i hatirlayan var mi?"
    "oncesi_sonrasi",    // Once/sonra karsilastirma
    "yildonumu",         // Onemli yildonumleri
  ],
  tanitim: [
    "mekan_tanitim",     // Gezilecek yerler
    "yemek_tarifi",      // Yerel lezzetler
    "isletme_tanitim",   // Yerel isletme/esnaf tanitimi
    "dogal_guzellik",    // Doga/manzara
    "kultur_sanat",      // Kultur, gelenek, festival
    "rehber",            // "Gezilecek 5 yer" (carousel)
    "infografik",        // Bolgesel istatistikler, bilgi
  ],
  kampanya: [
    "indirim",           // Genel indirim kampanyasi
    "ozel_gun",          // Bayram, yilbasi, ozel gunler
    "yarismali",         // Yorum yap, kazan
    "davet",             // Etkinlige davet
  ],
} as const;

// ─── Gunaydin / Iyi Geceler / Motivasyon (ana tiplerden bagimsiz) ───
// Bunlar "etkilesim" tipi altinda sub_type olarak kullanilir
export const DAILY_CONTENT_SUBTYPES = [
  "gunaydin",            // Sabah selamlama + manzara
  "iyi_geceler",         // Aksam selamlama
  "motivasyon",          // Atasozleri, guzel sozler
  "bilgi_karti",         // Bolge hakkinda ilginc bilgi
  "gunun_sozu",          // Yerel veya genel guzel soz
] as const;

export const PLATFORMS = ["facebook", "instagram", "both"] as const;

export const POST_STATUSES = [
  "draft",
  "scheduled",
  "publishing",
  "posted",
  "failed",
  "cancelled",
] as const;

export const SOURCE_TYPES = ["manual", "news", "ai", "template"] as const;

export const CALENDAR_SLOTS = ["morning", "afternoon", "evening"] as const;

export const CALENDAR_STATUSES = [
  "planned",
  "content_ready",
  "scheduled",
  "published",
  "skipped",
] as const;

export const SLOT_TIMES: Record<string, string> = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "19:00",
};

export const HASHTAG_GROUPS = {
  temel: "#sosyalmedya #icerik #dijital",
  haber: "#haber #guncel #duyuru",
  etkilesim: "#topluluk #etkilesim #yorum",
  nostalji: "#nostalji #hatira #gecmistenbugune",
  ilan: "#firsatlar #duyuru #kampanya",
  eticaret: "#ticaret #satis #pazaryeri",
  genel: "#marka #iletisim #buyume",
  gunluk: "#gunaydin #iyigeceler #gununnotu",
  tanitim: "#tanitim #kultur #lezzet #doga",
  kultur: "#kultur #gelenek #sanat #yasam",
} as const;

// ─── Haftalik Cesitlilik Matrisi ────────────────────────────────
// Her gun icin sabah/ogle/aksam kombinasyonlari
// Hafta boyunca tekrar etmeyen, dengeli bir dagilim saglar
export const WEEKLY_VARIETY_MATRIX = [
  // Pazartesi
  { morning: { type: "etkilesim", sub: "gunaydin" }, afternoon: { type: "haber", sub: "yerel_haber" }, evening: { type: "etkilesim", sub: "soru" } },
  // Sali
  { morning: { type: "haber", sub: "bugun_tarihte" }, afternoon: { type: "etkilesim", sub: "quiz" }, evening: { type: "ilan", sub: "yeni_ilan" } },
  // Carsamba
  { morning: { type: "etkilesim", sub: "gunaydin" }, afternoon: { type: "tanitim", sub: "mekan_tanitim" }, evening: { type: "nostalji", sub: "eski_foto" } },
  // Persembe
  { morning: { type: "haber", sub: "yerel_haber" }, afternoon: { type: "etkilesim", sub: "anket" }, evening: { type: "tanitim", sub: "yemek_tarifi" } },
  // Cuma
  { morning: { type: "etkilesim", sub: "gunaydin" }, afternoon: { type: "etkilesim", sub: "tamamla" }, evening: { type: "ilan", sub: "firsatlar" } },
  // Cumartesi
  { morning: { type: "tanitim", sub: "rehber" }, afternoon: { type: "nostalji", sub: "hatira" }, evening: { type: "etkilesim", sub: "iki_secenekli" } },
  // Pazar
  { morning: { type: "etkilesim", sub: "motivasyon" }, afternoon: { type: "tanitim", sub: "dogal_guzellik" }, evening: { type: "etkilesim", sub: "bilgi_karti" } },
] as const;
