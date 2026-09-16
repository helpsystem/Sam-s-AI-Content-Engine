import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebase-admin";

async function getUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required");
  return getAdminAuth().verifyIdToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    const snapshot = await getAdminDb().collection("social_accounts").where("userId", "==", user.uid).get();
    return NextResponse.json({ accounts: snapshot.docs.map((item) => {
      const data = item.data();
      return { platform: data.platform, accountName: data.accountName || null, metadata: data.metadata || null, connectedAt: data.connectedAt || null };
    }) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not load integrations" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    const platform = request.nextUrl.searchParams.get("platform");
    if (!platform || !["meta", "tiktok"].includes(platform)) return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    await getAdminDb().collection("social_accounts").doc(`${user.uid}_${platform}`).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not disconnect integration" }, { status: 401 });
  }
}
