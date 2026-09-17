import { PostizIntegrationService } from "./postiz.service";
import { MetaIntegrationService } from "./meta.service";
import { TikTokIntegrationService } from "./tiktok.service";

export interface PublishRequest {
  platforms: string[]; // e.g., ["facebook", "instagram", "tiktok", "linkedin", "x"]
  content: string;
  title?: string;
  mediaUrls?: string[];
  scheduledAt?: Date | string;
  preferEngine?: "POSTIZ" | "DIRECT" | "AUTO";
  // Direct credentials if falling back:
  directAccounts?: {
    meta?: { accessToken: string; pageId?: string; instagramBusinessId?: string };
    tiktok?: { accessToken: string; privacyLevel?: "PUBLIC" | "MUTUAL_FOLLOW" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY"; isBrandOrganic?: boolean; isAIGC?: boolean };
  };
  postizIntegrationIds?: string[];
}

export interface PublishResponse {
  success: boolean;
  engineUsed: "POSTIZ" | "DIRECT";
  results: Record<string, { success: boolean; id?: string; message?: string; error?: string }>;
}

export class SocialPublisherService {
  /**
   * Publishes or schedules content across platforms using the best available engine
   */
  static async publishOrSchedule(request: PublishRequest): Promise<PublishResponse> {
    const postizConfigured = PostizIntegrationService.isConfigured();
    const usePostiz = request.preferEngine === "POSTIZ" || 
      (request.preferEngine !== "DIRECT" && postizConfigured && (request.postizIntegrationIds?.length || 0) > 0);

    // -------------------------------------------------------------------------
    // Strategy A: Postiz Orchestrator Engine (Resilient, Multi-Network)
    // -------------------------------------------------------------------------
    if (usePostiz) {
      try {
        const postizResult = await PostizIntegrationService.schedulePost({
          content: request.content,
          mediaUrls: request.mediaUrls,
          integrationIds: request.postizIntegrationIds || [],
          scheduledAt: request.scheduledAt,
          title: request.title,
        });

        const results: Record<string, any> = {};
        for (const platform of request.platforms) {
          results[platform] = {
            success: true,
            id: postizResult.postId,
            message: postizResult.message,
          };
        }

        return {
          success: true,
          engineUsed: "POSTIZ",
          results,
        };
      } catch (postizError: any) {
        console.warn("Postiz publishing failed or returned error. Checking fallback:", postizError.message);
        // If user specifically demanded Postiz, rethrow
        if (request.preferEngine === "POSTIZ") {
          throw postizError;
        }
        // Otherwise continue to Strategy B (Direct Fallback)
      }
    }

    // -------------------------------------------------------------------------
    // Strategy B: Direct Platform Services (Fallback for Meta & TikTok)
    // -------------------------------------------------------------------------
    const results: Record<string, any> = {};
    let atLeastOneSucceeded = false;

    for (const platform of request.platforms) {
      const lowerPlatform = platform.toLowerCase();

      try {
        if (lowerPlatform === "facebook") {
          const metaConfig = request.directAccounts?.meta;
          if (!metaConfig?.accessToken || !metaConfig?.pageId) {
            throw new Error("Missing Meta Page ID or Access Token for direct Facebook publish");
          }
          const res = await MetaIntegrationService.publishToFacebookPage(
            metaConfig.pageId,
            metaConfig.accessToken,
            request.content,
            request.mediaUrls?.[0]
          );
          results[platform] = { success: true, id: res.id, message: "Published to Facebook Page" };
          atLeastOneSucceeded = true;
        } else if (lowerPlatform === "instagram") {
          const metaConfig = request.directAccounts?.meta;
          if (!metaConfig?.accessToken || !metaConfig?.instagramBusinessId) {
            throw new Error("Missing Instagram Business ID or Access Token");
          }
          const videoUrl = request.mediaUrls?.[0];
          if (!videoUrl) throw new Error("Instagram Reels require an HTTPS video URL");

          const container = await MetaIntegrationService.publishInstagramReel(
            metaConfig.instagramBusinessId,
            metaConfig.accessToken,
            videoUrl,
            request.content
          );

          if (container.creationId) {
            await MetaIntegrationService.waitForInstagramContainer(
              metaConfig.instagramBusinessId,
              container.creationId,
              metaConfig.accessToken
            );
            const publishRes = await MetaIntegrationService.finalizeInstagramReel(
              metaConfig.instagramBusinessId,
              container.creationId,
              metaConfig.accessToken
            );
            results[platform] = { success: true, id: publishRes.id, message: "Published to Instagram Reels" };
            atLeastOneSucceeded = true;
          }
        } else if (lowerPlatform === "tiktok") {
          const tiktokConfig = request.directAccounts?.tiktok;
          if (!tiktokConfig?.accessToken) {
            throw new Error("Missing TikTok Access Token");
          }
          const videoUrl = request.mediaUrls?.[0];
          if (!videoUrl) throw new Error("TikTok requires an HTTPS video URL");

          const res = await TikTokIntegrationService.directPostVideo(
            tiktokConfig.accessToken,
            videoUrl,
            request.content,
            tiktokConfig.privacyLevel || "SELF_ONLY",
            Boolean(tiktokConfig.isBrandOrganic),
            Boolean(tiktokConfig.isAIGC)
          );
          results[platform] = { success: true, id: res.publishId, message: "Direct Post initiated on TikTok" };
          atLeastOneSucceeded = true;
        } else {
          results[platform] = {
            success: false,
            error: `Direct publisher does not support platform '${platform}'. Please connect Postiz to publish to ${platform}.`,
          };
        }
      } catch (directError: any) {
        results[platform] = {
          success: false,
          error: directError.message || "Failed to publish",
        };
      }
    }

    return {
      success: atLeastOneSucceeded,
      engineUsed: "DIRECT",
      results,
    };
  }
}
