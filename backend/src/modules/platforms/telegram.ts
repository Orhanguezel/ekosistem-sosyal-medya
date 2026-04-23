import { env } from "../../core/env";

const TG_API_URL = "https://api.telegram.org";

// ─── Mesaj Gonder ───────────────────────────────────────────
export async function sendMessage(
  text: string,
  chatId?: string
): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || env.TELEGRAM_CHAT_ID;

  if (!token || !targetChatId) {
    console.warn("Telegram yapilandirmasi eksik, bildirim atlanıyor");
    return false;
  }

  try {
    const res = await fetch(`${TG_API_URL}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Telegram hatasi:", data);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Telegram gonderim hatasi:", err);
    return false;
  }
}

// ─── Post Yayinlandi Bildirimi ──────────────────────────────
export async function notifyPostPublished(
  platform: string,
  title: string,
  status: "success" | "failed",
  error?: string
) {
  const emoji = status === "success" ? "✅" : "❌";
  const platformLabel =
    platform === "facebook" ? "Facebook" : platform === "instagram" ? "Instagram" : "FB+IG";

  let text = `${emoji} <b>Post ${status === "success" ? "yayinlandi" : "basarisiz"}</b>\n\n`;
  text += `📱 Platform: ${platformLabel}\n`;
  text += `📝 ${title || "(baslıksiz)"}`;

  if (error) {
    text += `\n\n⚠️ Hata: ${error}`;
  }

  return sendMessage(text);
}

// ─── Gunluk Ozet Bildirimi ──────────────────────────────────
export async function notifyDailySummary(stats: {
  posted: number;
  failed: number;
  scheduled: number;
  totalLikes?: number;
  totalComments?: number;
}) {
  let text = `📊 <b>Gunluk Ozet - Sosyal Medya Paneli</b>\n\n`;
  text += `✅ Yayinlanan: ${stats.posted}\n`;
  text += `❌ Basarisiz: ${stats.failed}\n`;
  text += `⏳ Kuyrukta: ${stats.scheduled}\n`;

  if (stats.totalLikes !== undefined) {
    text += `\n❤️ Toplam begeni: ${stats.totalLikes}`;
  }
  if (stats.totalComments !== undefined) {
    text += `\n💬 Toplam yorum: ${stats.totalComments}`;
  }

  return sendMessage(text);
}

// ─── Token Uyarisi ──────────────────────────────────────────
export async function notifyTokenExpiring(platform: string, expiresIn: string) {
  const text = `⚠️ <b>Token Uyarisi</b>\n\n${platform} token'i ${expiresIn} icinde dolacak.\n\nLutfen yenileyin.`;
  return sendMessage(text);
}
