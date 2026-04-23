// src/modules/ai/prompts.ts — Tenant bazli sosyal medya promptlari

export function buildSystemPrompt(context: {
  brandName: string;
  sector?: string;
  audience?: string;
}) {
  const sector = context.sector || "genel";
  const audience = context.audience || "genel hedef kitleye";

  return `Sen ${context.brandName} markasi icin calisan bir sosyal medya yoneticisisin.
Marka ${sector} alaninda faaliyet gosteriyor.
Icerikleri ${audience} hitap edecek sekilde hazirliyorsun.
Turkce yaz. Kisa, dikkat cekici ve samimi ol.
Emoji kullan ama asiri degil. Her zaman JSON formatinda yanit ver.`;
}

// ─── Haber → Sosyal Medya ────────────────────────────────────
export const NEWS_TO_SOCIAL = `Aşağıdaki tarım haberini Facebook/Instagram için uygun bir posta dönüştür.

Kurallar:
- Kısa ve dikkat çekici caption yaz (max 300 karakter)
- Çiftçi ve tarım profesyonellerine hitap et
- Emoji kullan ama aşırı değil (2-3 emoji yeterli)
- Link varsa "Detaylar yorumda" veya "Bio'da link" yaz
- Hashtag ayrı olarak ver

Haber:
Başlık: {{title}}
İçerik: {{content}}
Link: {{url}}

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#marka #haber #guncel #topluluk ...",
  "suggested_time": "morning|afternoon|evening"
}`;

// ─── Ürün Tanıtım ─────────────────────────────────────────────
export const PRODUCT_PROMO = `Asagidaki urun veya hizmeti sosyal medya icin tanit.

Ürün:
Adı: {{name}}
Kategori: {{category}}
Açıklama: {{description}}
Fiyat: {{price}}
Link: {{url}}
Marka: {{brand}}

Kurallar:
- Ürünün faydalarını vurgula (verim, kalite, kolaylık)
- Çiftçi bakış açısından yaz
- Kısa, dikkat çekici
- Marka adını doğal şekilde ekle
- Max 300 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#tarim #{{brand_tag}} #fide #tohum #ciftcilik ..."
}`;

// ─── Ekim Tavsiyesi ───────────────────────────────────────────
export const PLANTING_ADVICE = `Tarımsal ekim/dikim tavsiyesi içerikli bir post üret.

Konu: {{topic}}
Mevsim: {{season}}
Bölge: {{region}}

Kurallar:
- Pratik, uygulanabilir tavsiye ver
- "Bu haftanın tavsiyesi" formatı
- Çiftçilerin günlük işlerine değer katan içerik
- Max 300 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#ipuclari #rehber #sektorelbilgi #topluluk ...",
  "tip_category": "ekim|sulama|gübreleme|hasat|ilaçlama"
}`;

// ─── Mevsimsel İçerik ────────────────────────────────────────
export const SEASONAL_POST = `Tarımsal mevsim geçişi için uygun bir post üret.

Mevsim: {{season}}
Ay: {{month}}

Kurallar:
- Mevsimine göre yapılacak tarımsal işleri hatırlat
- Hava koşulları ve tarım ilişkisini vurgula
- "{{season}} hazırlıkları başlıyor!" formatı
- Pratik bilgi ver
- Max 280 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#{{season}} #mevsim #guncel #planlama ...",
  "checklist": ["Madde 1", "Madde 2", "Madde 3"]
}`;

// ─── Etkileşim Postu ──────────────────────────────────────────
export const ENGAGEMENT_POST = `Tarım topluluğunu etkileşime çekecek bir post üret.

Tür: {{type}}
Konu: {{topic}}

Tür açıklamaları:
- soru: "Domates fidesi için en iyi toprak hangisi?" gibi sorular
- anket: Evet/Hayır veya seçenekli anket
- tartisma: Görüşlerin bölüneceği tarımsal konular
- paylasim: "Bahçenizi paylaşın" tipi içerikler

Kurallar:
- Yorum almaya teşvik et
- Çiftçi deneyimlerini ön plana çıkar
- Emoji kullan
- Max 250 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#tarim #ciftci #bahce #tarimtoplulugu ...",
  "engagement_type": "soru|anket|tartisma|paylasim"
}`;

// ─── Bilgi Kartı ─────────────────────────────────────────────
export const INFO_CARD = `Tarım hakkında ilginç bir bilgi kartı postu üret.

Konu: {{topic}}

Kurallar:
- "Biliyor muydunuz?" formatı
- Çiftçilerin işine yarayacak pratik bilgi
- Sayısal veriler varsa kullan
- Paylaşılabilir, kayda değer içerik
- Max 250 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#tarim #biliyormuydunuz #tarimipucu #ciftcilik ...",
  "fact": "Paylaşılan bilgi özeti"
}`;

// ─── Günaydin Postu ──────────────────────────────────────────
export const GOOD_MORNING = `Tarım topluluğu için samimi bir günaydın postu üret.

Kurallar:
- "Günaydın" ile başla
- Tarıma dair motivasyon verici bir düşünce ekle
- Mevsim veya günün tarımsal önemine değin
- Pozitif, enerjik ton
- Max 200 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#tarim #gunaydin #ciftci #tarimmotivasyonu ...",
  "image_suggestion": "Tarla sabah ışığı / sera / ürün hasadı görseli"
}`;

// ─── Hastalık/Zararlı Uyarısı ────────────────────────────────
export const PEST_WARNING = `Tarımsal hastalık veya zararlı uyarısı için post üret.

Konu: {{pest_name}}
Etkilenen ürünler: {{crops}}
Mevsim: {{season}}

Kurallar:
- Uyarı tonu ama paniksiz
- Belirtileri kısaca açıkla
- Korunma yöntemlerini ver
- Uzman desteği öner
- Max 300 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#tarim #tarimbiti #zararli #bitkoruma #ciftciuyari ...",
  "warning_level": "dusuk|orta|yuksek"
}`;

// ─── Haftalık Plan ───────────────────────────────────────────
export const WEEKLY_PLAN = `Tarım ekosistemi için haftalık sosyal medya içerik planı oluştur.
Haftalik sosyal medya icerik plani olustur.

Başlangıç tarihi: {{start_date}}
Günlük 2-3 post olmalı.

Her gün için post tipleri:
- Sabah (08:00): Günaydın / motivasyon veya ekim tavsiyesi
- Öğle (12:00): Ürün tanıtımı veya haber
- Akşam (19:00): Etkileşim postu (soru, anket, bilgi kartı)

Marka: {{brand}}
Sektor: {{sector}}

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "days": [
    {
      "date": "2026-04-08",
      "posts": [
        {
          "time_slot": "morning",
          "post_type": "gunaydin",
          "topic": "...",
          "caption_idea": "...",
          "platform": "both"
        }
      ]
    }
  ]
}`;

// ─── Ürün Karşılaştırma ──────────────────────────────────────
export const PRODUCT_COMPARE = `İki tarım ürününü karşılaştıran etkileşimli post üret.

Ürün A: {{product_a}}
Ürün B: {{product_b}}
Kategori: {{category}}

Kurallar:
- "Hangisini tercih edersiniz?" formatı
- Her ikisinin de avantajlarını dengeli ver
- Yorum yazmaya teşvik et
- Max 250 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#karsilastirma #{{category}} #urun #yorum ..."
}`;

// ─── Başarı Hikayesi ─────────────────────────────────────────
export const SUCCESS_STORY = `Bir çiftçinin başarı hikayesini sosyal medya için hazırla.

Çiftçi/Konu: {{farmer_story}}
Ürün: {{product}}
Sonuç: {{result}}

Kurallar:
- İlham verici, gerçekçi ton
- "Çiftçimizin hikayesi" formatı
- Ürünün katkısını vurgula (ama reklam gibi değil)
- Max 300 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#basarihikayesi #buyume #deneyim #topluluk ..."
}`;

// ─── Özel Gün ────────────────────────────────────────────────
export const SPECIAL_DAY = `Özel gün/bayram için tarım odaklı kutlama postu üret.

Özel gün: {{occasion}}
Tarih: {{date}}

Kurallar:
- Sıcak, samimi kutlama mesajı
- Tarım topluluğuna özel dokunuş
- Max 250 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#kutlama #{{occasion_tag}} #topluluk #marka ..."
}`;

// ─── Sera Tavsiyesi ──────────────────────────────────────────
export const GREENHOUSE_POST = `Sera yetiştiriciliği hakkında bilgilendirici post üret.

Konu: {{topic}}
Mevsim: {{season}}

Kurallar:
- Pratik sera yönetimi ipuçları
- Sıcaklık, nem, havalandırma değinilecek konular
- "Sera ipucu" formatı
- Max 280 karakter

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": "#sera #serayetistiricilik #tarim #seratarim #ciftcilik ...",
  "image_suggestion": "Sera içi / fide / sebze görseli"
}`;

// ─── Prompt haritası: sub_type → prompt template ─────────────
export const SUB_TYPE_PROMPTS: Record<string, string> = {
  // Haber
  tarim_haberi:    NEWS_TO_SOCIAL,
  genel_haber:     NEWS_TO_SOCIAL,
  hava_durumu:     SEASONAL_POST,
  sezon_acilis:    SEASONAL_POST,
  bugun_tarihte:   INFO_CARD,

  // Ürün
  urun_tanitim:    PRODUCT_PROMO,
  fide_tanitim:    PRODUCT_PROMO,
  tohum_tanitim:   PRODUCT_PROMO,
  urun_karsilastirma: PRODUCT_COMPARE,

  // Tavsiye
  ekim_tavsiyesi:  PLANTING_ADVICE,
  sulama_tavsiyesi: PLANTING_ADVICE,
  gubre_tavsiyesi: PLANTING_ADVICE,
  hasat_tavsiyesi: PLANTING_ADVICE,
  sera_tavsiyesi:  GREENHOUSE_POST,
  mevsimsel:       SEASONAL_POST,

  // Uyarı
  hastalik_uyari:  PEST_WARNING,
  zararli_uyari:   PEST_WARNING,
  don_uyari:       PEST_WARNING,

  // Etkileşim
  soru:            ENGAGEMENT_POST,
  anket:           ENGAGEMENT_POST,
  tartisma:        ENGAGEMENT_POST,
  paylasim:        ENGAGEMENT_POST,

  // Günlük
  gunaydin:        GOOD_MORNING,
  motivasyon:      GOOD_MORNING,
  bilgi_karti:     INFO_CARD,

  // Hikaye
  basari_hikayesi: SUCCESS_STORY,

  // Özel
  ozel_gun:        SPECIAL_DAY,
  bayram:          SPECIAL_DAY,
};
