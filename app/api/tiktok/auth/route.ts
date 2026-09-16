import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getAdminAuth } from "../../../../lib/firebase-admin";
import { createOAuthState } from "../../../../lib/oauth-state";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const user = await getAdminAuth().verifyIdToken(token);
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${request.nextUrl.origin}/api/tiktok/callback`;
    if (!clientKey || !process.env.TIKTOK_CLIENT_SECRET) return NextResponse.json({ error: "TikTok OAuth is not configured" }, { status: 503 });
    const state = createOAuthState(user.uid);
    const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key", clientKey);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "user.info.basic,video.publish");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set("tiktok_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to start TikTok OAuth" }, { status: 500 });
  }
}
