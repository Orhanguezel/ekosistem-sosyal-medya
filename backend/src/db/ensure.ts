import { pool } from "./client";

let postCommentsEnsured = false;

export async function ensurePostCommentsTable() {
  if (postCommentsEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`post_comments\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`uuid\` char(36) NOT NULL,
      \`post_id\` int NOT NULL,
      \`platform\` enum('facebook','instagram') NOT NULL,
      \`external_comment_id\` varchar(255) NOT NULL,
      \`parent_comment_id\` varchar(255) DEFAULT NULL,
      \`author_name\` varchar(255) DEFAULT NULL,
      \`author_id\` varchar(255) DEFAULT NULL,
      \`message\` text NOT NULL,
      \`like_count\` int DEFAULT 0,
      \`created_time\` datetime(3) DEFAULT NULL,
      \`fetched_at\` datetime(3) NOT NULL,
      \`created_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY(\`id\`),
      UNIQUE KEY \`post_comments_uuid_unique\` (\`uuid\`),
      UNIQUE KEY \`uk_post_platform_comment\` (\`post_id\`, \`platform\`, \`external_comment_id\`),
      KEY \`idx_comment_post\` (\`post_id\`),
      KEY \`idx_comment_platform\` (\`platform\`),
      KEY \`idx_comment_created\` (\`created_time\`),
      CONSTRAINT \`post_comments_post_id_social_posts_id_fk\`
        FOREIGN KEY(\`post_id\`) REFERENCES \`social_posts\`(\`id\`) ON DELETE CASCADE
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  postCommentsEnsured = true;
}
