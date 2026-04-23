-- Proje yoneticisi rollerini ata
INSERT INTO tenant_user_roles (id, user_id, tenant_key, role)
SELECT UUID(), u.id, p.project_key, 'tenant_admin'
FROM users u, social_projects p
WHERE u.email = 'orhanguzell@gmail.com'
  AND p.project_key IN ('geoserra', 'guezelwebdesign', 'gzltemizlik', 'kamanilan')
ON DUPLICATE KEY UPDATE role = VALUES(role);
