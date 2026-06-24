import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getSecret(): string {
  const secret = process.env.SMTP_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SMTP_ENCRYPTION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

// Format: saltHex:ivHex:encryptedHex (random salt per record — no static salt)
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(getSecret(), salt, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return salt.toString("hex") + ":" + iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  // Support legacy 2-part format (iv:encrypted with static salt) for existing records
  if (parts.length === 2) {
    const [ivHex, encHex] = parts;
    const legacyKey = crypto.scryptSync(getSecret(), "amz-os-salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  }
  const [saltHex, ivHex, encHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const key = crypto.scryptSync(getSecret(), salt, 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
