INSERT INTO platform_accounts
  (uuid, platform, tenant_key, account_name, account_id, is_active)
VALUES
  -- ─── GeoSerra ──────────────────────────────────────────────
  (UUID(), 'facebook', 'geoserra', 'GeoSerra Facebook', 'geoserra-page', 0),
  (UUID(), 'instagram', 'geoserra', 'GeoSerra Instagram', 'geoserra-ig', 0),
  (UUID(), 'linkedin', 'geoserra', 'GeoSerra LinkedIn', 'urn:li:organization:geoserra', 0),
  (UUID(), 'x', 'geoserra', 'GeoSerra X', 'geoserra-x', 0),
  -- ─── Guezel Web Design ─────────────────────────────────────
  (UUID(), 'facebook', 'guezelwebdesign', 'Guezel Web Design FB', 'gwd-page', 0),
  (UUID(), 'instagram', 'guezelwebdesign', 'Guezel Web Design IG', 'gwd-ig', 0),
  (UUID(), 'linkedin', 'guezelwebdesign', 'Guezel Web Design LI', 'urn:li:organization:gwd', 0),
  (UUID(), 'x', 'guezelwebdesign', 'Guezel Web Design X', 'gwd-x', 0),
  -- ─── GZL Temizlik ──────────────────────────────────────────
  (UUID(), 'facebook', 'gzltemizlik', 'GZL Temizlik FB', 'gzltemizlik-page', 0),
  (UUID(), 'instagram', 'gzltemizlik', 'GZL Temizlik IG', 'gzltemizlik-ig', 0),
  -- ─── Kamanilan ─────────────────────────────────────────────
  (UUID(), 'facebook', 'kamanilan', 'Kamanilan FB', 'kamanilan-page', 0),
  (UUID(), 'instagram', 'kamanilan', 'Kamanilan IG', 'kamanilan-ig', 0)
ON DUPLICATE KEY UPDATE
  tenant_key = VALUES(tenant_key),
  platform = VALUES(platform),
  account_name = VALUES(account_name),
  account_id = VALUES(account_id),
  is_active = VALUES(is_active),
  updated_at = NOW(3);
