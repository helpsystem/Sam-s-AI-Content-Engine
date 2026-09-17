import { NextRequest, NextResponse } from "next/server";
import { SocialPublisherService } from "@/lib/services/social-publisher.service";
import { PostizIntegrationService } from "@/lib/services/postiz.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      title,
      platforms = [],
      mediaUrls = [],
      scheduledAt,
      preferEngine = "POSTIZ",
      postizIntegrationIds = [],
    } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: "At least one target platform must be selected" }, { status: 400 });
    }

    // Dispatch to unified social publisher
    const publishResult = await SocialPublisherService.publishOrSchedule({
      content,
      title,
      platforms,
      mediaUrls,
      scheduledAt,
      preferEngine,
      postizIntegrationIds,
    });

    return NextResponse.json({
      success: publishResult.success,
      engine: publishResult.engineUsed,
      results: publishResult.results,
    });
  } catch (error: any) {
    console.error("Publish API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to publish or schedule post",
      },
      { status: 500 }
    );
  }
}
