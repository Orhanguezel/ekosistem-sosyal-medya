import fs from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import { db, pool } from "./client";
import { userRoles, users } from "./schema";
import { ensurePostCommentsTable } from "./ensure";
import { v4 as uuidv4 } from "uuid";
import argon2 from "argon2";
import { eq } from "drizzle-orm";

function cleanSql(sqlText: string): string {
  return sqlText
    .replace(/\r\n/g, "\n")
    .replace(/^\uFEFF/, "");
}

function splitStatements(sqlText: string): string[] {
  return sqlText
    .split(/;\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

async function runSqlSeedFile(fileName: string) {
  const filePath = path.join(process.cwd(), "src", "db", "seed", "sql", fileName);
  const sqlText = cleanSql(await fs.readFile(filePath, "utf8"));
  const statements = splitStatements(sqlText);
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`SQL seed calisti: ${fileName}`);
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<Array<RowDataPacket & { cnt: number }>>(
    `
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );
  return rows[0]?.cnt > 0;
}

async function ensureGoogleAdsChangeSetsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`google_ads_change_sets\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`uuid\` char(36) NOT NULL,
      \`tenant_key\` varchar(100) NOT NULL,
      \`customer_id\` varchar(64) NOT NULL,
      \`manager_id\` varchar(64),
      \`campaign_id\` varchar(64),
      \`campaign_name\` varchar(255),
      \`title\` varchar(255) NOT NULL,
      \`status\` enum('draft','validated','validation_failed','applied','failed','cancelled') NOT NULL DEFAULT 'draft',
      \`source\` varchar(50) NOT NULL DEFAULT 'manual',
      \`payload\` json NOT NULL,
      \`validation_result\` json,
      \`applied_result\` json,
      \`created_by\` varchar(100) DEFAULT 'system',
      \`created_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY(\`id\`),
      UNIQUE KEY \`google_ads_change_sets_uuid_unique\` (\`uuid\`)
    )
  `);
  try {
    await pool.query("CREATE INDEX `idx_ads_change_tenant` ON `google_ads_change_sets` (`tenant_key`)");
  } catch {}
  try {
    await pool.query("CREATE INDEX `idx_ads_change_status` ON `google_ads_change_sets` (`status`)");
  } catch {}
  try {
    await pool.query("CREATE INDEX `idx_ads_change_campaign` ON `google_ads_change_sets` (`campaign_id`)");
  } catch {}
}

async function ensureSocialProjectsContentSourceColumns() {
  const hasContentSourceUrl = await columnExists("social_projects", "content_source_url");
  const hasContentSourceType = await columnExists("social_projects", "content_source_type");

  if (!hasContentSourceUrl) {
    await pool.query(
      "ALTER TABLE `social_projects` ADD COLUMN `content_source_url` varchar(500) DEFAULT NULL AFTER `site_settings_api_url`",
    );
    console.log("Schema duzeltildi: social_projects.content_source_url eklendi");
  }

  if (!hasContentSourceType) {
    await pool.query(
      "ALTER TABLE `social_projects` ADD COLUMN `content_source_type` varchar(50) DEFAULT NULL AFTER `content_source_url`",
    );
    console.log("Schema duzeltildi: social_projects.content_source_type eklendi");
  }
}

async function ensureStorageProviderColumns() {
  const columns: Array<[string, string, string]> = [
    ["provider_public_id", "varchar(255) DEFAULT NULL", "provider_id"],
    ["provider_resource_type", "varchar(16) DEFAULT NULL", "provider_public_id"],
    ["provider_format", "varchar(32) DEFAULT NULL", "provider_resource_type"],
    ["provider_version", "int unsigned DEFAULT NULL", "provider_format"],
    ["etag", "varchar(64) DEFAULT NULL", "provider_version"],
    ["metadata", "json DEFAULT NULL", "etag"],
  ];

  for (const [column, definition, after] of columns) {
    if (!(await columnExists("storage_assets", column))) {
      await pool.query(
        `ALTER TABLE \`storage_assets\` ADD COLUMN \`${column}\` ${definition} AFTER \`${after}\``,
      );
      console.log(`Schema duzeltildi: storage_assets.${column} eklendi`);
    }
  }
}

async function ensureSaasTenantColumns() {
  // content_templates.tenant_key
  if (!(await columnExists("content_templates", "tenant_key"))) {
    await pool.query(
      "ALTER TABLE `content_templates` ADD COLUMN `tenant_key` varchar(100) DEFAULT NULL AFTER `uuid`",
    );
    // Mevcut [tenantKey] prefixli isimlerden tenant_key'i cikart
    await pool.query(
      "UPDATE `content_templates` SET `tenant_key` = LOWER(REGEXP_SUBSTR(`name`, '(?<=\\\\[)[a-zA-Z0-9_-]+(?=\\\\])')) WHERE `name` REGEXP '^\\\\[[a-zA-Z0-9_-]+\\\\] '"
    );
    await pool.query(
      "UPDATE `content_templates` SET `name` = TRIM(REGEXP_REPLACE(`name`, '^\\\\[[a-zA-Z0-9_-]+\\\\] ', '')) WHERE `name` REGEXP '^\\\\[[a-zA-Z0-9_-]+\\\\] '"
    );
    console.log("Schema duzeltildi: content_templates.tenant_key eklendi");
  }

  // campaign_calendar.tenant_key + unique constraint guncelle
  if (!(await columnExists("campaign_calendar", "tenant_key"))) {
    await pool.query(
      "ALTER TABLE `campaign_calendar` ADD COLUMN `tenant_key` varchar(100) NOT NULL DEFAULT 'default' AFTER `uuid`",
    );
    // Mevcut kayitlari bereketfide olarak isaretle (baslangic tenant'i)
    await pool.query(
      "UPDATE `campaign_calendar` SET `tenant_key` = 'bereketfide' WHERE `tenant_key` = 'default'"
    );
    // Eski unique constraint'i kaldir ve yenisini ekle
    try {
      await pool.query("ALTER TABLE `campaign_calendar` DROP INDEX `uk_date_slot`");
    } catch { /* yoksa atla */ }
    try {
      await pool.query(
        "CREATE UNIQUE INDEX `uk_tenant_date_slot` ON `campaign_calendar` (`tenant_key`, `date`, `time_slot`, `platform`)"
      );
    } catch { /* zaten varsa atla */ }
    console.log("Schema duzeltildi: campaign_calendar.tenant_key eklendi");
  }

  // hashtag_groups.tenant_key
  if (!(await columnExists("hashtag_groups", "tenant_key"))) {
    await pool.query(
      "ALTER TABLE `hashtag_groups` ADD COLUMN `tenant_key` varchar(100) DEFAULT NULL AFTER `id`",
    );
    console.log("Schema duzeltildi: hashtag_groups.tenant_key eklendi");
  }

  // Platform enum genisletmeleri (linkedin, x, telegram, all)
  const [[platformColSP]] = await pool.query<any[]>(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'social_posts' AND COLUMN_NAME = 'platform'"
  );
  if (platformColSP && !String(platformColSP.COLUMN_TYPE).includes("linkedin")) {
    const newEnum = "enum('facebook','instagram','both','linkedin','x','telegram','all')";
    await pool.query(`ALTER TABLE \`social_posts\` MODIFY COLUMN \`platform\` ${newEnum} NOT NULL DEFAULT 'both'`);
    await pool.query(`ALTER TABLE \`content_templates\` MODIFY COLUMN \`platform\` ${newEnum} NOT NULL DEFAULT 'both'`);
    await pool.query(`ALTER TABLE \`campaign_calendar\` MODIFY COLUMN \`platform\` ${newEnum} NOT NULL DEFAULT 'both'`);
    console.log("Schema duzeltildi: platform enum genisletildi (linkedin, x, telegram, all)");
  }
}

async function ensureAdminUser() {
  const targetAdminEmail = process.env.SEED_ADMIN_EMAIL || "orhanguzell@gmail.com";
  const targetAdminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const targetAdminName = process.env.SEED_ADMIN_NAME || "Orhan Guzel";

  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, targetAdminEmail))
    .limit(1);

  const adminPasswordHash = await argon2.hash(targetAdminPassword);

  if (!existingAdmin) {
    await db.insert(users).values({
      id: uuidv4(),
      email: targetAdminEmail,
      passwordHash: adminPasswordHash,
      fullName: targetAdminName,
      role: "admin",
      isActive: 1,
    });
  } else {
    await db
      .update(users)
      .set({
        passwordHash: adminPasswordHash,
        fullName: targetAdminName,
        role: "admin",
        isActive: 1,
      })
      .where(eq(users.email, targetAdminEmail));
  }

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, targetAdminEmail))
    .limit(1);

  if (!adminUser?.id) return;

  const [adminRole] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(eq(userRoles.userId, adminUser.id))
    .limit(1);

  if (!adminRole) {
    await db.insert(userRoles).values({
      id: uuidv4(),
      userId: adminUser.id,
      role: "admin",
    });
  }

  console.log(`Admin hazir: ${targetAdminEmail}`);
}

async function seed() {
  console.log("Seed basladi...");
  await runSqlSeedFile("200_social_base_hashtags.seed.sql");
  await runSqlSeedFile("202_storage_assets.seed.sql");
  await ensureStorageProviderColumns();
  await ensureSocialProjectsContentSourceColumns();
  await ensureSaasTenantColumns();
  await ensureGoogleAdsChangeSetsTable();
  await ensurePostCommentsTable();
  await runSqlSeedFile("205_social_projects.seed.sql");
  await runSqlSeedFile("206_vps_saas_tenants.seed.sql");
  await runSqlSeedFile("210_example_social_content.seed.sql");
  await runSqlSeedFile("230_tenant_platform_accounts.seed.sql");
  await ensureAdminUser();
  await runSqlSeedFile("240_tenant_user_roles.seed.sql");
  console.log("Seed tamamlandi!");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed hatasi:", err);
  process.exit(1);
});
