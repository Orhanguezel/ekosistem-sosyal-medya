-- Tenant kayitlari (social_projects = tenant registry)
-- GTM/GA4/Ads/GSC degerleri panelden girilir; seed'de NULL birakilir.
-- Replit: gizli anahtarlar Replit Secrets'ta; tenant listesi bu repoda kalir (tekrarlanabilir ortam).
-- branding: statik dosyalar backend/uploads/brand/ altinda; /uploads/ prefix static plugin ile servis edilir.

INSERT INTO social_projects (
  uuid,
  project_key,
  name,
  website_url,
  content_source_url,
  content_source_type,
  gtm_container_id,
  ga4_measurement_id,
  ga4_property_id,
  google_ads_customer_id,
  google_ads_manager_id,
  search_console_site_url,
  site_settings_api_url,
  marketing_json,
  is_active
) VALUES
  (
    'sp000001-0000-4000-8000-000000000001',
    'default',
    'Varsayılan Proje',
    'https://example.com',
    'http://localhost:8080/api',
    'generic',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      JSON_OBJECT(
        'branding',
        JSON_OBJECT(
          'appName', 'Sosyal Medya Paneli',
          'appSubtitle', 'Merkezi sosyal medya yönetim sistemi',
          'loginTitle', 'Sosyal Medya Paneli',
          'loginSubtitle', 'Hesabınızla giriş yapın',
          'logoUrl', '/uploads/brand/default-logo.svg',
          'faviconUrl', '/uploads/brand/default-favicon.svg',
          'defaultLinkUrl', 'https://example.com',
          'defaultHashtags', '#sosyalmedya #dijital #ekosistem',
          'sector', 'genel',
          'audience', 'tüm kullanıcılar',
          'contentSourceLabel', 'Dış Kaynak'
        )
      ),
    1
  ),
  -- ─── GeoSerra ──────────────────────────────────────────────
  (
    'sp000002-0000-4000-8000-000000000001',
    'geoserra',
    'GeoSerra',
    'https://geoserra.com',
    'http://localhost:8083/api',
    'geoserra',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    JSON_OBJECT(
      'branding',
      JSON_OBJECT(
        'appName', 'GeoSerra',
        'appSubtitle', 'Sosyal medya yonetim paneli',
        'loginTitle', 'GeoSerra',
        'loginSubtitle', 'GeoSerra sosyal medya yonetimi',
        'defaultLinkUrl', 'https://geoserra.com',
        'defaultHashtags', '#geoserra #sera #tarim #uretim',
        'sector', 'tarim & sera',
        'audience', 'ciftcilere, sera ureticilerine ve agro-teknik profesyonellere',
        'contentSourceLabel', 'GeoSerra'
      )
    ),
    1
  ),
  -- ─── Guezel Web Design ─────────────────────────────────────
  (
    'sp000002-0000-4000-8000-000000000002',
    'guezelwebdesign',
    'Guezel Web Design',
    'https://guezelwebdesign.de',
    'http://localhost:8082/api',
    'wordpress',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    JSON_OBJECT(
      'branding',
      JSON_OBJECT(
        'appName', 'Guezel Web Design',
        'appSubtitle', 'Sosyal medya yonetim paneli',
        'loginTitle', 'Guezel Web Design',
        'loginSubtitle', 'GWD sosyal medya yonetimi',
        'defaultLinkUrl', 'https://guezelwebdesign.de',
        'defaultHashtags', '#webdesign #webdevelopment #nextjs #typescript',
        'sector', 'dijital ajans & web gelistirme',
        'audience', 'kurumsal musterilere ve dijital donusum arayan isletmelere',
        'contentSourceLabel', 'Guezel Web Design'
      )
    ),
    1
  ),
  -- ─── GZL Temizlik ──────────────────────────────────────────
  (
    'sp000002-0000-4000-8000-000000000003',
    'gzltemizlik',
    'GZL Temizlik',
    'https://gzltemizlik.com',
    'http://localhost:8084/api',
    'generic',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    JSON_OBJECT(
      'branding',
      JSON_OBJECT(
        'appName', 'GZL Temizlik',
        'appSubtitle', 'Sosyal medya yonetim paneli',
        'loginTitle', 'GZL Temizlik',
        'loginSubtitle', 'GZL Temizlik sosyal medya yonetimi',
        'defaultLinkUrl', 'https://gzltemizlik.com',
        'defaultHashtags', '#temizlik #profesyoneltemizlik #hijyen #evtemizligi',
        'sector', 'temizlik hizmetleri',
        'audience', 'ev sahiplerine ve ofis yoneticilerine',
        'contentSourceLabel', 'GZL Temizlik'
      )
    ),
    1
  ),
  -- ─── Kamanilan ─────────────────────────────────────────────
  (
    'sp000002-0000-4000-8000-000000000004',
    'kamanilan',
    'Kamanilan',
    'https://kamanilan.com',
    'http://localhost:8085/api',
    'kamanilan',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    JSON_OBJECT(
      'branding',
      JSON_OBJECT(
        'appName', 'Kamanilan',
        'appSubtitle', 'Sosyal medya yonetim paneli',
        'loginTitle', 'Kamanilan',
        'loginSubtitle', 'Kamanilan sosyal medya yonetimi',
        'defaultLinkUrl', 'https://kamanilan.com',
        'defaultHashtags', '#kamanilan #alisveris #kampanya #indirim',
        'sector', 'e-ticaret & pazar yeri',
        'audience', 'alicilara, saticilara ve online alisveris yapan musterilere',
        'contentSourceLabel', 'Kamanilan'
      )
    ),
    1
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  website_url = VALUES(website_url),
  content_source_url = VALUES(content_source_url),
  content_source_type = VALUES(content_source_type),
  gtm_container_id = VALUES(gtm_container_id),
  ga4_measurement_id = VALUES(ga4_measurement_id),
  ga4_property_id = VALUES(ga4_property_id),
  google_ads_customer_id = VALUES(google_ads_customer_id),
  google_ads_manager_id = VALUES(google_ads_manager_id),
  search_console_site_url = VALUES(search_console_site_url),
  site_settings_api_url = VALUES(site_settings_api_url),
  marketing_json = VALUES(marketing_json),
  is_active = VALUES(is_active),
  updated_at = NOW(3);
