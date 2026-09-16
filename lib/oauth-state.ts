import crypto from "node:crypto";

function getSecret() {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not configured");
  return secret;
}

export function createOAuthState(uid: string) {
  const payload = Buffer.from(JSON.stringify({ uid, nonce: crypto.randomBytes(16).toString("hex"), exp: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readOAuthState(state: string | null) {
  if (!state) throw new Error("Missing OAuth state");
  const [payload, signature] = state.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid OAuth state");
  const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid: string; nonce: string; exp: number };
  if (!result.exp || result.exp < Date.now()) throw new Error("OAuth state expired");
  return result;
}