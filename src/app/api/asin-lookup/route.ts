import { NextRequest, NextResponse } from "next/server";

/**
 * ASIN lookup via Amazon Product Advertising API 5.0 (PA-API).
 * Requires env vars:
 *   AMAZON_PAAPI_ACCESS_KEY
 *   AMAZON_PAAPI_SECRET_KEY
 *   AMAZON_PAAPI_PARTNER_TAG  (Associates store tag, e.g. mystore-20)
 *
 * Returns a subset of product data sufficient for FBA fee calculations.
 */

const PAAPI_HOST = "webservices.amazon.com";
const PAAPI_REGION = "us-east-1";
const PAAPI_PATH = "/paapi5/getitems";

async function signedPaapiRequest(asin: string) {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    return null; // not configured
  }

  const payload = JSON.stringify({
    ItemIds: [asin],
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ProductInfo",
      "Offers.Listings.Price",
      "Offers.Listings.Condition",
      "BrowseNodeInfo.BrowseNodes.SalesRank",
    ],
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${PAAPI_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;

  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const encoder = new TextEncoder();
  const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const canonicalRequest = [
    "POST",
    PAAPI_PATH,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHashHex,
  ].join("\n");

  const credentialScope = `${dateStamp}/${PAAPI_REGION}/ProductAdvertisingAPI/aws4_request`;
  const crHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
  const crHashHex = Array.from(new Uint8Array(crHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, crHashHex].join("\n");

  async function hmac(key: ArrayBuffer, data: string) {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  }

  const kDate = await hmac(encoder.encode(`AWS4${secretKey}`).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmac(kDate, PAAPI_REGION);
  const kService = await hmac(kRegion, "ProductAdvertisingAPI");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${PAAPI_HOST}${PAAPI_PATH}`, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host: PAAPI_HOST,
      "x-amz-date": amzDate,
      "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      Authorization: authHeader,
    },
    body: payload,
  });

  if (!res.ok) return null;
  return res.json();
}

export async function GET(req: NextRequest) {
  // Require authentication — PA-API is a paid quota resource
  try {
    const { getCurrentUser } = await import("@/lib/currentUser");
    await getCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asin = req.nextUrl.searchParams.get("asin")?.trim().toUpperCase();
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return NextResponse.json({ error: "Invalid ASIN format" }, { status: 400 });
  }

  const hasKeys =
    !!process.env.AMAZON_PAAPI_ACCESS_KEY &&
    !!process.env.AMAZON_PAAPI_SECRET_KEY &&
    !!process.env.AMAZON_PAAPI_PARTNER_TAG;

  if (!hasKeys) {
    return NextResponse.json({
      configured: false,
      message:
        "Amazon PA-API keys not configured. Set AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, and AMAZON_PAAPI_PARTNER_TAG in your environment variables to enable automatic product lookup.",
    });
  }

  try {
    const data = await signedPaapiRequest(asin);
    if (!data || !data.ItemsResult?.Items?.length) {
      return NextResponse.json({ error: "Product not found or not accessible via PA-API" }, { status: 404 });
    }

    const item = data.ItemsResult.Items[0];
    const title = item.ItemInfo?.Title?.DisplayValue ?? "";
    const price =
      item.Offers?.Listings?.[0]?.Price?.Amount ?? null;

    return NextResponse.json({ configured: true, asin, title, price });
  } catch {
    return NextResponse.json({ error: "PA-API request failed" }, { status: 500 });
  }
}
