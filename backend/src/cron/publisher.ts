import * as postRepo from "../modules/posts/repository";
import * as publisher from "../modules/platforms/publisher";
import * as telegram from "../modules/platforms/telegram";

export async function publishScheduledPosts() {
  const duePosts = await postRepo.getPostsDueForPublishing();

  if (duePosts.length === 0) return;

  console.log(`[publisher] ${duePosts.length} post yayinlanacak`);

  for (const post of duePosts) {
    try {
      const result = await publisher.publishPost(post.id);
      console.log(
        `[publisher] Post #${post.id} ${result.success ? "basarili" : "basarisiz"}`,
        result.errors.length > 0 ? result.errors : ""
      );
    } catch (err) {
      console.error(`[publisher] Post #${post.id} hata:`, err);
      await postRepo.markPostAsFailed(post.id, (err as Error).message);
      await telegram.notifyPostPublished(
        post.platform,
        post.title || "Baslıksiz",
        "failed",
        (err as Error).message
      );
    }
  }
}
