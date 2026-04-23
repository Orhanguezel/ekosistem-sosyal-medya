-- Varsayılan (Örnek) Sosyal Medya İçerikleri
-- Bu dosya yeni projeler için şablon niteliğindedir.

INSERT INTO content_templates
  (uuid, name, post_type, platform, caption_template, hashtags, variables, is_active)
VALUES
  (
    'tmpl0001-0000-4000-8000-000000000001',
    'Standart Haber Şablonu',
    'haber',
    'both',
    'Günün haberi: {{baslik}}\n\n{{ozet}}\n\nDevamı için: {{link}}',
    '#haber #guncel #ekosistem',
    JSON_ARRAY('baslik', 'ozet', 'link'),
    1
  ),
  (
    'tmpl0001-0000-4000-8000-000000000002',
    'Ürün/Hizmet Tanıtımı',
    'tanitim',
    'both',
    'Yeni Duyuru: {{baslik}}\n\n{{aciklama}}\n\nDetaylı bilgi ve sipariş için profilimizdeki linke tıklayabilirsiniz.',
    '#duyuru #kampanya #tanitim',
    JSON_ARRAY('baslik', 'aciklama'),
    1
  ),
  (
    'tmpl0001-0000-4000-8000-000000000003',
    'Etkileşim Sorusu',
    'etkilesim',
    'both',
    'Sizin bu konudaki fikriniz nedir?\n\n{{soru}}\n\nYorumlarda buluşalım! 👇',
    '#sorucevap #etkilesim #topluluk',
    JSON_ARRAY('soru'),
    1
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  post_type = VALUES(post_type),
  platform = VALUES(platform),
  caption_template = VALUES(caption_template),
  hashtags = VALUES(hashtags),
  variables = VALUES(variables),
  is_active = VALUES(is_active),
  updated_at = NOW(3);

INSERT INTO social_posts
  (uuid, post_type, sub_type, title, caption, hashtags, platform, status, source_type, source_ref, created_by)
VALUES
  (
    'post0001-0000-4000-8000-000000000001',
    'haber',
    'default',
    'Örnek İlk Gönderi',
    'Sosyal medya yönetim panelimize hoş geldiniz! Bu bir örnek gönderidir.',
    '#merhaba #sosyalmedya #yeni',
    'both',
    'draft',
    'manual',
    'seed:example:1',
    'seed'
  )
ON DUPLICATE KEY UPDATE
  post_type = VALUES(post_type),
  sub_type = VALUES(sub_type),
  title = VALUES(title),
  caption = VALUES(caption),
  hashtags = VALUES(hashtags),
  platform = VALUES(platform),
  status = VALUES(status),
  source_type = VALUES(source_type),
  source_ref = VALUES(source_ref),
  updated_at = NOW(3);
