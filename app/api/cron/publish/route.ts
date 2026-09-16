import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebase-admin";
import { MetaIntegrationService } from "../../../../lib/services/meta.service";
import { TikTokIntegrationService } from "../../../../lib/services/tiktok.service";

export const dynamic = "force-dynamic";

function getText(content: unknown, keys: string[]) {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";
  const value = content as Record<string, unknown>;
  for (const key of keys) if (typeof value[key] === "string") return value[key] as string;
  return "";
}

function getMediaUrl(post: Record<string, any>) {
  return post.mediaUrl || post.videoUrl || post.media?.url || post.content?.videoUrl || post.content?.mediaUrl || "";
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || request.headers.get("authorization") !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("posts").where("status", "==", "scheduled").where("scheduledTime", "<=", new Date()).get();
    const publishedIds: string[] = [];
    const failedIds: string[] = [];

    for (const postDoc of snapshot.docs) {
      const post = postDoc.data() as Record<string, any>;
      const postRef = db.collection("posts").doc(postDoc.id);
      try {
        const accountKey = post.platform === "instagram" ? "meta" : post.platform;
        const accountDoc = await db.collection("social_accounts").doc(`${post.userId}_${accountKey}`).get();
        const account = accountDoc.data() as Record<string, any> | undefined;
        if (!account?.accessToken) throw new Error(`No connected ${post.platform} account`);

        const content = post.content;
        if (post.platform === "facebook") {
          await MetaIntegrationService.publishToFacebookPage(account.metadata?.pageId || account.providerId, account.accessToken, getText(content, ["parent_targeted_copy", "caption", "text"]), getText(content, ["call_to_action_url", "link"]));
        } else if (post.platform === "instagram") {
          const videoUrl = getMediaUrl(post);
          if (!videoUrl) throw new Error("Instagram requires a public HTTPS video URL");
          const instagramId = account.metadata?.instagramBusinessId;
          if (!instagramId) throw new Error("No Instagram Business account is linked to this Meta account");
          const result = await MetaIntegrationService.publishInstagramReel(instagramId, account.accessToken, videoUrl, getText(content, ["caption", "parent_targeted_copy"]), post.shareToFeed !== false);
          await MetaIntegrationService.waitForInstagramContainer(instagramId, result.creationId, account.accessToken);
          await MetaIntegrationService.finalizeInstagramReel(instagramId, result.creationId, account.accessToken);
        } else if (post.platform === "tiktok") {
          const videoUrl = getMediaUrl(post);
          if (!videoUrl) throw new Error("TikTok requires a public HTTPS video URL");
          await TikTokIntegrationService.directPostVideo(account.accessToken, videoUrl, getText(content, ["caption", "hook_first_3_seconds"]), post.privacyLevel || "SELF_ONLY", Boolean(post.isBrandOrganic), Boolean(post.isAIGC));
        } else {
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        await postRef.update({ status: "published", publishedAt: new Date(), error: null });
        publishedIds.push(postDoc.id);
      } catch (error: any) {
        await postRef.update({ status: "failed", error: error.message || "Publishing failed", failedAt: new Date() });
        failedIds.push(postDoc.id);
      }
    }

    return NextResponse.json({ success: true, publishedIds, failedIds });
  } catch (error: any) {
    console.error("Cron processing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process scheduled posts" }, { status: 500 });
  }
}
