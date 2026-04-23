import cron from "node-cron";
import { publishScheduledPosts } from "./publisher";
import { syncSourceNews } from "./content-sync";
import { generateDailyContent } from "./content-gen";
import { collectAnalytics } from "./analytics";
import { checkPlatformTokenHealth } from "./token-health";

export function startCronJobs() {
  console.log("Cron gorevleri baslatiliyor...");

  // Her 5 dakikada: zamanlanmis postlari yayinla
  cron.schedule("*/5 * * * *", async () => {
    console.log("[cron] Zamanlanmis postlar kontrol ediliyor...");
    try {
      await publishScheduledPosts();
    } catch (err) {
      console.error("[cron] Publisher hatasi:", err);
    }
  });

  // Her 30 dakikada: kaynak icerikleri senkronize et
  cron.schedule("*/30 * * * *", async () => {
    console.log("[cron] Kaynak haberleri senkronize ediliyor...");
    try {
      await syncSourceNews();
    } catch (err) {
      console.error("[cron] Sync hatasi:", err);
    }
  });

  // Her gun 08:00 (Europe/Berlin): AI ile gunluk icerik uret
  cron.schedule("0 8 * * *", async () => {
    console.log("[cron] Gunluk AI icerik uretimi basliyor...");
    try {
      await generateDailyContent();
    } catch (err) {
      console.error("[cron] Content-gen hatasi:", err);
    }
  }, { timezone: "Europe/Berlin" });

  // Her 6 saatte: analitik verilerini topla
  cron.schedule("0 */6 * * *", async () => {
    console.log("[cron] Analitik verileri toplanıyor...");
    try {
      await collectAnalytics();
    } catch (err) {
      console.error("[cron] Analytics hatasi:", err);
    }
  });

  // Her gun 03:00: token saglik kontrolu
  cron.schedule("0 3 * * *", async () => {
    try {
      await checkPlatformTokenHealth();
    } catch (err) {
      console.error("[cron] Token health hatasi:", err);
    }
  });

  console.log("Cron gorevleri aktif:");
  console.log("  - Publisher: her 5 dakika");
  console.log("  - Source sync: her 30 dakika");
  console.log("  - AI icerik: gunluk 08:00 (Berlin)");
  console.log("  - Analytics: her 6 saat");
  console.log("  - Token health: gunluk 03:00");
}
