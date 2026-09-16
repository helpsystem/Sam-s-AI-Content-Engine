export class TikTokIntegrationService {
  private static TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

  /**
   * Query TikTok Creator Info for dynamic privacy and disclosure settings
   */
  static async queryCreatorInfo(accessToken: string) {
    try {
      const url = `${this.TIKTOK_API_BASE}/post/publish/creator_info/query/`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      return data;
    } catch (error) {
      console.error("TikTok Creator Info Error:", error);
      throw error;
    }
  }

  /**
   * Direct Post a Video to TikTok
   * Enforces Commercial Content Disclosures and Privacy settings.
   */
  static async directPostVideo(
    accessToken: string,
    videoUrl: string,
    title: string,
    privacyLevel: "PUBLIC" | "MUTUAL_FOLLOW" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY",
    isBrandOrganic: boolean,
    isAIGC: boolean
  ) {
    try {
      const url = `${this.TIKTOK_API_BASE}/post/publish/video/init/`;
      
      const payload = {
        post_info: {
          title: title,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
          brand_organic_toggle: isBrandOrganic,
          brand_content_toggle: false,
          aigc_info: {
            aigc_content_type: isAIGC ? "AIGC_GENERATED" : "NOT_AIGC"
          }
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return {
        success: true,
        publishId: data.data?.publish_id,
        message: "TikTok Direct Post initiated successfully."
      };
    } catch (error) {
      console.error("TikTok Publish Error:", error);
      throw error;
    }
  }
}
