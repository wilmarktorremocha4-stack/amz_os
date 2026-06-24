import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const secret = process.env.SMTP_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SMTP_ENCRYPTION_SECRET must be set and at least 32 characters");
  }
  return crypto.scryptSync(secret, "amz-os-salt", 32);
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return decrypted.toString("utf8");
}
