INSERT INTO hashtag_groups (name, hashtags, post_type, is_default)
VALUES
  ('Genel Sosyal', '#sosyalmedya #icerik #dijitalpazarlama #marka', 'genel', 1),
  ('Egitim ve Icerik', '#egitim #ipucu #rehber #topluluk', 'etkilesim', 1),
  ('Kurumsal Iletisim', '#kurumsaliletisim #duyuru #haber #buyume', 'haber', 0)
ON DUPLICATE KEY UPDATE
  hashtags = VALUES(hashtags),
  post_type = VALUES(post_type),
  is_default = VALUES(is_default);
