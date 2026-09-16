import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

export class MetaIntegrationService {
  /**
   * Publish a text/image post to a Facebook Page
   */
  static async publishToFacebookPage(pageId: string, accessToken: string, message: string, link?: string) {
    try {
      const url = new URL(`${META_GRAPH_URL}/${pageId}/feed`);
      url.searchParams.append("message", message);
      url.searchParams.append("access_token", accessToken);
      if (link) {
        url.searchParams.append("link", link);
      }

      const response = await fetch(url.toString(), { method: "POST" });
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (error) {
      console.error("Facebook Publish Error:", error);
      throw error;
    }
  }

  /**
   * Publish a Reel to Instagram Business Account
   * This is a multi-step process: 
   * 1. Create Container
   * 2. Poll Status (simulated here for async job)
   * 3. Publish Container
   */
  static async publishInstagramReel(
    igUserId: string, 
    accessToken: string, 
    videoUrl: string, 
    caption: string, 
    shareToFeed: boolean = true
  ) {
    try {
      // Step 1: Create the media container
      const createUrl = new URL(`${META_GRAPH_URL}/${igUserId}/media`);
      createUrl.searchParams.append("media_type", "REELS");
      createUrl.searchParams.append("video_url", videoUrl);
      createUrl.searchParams.append("caption", caption);
      createUrl.searchParams.append("share_to_feed", shareToFeed.toString());
      createUrl.searchParams.append("access_token", accessToken);

      const createRes = await fetch(createUrl.toString(), { method: "POST" });
      const createData = await createRes.json();

      if (createData.error) throw new Error(createData.error.message);
      
      const creationId = createData.id;

      // In a real Postiz-like architecture, we would queue a BullMQ job here.
      // For this implementation, we will simulate the polling (Note: in production, 
      // Vercel/Cloud Run functions might timeout, so background workers are essential).
      
      return {
        success: true,
        status: "PROCESSING",
        creationId,
        message: "Container created successfully. Awaiting video processing."
      };
    } catch (error) {
      console.error("Instagram Reel Error:", error);
      throw error;
    }
  }

  /**
   * Step 3 of IG Publishing: Actually publish the finished container
   */
  static async finalizeInstagramReel(igUserId: string, creationId: string, accessToken: string) {
    const publishUrl = new URL(`${META_GRAPH_URL}/${igUserId}/media_publish`);
    publishUrl.searchParams.append("creation_id", creationId);
    publishUrl.searchParams.append("access_token", accessToken);

    const response = await fetch(publishUrl.toString(), { method: "POST" });
    return response.json();
  }
}
