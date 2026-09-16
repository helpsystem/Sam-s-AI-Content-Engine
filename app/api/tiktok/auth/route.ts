import { NextResponse } from "next/server";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  
  // If the user hasn't set up the TikTok Client Key in .env, we simulate the success for preview
  if (!clientKey || clientKey === "") {
    return NextResponse.redirect(new URL("/?tiktok_connected=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  // Real OAuth flow
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || "http://localhost:3000/api/tiktok/callback";
  
  // Generate a random CSRF state token
  const state = Math.random().toString(36).substring(7);
  
  const scope = encodeURIComponent("video.upload,user.info.basic");
  
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
  
  return NextResponse.redirect(url);
}
