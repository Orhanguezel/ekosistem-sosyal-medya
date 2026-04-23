-- Storage assets seed for brand files
INSERT INTO storage_assets (
  id,
  name,
  bucket,
  path,
  folder,
  mime,
  size,
  provider,
  url,
  created_at,
  updated_at
) VALUES
  ('sa000000-0000-4000-8000-000000000001', 'ekosistem-sosyal-logo.svg', 'uploads', 'brand/ekosistem-sosyal-logo.svg', 'brand', 'image/svg+xml', 1017, 'local', '/uploads/brand/ekosistem-sosyal-logo.svg', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000002', 'ekosistem-sosyal-favicon.svg', 'uploads', 'brand/ekosistem-sosyal-favicon.svg', 'brand', 'image/svg+xml', 738, 'local', '/uploads/brand/ekosistem-sosyal-favicon.svg', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000003', 'ekosistem-sosyal-favicon.ico', 'uploads', 'brand/ekosistem-sosyal-favicon.ico', 'brand', 'image/x-icon', 5255, 'local', '/uploads/brand/ekosistem-sosyal-favicon.ico', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000004', 'ekosistem-sosyal-apple-touch-icon.png', 'uploads', 'brand/ekosistem-sosyal-apple-touch-icon.png', 'brand', 'image/png', 16792, 'local', '/uploads/brand/ekosistem-sosyal-apple-touch-icon.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000005', 'ekosistem-sosyal-favicon-16.png', 'uploads', 'brand/ekosistem-sosyal-favicon-16.png', 'brand', 'image/png', 409, 'local', '/uploads/brand/ekosistem-sosyal-favicon-16.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000006', 'ekosistem-sosyal-favicon-32.png', 'uploads', 'brand/ekosistem-sosyal-favicon-32.png', 'brand', 'image/png', 719, 'local', '/uploads/brand/ekosistem-sosyal-favicon-32.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000007', 'ekosistem-sosyal-favicon-48.png', 'uploads', 'brand/ekosistem-sosyal-favicon-48.png', 'brand', 'image/png', 1010, 'local', '/uploads/brand/ekosistem-sosyal-favicon-48.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000008', 'ekosistem-sosyal-favicon-64.png', 'uploads', 'brand/ekosistem-sosyal-favicon-64.png', 'brand', 'image/png', 1436, 'local', '/uploads/brand/ekosistem-sosyal-favicon-64.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000009', 'ekosistem-sosyal-icon-192.png', 'uploads', 'brand/ekosistem-sosyal-icon-192.png', 'brand', 'image/png', 18298, 'local', '/uploads/brand/ekosistem-sosyal-icon-192.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000010', 'ekosistem-sosyal-icon-512.png', 'uploads', 'brand/ekosistem-sosyal-icon-512.png', 'brand', 'image/png', 66754, 'local', '/uploads/brand/ekosistem-sosyal-icon-512.png', NOW(3), NOW(3)),
  ('sa000000-0000-4000-8000-000000000011', 'ekosistem-sosyal-icon-512-maskable.png', 'uploads', 'brand/ekosistem-sosyal-icon-512-maskable.png', 'brand', 'image/png', 62432, 'local', '/uploads/brand/ekosistem-sosyal-icon-512-maskable.png', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  bucket = VALUES(bucket),
  path = VALUES(path),
  folder = VALUES(folder),
  mime = VALUES(mime),
  size = VALUES(size),
  provider = VALUES(provider),
  url = VALUES(url),
  updated_at = NOW(3);

INSERT INTO site_settings (
  id,
  `key`,
  locale,
  value,
  created_at,
  updated_at
) VALUES
  ('ss000000-0000-4000-8000-000000000001', 'site_title', 'tr', 'Ekosistem Sosyal', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000002', 'site_description', 'tr', 'Coklu tenant sosyal medya yonetim paneli', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000003', 'global_logo_asset_id', 'tr', 'sa000000-0000-4000-8000-000000000001', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000004', 'global_logo_url', 'tr', '/uploads/brand/ekosistem-sosyal-logo.svg', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000005', 'global_favicon_asset_id', 'tr', 'sa000000-0000-4000-8000-000000000002', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000006', 'global_favicon_url', 'tr', '/uploads/brand/ekosistem-sosyal-favicon.svg', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000007', 'global_favicon_ico_asset_id', 'tr', 'sa000000-0000-4000-8000-000000000003', NOW(3), NOW(3)),
  ('ss000000-0000-4000-8000-000000000008', 'global_favicon_ico_url', 'tr', '/uploads/brand/ekosistem-sosyal-favicon.ico', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  value = VALUES(value),
  updated_at = NOW(3);
