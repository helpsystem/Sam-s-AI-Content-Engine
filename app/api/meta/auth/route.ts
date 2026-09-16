import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.META_CLIENT_ID;
  
  // If the user hasn't set up the Meta Client ID in .env, we simulate the success for preview
  if (!clientId || clientId === "") {
    return NextResponse.redirect(new URL("/?meta_connected=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  // Real OAuth flow
  const redirectUri = process.env.META_REDIRECT_URI || "http://localhost:3000/api/meta/callback";
  
  const scope = encodeURIComponent("pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish");
  
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  return NextResponse.redirect(url);
}
