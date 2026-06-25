import { ImapFlow } from "imapflow";
import { decrypt } from "@/lib/crypto";

export interface InboxMessage {
  uid: number;
  messageId: string;
  inReplyTo: string | null;
  subject: string;
  from: string;
  fromEmail: string;
  text: string;
  html: string;
  date: Date;
}

function getImapHost(smtpHost: string): { host: string; port: number } {
  const map: Record<string, { host: string; port: number }> = {
    "smtp.gmail.com":          { host: "imap.gmail.com",        port: 993 },
    "smtp-mail.outlook.com":   { host: "outlook.office365.com", port: 993 },
    "smtp.office365.com":      { host: "outlook.office365.com", port: 993 },
    "smtp.mail.yahoo.com":     { host: "imap.mail.yahoo.com",   port: 993 },
    "smtp.mail.me.com":        { host: "imap.mail.me.com",      port: 993 },
    "smtp.zoho.com":           { host: "imap.zoho.com",         port: 993 },
    "smtp.live.com":           { host: "imap-mail.outlook.com", port: 993 },
  };
  return map[smtpHost] ?? { host: smtpHost.replace("smtp.", "imap."), port: 993 };
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  const messages: InboxMessage[] = [];

  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");

    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      // search returns number[] | false
      const result = await client.search({ since });
      const uids: number[] = Array.isArray(result) ? result : [];
      if (!uids.length) return messages;

      // Only process last 100 to stay within Vercel limits
      const recent = uids.slice(-100);
      const range = recent.join(",");

      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        bodyStructure: true,
      })) {
        const from = msg.envelope?.from?.[0];
        if (!from) continue;

        const fromEmail = (from as { address?: string }).address ?? "";
        const fromName = (from as { name?: string }).name
          ? `${(from as { name?: string }).name} <${fromEmail}>`
          : fromEmail;

        messages.push({
          uid: msg.uid,
          messageId: msg.envelope?.messageId ?? `${msg.uid}`,
          inReplyTo: (msg.envelope as { inReplyTo?: string }).inReplyTo ?? null,
          subject: msg.envelope?.subject ?? "(no subject)",
          from: fromName,
          fromEmail,
          text: "",
          html: "",
          date: msg.envelope?.date ?? new Date(),
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
