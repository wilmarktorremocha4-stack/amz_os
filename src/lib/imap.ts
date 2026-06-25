import { ImapFlow } from "imapflow";
import { decrypt } from "@/lib/crypto";
import { simpleParser } from "mailparser";

export interface InboxMessage {
  uid: number;
  messageId: string;
  inReplyTo: string | null;
  subject: string;
  fromName: string;
  fromEmail: string;
  date: Date;
  bodyText: string | null;
}

function getImapHost(smtpHost: string): { host: string; port: number } {
  const map: Record<string, { host: string; port: number }> = {
    "smtp.gmail.com":         { host: "imap.gmail.com",        port: 993 },
    "smtp-mail.outlook.com":  { host: "outlook.office365.com", port: 993 },
    "smtp.office365.com":     { host: "outlook.office365.com", port: 993 },
    "smtp.mail.yahoo.com":    { host: "imap.mail.yahoo.com",   port: 993 },
    "smtp.mail.me.com":       { host: "imap.mail.me.com",      port: 993 },
    "smtp.zoho.com":          { host: "imap.zoho.com",         port: 993 },
    "smtp.live.com":          { host: "imap-mail.outlook.com", port: 993 },
  };
  return map[smtpHost] ?? { host: smtpHost.replace(/^smtp\./, "imap."), port: 993 };
}

export async function fetchRecentReplies(config: {
  smtpHost: string;
  smtpUser: string;
  smtpPassEncrypted: string;
}): Promise<InboxMessage[]> {
  const { host, port } = getImapHost(config.smtpHost);
  const password = decrypt(config.smtpPassEncrypted);

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user: config.smtpUser, pass: password },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await client.connect();
  const messages: InboxMessage[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const raw = await client.search({ since }, { uid: true });
      const uids: number[] = Array.isArray(raw) ? raw.slice(-200) : [];

      if (uids.length === 0) return messages;

      const range = uids.join(",");

      for await (const msg of client.fetch(range, { uid: true, envelope: true, source: true }, { uid: true })) {
        const fromAddr = msg.envelope?.from?.[0];
        if (!fromAddr) continue;

        const fromEmail = (fromAddr as { address?: string }).address ?? "";
        if (!fromEmail) continue;

        const fromName = (fromAddr as { name?: string }).name ?? fromEmail;

        // Parse full message source to extract body text
        let bodyText: string | null = null;
        if (msg.source) {
          try {
            const parsed = await simpleParser(msg.source);
            bodyText = parsed.text?.trim() ?? parsed.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? null;
            // Trim to 2000 chars max
            if (bodyText && bodyText.length > 2000) bodyText = bodyText.slice(0, 2000) + "…";
          } catch {
            bodyText = null;
          }
        }

        messages.push({
          uid: msg.uid ?? 0,
          messageId: msg.envelope?.messageId ?? String(msg.uid),
          inReplyTo: (msg.envelope as unknown as { inReplyTo?: string }).inReplyTo ?? null,
          subject: msg.envelope?.subject ?? "(no subject)",
          fromName: fromName ? `${fromName}` : fromEmail,
          fromEmail: fromEmail.toLowerCase(),
          date: msg.envelope?.date ?? new Date(),
          bodyText,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return messages;
}
