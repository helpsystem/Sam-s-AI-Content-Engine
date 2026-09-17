import { NextRequest, NextResponse } from "next/server";
import { PostizIntegrationService } from "@/lib/services/postiz.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get("url") || undefined;
    const customKey = searchParams.get("apiKey") || undefined;

    const isConfigured = PostizIntegrationService.isConfigured(customUrl, customKey);
    const health = await PostizIntegrationService.checkHealth(customUrl, customKey);

    let channels: any[] = [];
    if (health.ok) {
      channels = await PostizIntegrationService.getConnectedChannels(customUrl, customKey);
    }

    return NextResponse.json({
      configured: isConfigured,
      online: health.ok,
      message: health.message,
      version: health.version,
      channelsCount: channels.length,
      channels,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        configured: false,
        online: false,
        message: error.message || "Failed to inspect Postiz status",
        channels: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, apiKey } = body;

    const health = await PostizIntegrationService.checkHealth(url, apiKey);
    let channels: any[] = [];

    if (health.ok && apiKey) {
      channels = await PostizIntegrationService.getConnectedChannels(url, apiKey);
    }

    return NextResponse.json({
      success: health.ok,
      message: health.message,
      channels,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Postiz connection test failed", channels: [] },
      { status: 200 }
    );
  }
}
