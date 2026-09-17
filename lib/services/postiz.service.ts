export interface PostizChannel {
  id: string;
  name: string;
  identifier: string;
  providerIdentifier: string; // 'facebook', 'instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'pinterest', 'threads', 'reddit'
  picture?: string;
  disabled?: boolean;
}

export interface PostizPostContent {
  content: string;
  media?: Array<{
    id?: string;
    url: string;
    path?: string;
  }>;
}

export interface PostizScheduleParams {
  content: string;
  mediaUrls?: string[];
  integrationIds: string[];
  scheduledAt?: string | Date; // ISO string or Date, or undefined for immediate publish
  title?: string;
  settings?: Record<string, unknown>;
}

export interface PostizScheduleResult {
  success: boolean;
  postId?: string;
  scheduledAt?: string;
  message: string;
  raw?: unknown;
}

export class PostizIntegrationService {
  private static getApiUrl(customUrl?: string): string {
    const base = customUrl || process.env.POSTIZ_API_URL || "http://localhost:5000";
    return base.replace(/\/$/, "");
  }

  private static getApiKey(customKey?: string): string | undefined {
    return customKey || process.env.POSTIZ_API_KEY || undefined;
  }

  /**
   * Checks if Postiz environment credentials are configured
   */
  static isConfigured(customUrl?: string, customKey?: string): boolean {
    const url = this.getApiUrl(customUrl);
    const key = this.getApiKey(customKey);
    return Boolean(url && key);
  }

  /**
   * Health-checks the Postiz Docker service / remote instance
   */
  static async checkHealth(customUrl?: string, customKey?: string): Promise<{ ok: boolean; message: string; version?: string }> {
    const baseUrl = this.getApiUrl(customUrl);
    const apiKey = this.getApiKey(customKey);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Attempt to hit the public status or integrations endpoint
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        headers,
        signal: controller.signal,
      }).catch(async () => {
        // Fallback check if /api/health is not available, check root or integrations
        return await fetch(`${baseUrl}/api/public/v1/integrations`, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      if (response && response.status < 500) {
        return {
          ok: true,
          message: "Postiz service is online and responding",
          version: "v2.22.2 (Hardened)",
        };
      }

      return {
        ok: false,
        message: `Postiz service responded with HTTP status ${response?.status || "offline"}`,
      };
    } catch (error: any) {
      const isAbort = error.name === "AbortError";
      return {
        ok: false,
        message: isAbort
          ? "Connection timed out. Verify Docker container is running."
          : `Cannot connect to Postiz at ${baseUrl}: ${error.message || "Offline"}`,
      };
    }
  }

  /**
   * Fetch connected social channels (Facebook, Instagram, TikTok, LinkedIn, X, YouTube, etc.)
   */
  static async getConnectedChannels(customUrl?: string, customKey?: string): Promise<PostizChannel[]> {
    const baseUrl = this.getApiUrl(customUrl);
    const apiKey = this.getApiKey(customKey);

    if (!apiKey) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(`${baseUrl}/api/public/v1/integrations`, {
        method: "GET",
        headers: {
          "Authorization": apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Postiz getConnectedChannels returned HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      const integrations = Array.isArray(data) ? data : data?.integrations || [];

      return integrations.map((item: any) => ({
        id: item.id || item._id,
        name: item.name || item.username || item.identifier || "Social Account",
        identifier: item.identifier || item.id,
        providerIdentifier: (item.providerIdentifier || item.provider || "generic").toLowerCase(),
        picture: item.picture || item.avatar || undefined,
        disabled: item.disabled || false,
      }));
    } catch (error: any) {
      console.error("Failed to query Postiz channels:", error.message);
      return [];
    }
  }

  /**
   * Schedule or immediately publish a post across multiple social channels via Postiz
   */
  static async schedulePost(
    params: PostizScheduleParams,
    customUrl?: string,
    customKey?: string
  ): Promise<PostizScheduleResult> {
    const baseUrl = this.getApiUrl(customUrl);
    const apiKey = this.getApiKey(customKey);

    if (!apiKey) {
      throw new Error("Postiz API Key is not configured. Please check Integrations settings.");
    }

    if (!params.integrationIds || params.integrationIds.length === 0) {
      throw new Error("No target social media channels selected for Postiz publication.");
    }

    const scheduledDate = params.scheduledAt
      ? (typeof params.scheduledAt === "string" ? params.scheduledAt : params.scheduledAt.toISOString())
      : undefined;

    const payload = {
      type: "post",
      scheduleDate: scheduledDate,
      integrations: params.integrationIds,
      posts: params.integrationIds.map((integrationId) => ({
        integration: { id: integrationId },
        value: [{
          content: params.content,
          image: params.mediaUrls && params.mediaUrls.length > 0 ? params.mediaUrls.map((url) => ({ path: url })) : [],
        }],
      })),
    };

    try {
      const response = await fetch(`${baseUrl}/api/public/v1/posts`, {
        method: "POST",
        headers: {
          "Authorization": apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData?.message || responseData?.error || `Postiz rejected request with status ${response.status}`);
      }

      return {
        success: true,
        postId: responseData.id || responseData.postId || "scheduled",
        scheduledAt: scheduledDate,
        message: scheduledDate
          ? `Post successfully queued in Postiz Temporal Engine for ${scheduledDate}`
          : "Post published immediately via Postiz Orchestrator",
        raw: responseData,
      };
    } catch (error: any) {
      console.error("Postiz schedule error:", error);
      throw error;
    }
  }
}
