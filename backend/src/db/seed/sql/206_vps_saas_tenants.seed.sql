-- Tenant-specific hashtag groups for VPS SaaS tenants
-- Runs after ensureSaasTenantColumns() so tenant_key column is guaranteed to exist

INSERT INTO hashtag_groups (tenant_key, name, hashtags, post_type, is_default)
VALUES
  -- ─── GeoSerra ──────────────────────────────────────────────
  ('geoserra', 'GeoSerra Genel', '#geoserra #sera #tarim #serauretimi #agritech', 'genel', 1),
  ('geoserra', 'GeoSerra Tanitim', '#seraurun #tazeurun #organiktarim #doganinsefasi', 'tanitim', 0),
  ('geoserra', 'GeoSerra Haber', '#tarimhaberleri #agrinews #serateknolojisi', 'haber', 0),
  -- ─── Guezel Web Design ─────────────────────────────────────
  ('guezelwebdesign', 'GWD Genel', '#webdesign #webdevelopment #nextjs #typescript #uxdesign', 'genel', 1),
  ('guezelwebdesign', 'GWD Hizmetler', '#dijitalajans #websitesi #mobiluygulama #seo #yazilim', 'tanitim', 0),
  ('guezelwebdesign', 'GWD Portfolyo', '#portfolyo #projeler #tasarim #frontend #backend', 'etkilesim', 0),
  -- ─── GZL Temizlik ──────────────────────────────────────────
  ('gzltemizlik', 'GZL Genel', '#temizlik #profesyoneltemizlik #hijyen #istanbul', 'genel', 1),
  ('gzltemizlik', 'GZL Ev Temizligi', '#evtemizligi #derintemizlik #temizlikhizmeti #evtanrisi', 'tanitim', 0),
  ('gzltemizlik', 'GZL Ofis Temizligi', '#ofistemizligi #kurumseltemizlik #saglikliortam', 'haber', 0),
  -- ─── Kamanilan ─────────────────────────────────────────────
  ('kamanilan', 'Kamanilan Genel', '#kamanilan #alisveris #kampanya #indirim #online', 'genel', 1),
  ('kamanilan', 'Kamanilan Kampanya', '#ureticiden #tazeurun #kaliteliurun #hesapli', 'kampanya', 0),
  ('kamanilan', 'Kamanilan Etkilesim', '#yorumyap #paylasim #musteri #begenildi', 'etkilesim', 0)
ON DUPLICATE KEY UPDATE
  hashtags = VALUES(hashtags),
  post_type = VALUES(post_type),
  is_default = VALUES(is_default);
