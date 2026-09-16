import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    // Return with error flag
    return NextResponse.redirect(new URL("/?meta_error=true", baseUrl));
  }

  // In a real application, you would exchange the 'code' for an access token here:
  /*
  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&client_secret=${process.env.META_CLIENT_SECRET}&code=${code}`);
  const data = await response.json();
  const accessToken = data.access_token;
  
  // Save accessToken to Prisma DB
  await prisma.socialAccount.create({ ... })
  */

  // Redirect back to the dashboard indicating success
  return NextResponse.redirect(new URL("/?meta_connected=true", baseUrl));
}
