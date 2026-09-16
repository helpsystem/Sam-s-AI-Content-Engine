import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebase-admin";
import { readOAuthState } from "../../../../lib/oauth-state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredBaseUrl && !configuredBaseUrl.includes("localhost") ? configuredBaseUrl : request.nextUrl.origin;
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (request.nextUrl.searchParams.get("error") || !code) throw new Error("Meta authorization was denied");
    const { uid } = readOAuthState(request.nextUrl.searchParams.get("state"));
    const redirectUri = process.env.META_REDIRECT_URI || `${request.nextUrl.origin}/api/meta/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.META_CLIENT_ID || "");
    tokenUrl.searchParams.set("client_secret", process.env.META_CLIENT_SECRET || "");
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) throw new Error(tokenData.error?.message || "Meta token exchange failed");
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(tokenData.access_token)}`);
    const pagesData = await pagesResponse.json();
    if (!pagesResponse.ok || pagesData.error) throw new Error(pagesData.error?.message || "Could not load Meta Pages");
    const page = pagesData.data?.[0];
    if (!page?.id || !page.access_token) throw new Error("No Facebook Page was found for this Meta account");
    await getAdminDb().collection("social_accounts").doc(`${uid}_meta`).set({
      userId: uid, platform: "meta", accessToken: page.access_token, providerId: page.id,
      accountName: page.name || "Facebook Page",
      metadata: { pageId: page.id, instagramBusinessId: page.instagram_business_account?.id || null },
      connectedAt: new Date(), updatedAt: new Date(),
    }, { merge: true });
    return NextResponse.redirect(new URL("/?meta_connected=true", baseUrl));
  } catch (error: any) {
    const url = new URL("/", baseUrl);
    url.searchParams.set("meta_error", error.message || "Meta connection failed");
    return NextResponse.redirect(url);
  }
}