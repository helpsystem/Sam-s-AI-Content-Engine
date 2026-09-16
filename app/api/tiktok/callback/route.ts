import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebase-admin";
import { readOAuthState } from "../../../../lib/oauth-state";
import { encryptToken } from "../../../../lib/token-crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredBaseUrl && !configuredBaseUrl.includes("localhost") ? configuredBaseUrl : request.nextUrl.origin;
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (request.nextUrl.searchParams.get("error") || !code) throw new Error("TikTok authorization was denied");
    const state = request.nextUrl.searchParams.get("state");
    if (!state || request.cookies.get("tiktok_oauth_state")?.value !== state) throw new Error("TikTok OAuth state mismatch");
    const { uid } = readOAuthState(state);
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${request.nextUrl.origin}/api/tiktok/callback`;
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || "", client_secret: process.env.TIKTOK_CLIENT_SECRET || "", code, grant_type: "authorization_code", redirect_uri: redirectUri }),
    });
    const data = await response.json();
    if (!response.ok || data.error || !data.access_token) throw new Error(data.error_description || data.error?.message || "TikTok token exchange failed");
    const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", { headers: { Authorization: `Bearer ${data.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || profile.error) throw new Error(profile.error?.message || "Could not load TikTok profile");
    const profileUser = profile.data?.user;
    await getAdminDb().collection("social_accounts").doc(`${uid}_tiktok`).set({
      userId: uid, platform: "tiktok", accessToken: encryptToken(data.access_token), refreshToken: data.refresh_token ? encryptToken(data.refresh_token) : null,
      providerId: profileUser?.open_id || "", accountName: profileUser?.display_name || "TikTok account",
      metadata: { avatarUrl: profileUser?.avatar_url || null, expiresIn: data.expires_in || null },
      connectedAt: new Date(), updatedAt: new Date(),
    }, { merge: true });
    const redirectResponse = NextResponse.redirect(new URL("/?tiktok_connected=true", baseUrl));
    redirectResponse.cookies.delete("tiktok_oauth_state");
    return redirectResponse;
  } catch (error: any) {
    const url = new URL("/", baseUrl);
    url.searchParams.set("tiktok_error", error.message || "TikTok connection failed");
    return NextResponse.redirect(url);
  }
}