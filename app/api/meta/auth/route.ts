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
    const clientId = process.env.META_CLIENT_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${request.nextUrl.origin}/api/meta/callback`;
    if (!clientId || !process.env.META_CLIENT_SECRET) return NextResponse.json({ error: "Meta OAuth is not configured" }, { status: 503 });
    const state = createOAuthState(user.uid);
    const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish");
    return NextResponse.json({ url: url.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to start Meta OAuth" }, { status: 500 });
  }
}
