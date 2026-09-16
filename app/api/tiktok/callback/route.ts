import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    // Return with error flag
    return NextResponse.redirect(new URL("/?tiktok_error=true", baseUrl));
  }

  // In a real application, you would exchange the 'code' for an access token here:
  /*
  const response = await fetch(`https://open.tiktokapis.com/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    })
  });
  const data = await response.json();
  const accessToken = data.access_token;
  
  // Save accessToken to Prisma DB
  await prisma.socialAccount.create({ ... })
  */

  // Redirect back to the dashboard indicating success
  return NextResponse.redirect(new URL("/?tiktok_connected=true", baseUrl));
}
