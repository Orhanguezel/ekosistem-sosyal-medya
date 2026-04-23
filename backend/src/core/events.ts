type PublishEventPayload = {
  tenantKey: string;
  postId: number;
  status: "success" | "failed";
  errors?: string[];
};

const webhookUrl = process.env.SOCIAL_WEBHOOK_URL || "";

export async function emitPublishEvent(payload: PublishEventPayload) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "social.post.publish",
        payload,
      }),
    });
  } catch {
    // intentionally no-throw: webhook failures must not break publish flow
  }
}
