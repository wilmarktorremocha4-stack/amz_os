import crypto from "crypto";

function getSecret(): string {
  return process.env.SMTP_ENCRYPTION_SECRET ?? process.env.AUTH_SECRET ?? "fallback-dev-only";
}

// Generate a signed reply-to token encoding userId + supplierId
export function makeReplyToken(userId: string, supplierId: string): string {
  const payload = `${userId}:${supplierId}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

// Verify and decode a reply token — returns null if invalid
export function parseReplyToken(token: string): { userId: string; supplierId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, supplierId, sig] = parts;
    const expected = crypto.createHmac("sha256", getSecret()).update(`${userId}:${supplierId}`).digest("hex").slice(0, 16);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { userId, supplierId };
  } catch {
    return null;
  }
}

// The inbound reply-to address for a supplier
export function replyToAddress(userId: string, supplierId: string): string {
  const domain = process.env.INBOUND_EMAIL_DOMAIN ?? "operationamz.net";
  const token = makeReplyToken(userId, supplierId);
  return `reply+${token}@${domain}`;
}
