"use client";

import { useState, useTransition } from "react";
import { saveSmtpSettings, testSmtpConnection, disconnectSmtp } from "@/lib/actions/smtp-settings";
import { Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink, X } from "lucide-react";

interface Props {
  initialStatus: {
    smtpUser: string | null;
    smtpFromName: string | null;
    smtpVerifiedAt: Date | null;
  } | null;
}

const PROVIDERS = [
  { label: "Gmail",      host: "smtp.gmail.com",          port: 465 },
  { label: "Outlook",    host: "smtp.office365.com",      port: 587 },
  { label: "Hotmail",    host: "smtp.live.com",           port: 587 },
  { label: "Yahoo Mail", host: "smtp.mail.yahoo.com",     port: 465 },
  { label: "iCloud",     host: "smtp.mail.me.com",        port: 587 },
  { label: "Zoho Mail",  host: "smtp.zoho.com",           port: 465 },
  { label: "Custom",     host: "",                         port: 587 },
];

export function SmtpSettingsSection({ initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [provider, setProvider] = useState("Gmail");
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(465);
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [fromName, setFromName] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  function selectProvider(label: string) {
    const p = PROVIDERS.find(x => x.label === label)!;
    setProvider(label);
    setHost(p.host);
    setPort(p.port);
  }

  async function handleSaveAndTest() {
    if (!email || !appPassword || !host) return;
    setIsTesting(true);
    setTestResult(null);

    startTransition(async () => {
      const saveResult = await saveSmtpSettings({
        smtpHost: host,
        smtpPort: port,
        smtpUser: email,
        smtpPass: appPassword,
        smtpFromName: fromName,
      });
      if (!saveResult.success) {
        setTestResult({ success: false, error: saveResult.error });
        setIsTesting(false);
        return;
      }
      const result = await testSmtpConnection();
      setTestResult(result);
      setIsTesting(false);
      if (result.success) {
        setStatus({ smtpUser: email, smtpFromName: fromName || null, smtpVerifiedAt: new Date() });
      }
    });
  }

  async function handleDisconnect() {
    startTransition(async () => {
      await disconnectSmtp();
      setStatus(null);
      setTestResult(null);
      setEmail("");
      setAppPassword("");
    });
  }

  const isVerified = !!status?.smtpVerifiedAt;
  const inputCls = "input w-full text-sm";

  if (isVerified && status?.smtpUser) {
    return (
      <section className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Email Sending</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
            <CheckCircle2 size={13} /> Connected
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4">
          <Mail size={18} className="text-[var(--accent)]" />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {status.smtpFromName ? `${status.smtpFromName} <${status.smtpUser}>` : status.smtpUser}
            </p>
            <p className="text-xs text-[var(--muted)]">
              All outreach emails will be sent from this address.
              Verified {status.smtpVerifiedAt ? new Date(status.smtpVerifiedAt).toLocaleDateString() : ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isPending}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
        >
          <X size={13} /> Disconnect
        </button>
      </section>
    );
  }

  return (
    <section className="card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">Email Sending</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connect your email account so outreach emails are sent directly from your address.
          Brands will see YOUR email — not a system address.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-[var(--muted)]">
          STEP 1 — Choose your email provider
        </label>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map(p => (
            <button key={p.label} onClick={() => selectProvider(p.label)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                provider === p.label
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {provider === "Gmail" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-amber-400">STEP 2 — Get your Gmail App Password</p>
          <ol className="flex flex-col gap-1 text-xs text-[var(--muted)] list-decimal list-inside">
            <li>Go to your Google Account → Security</li>
            <li>Make sure 2-Step Verification is turned ON</li>
            <li>Search for &quot;App passwords&quot; in the search bar</li>
            <li>Select app: &quot;Mail&quot; → device: &quot;Other&quot; → type &quot;AMZ OS&quot;</li>
            <li>Click Generate — copy the 16-character password</li>
            <li>Paste it in the App Password field below</li>
          </ol>
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-xs text-[var(--accent)] hover:underline">
            Open Google App Passwords <ExternalLink size={11} />
          </a>
        </div>
      )}

      {(provider === "Outlook" || provider === "Hotmail") && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-400">STEP 2 — Enable SMTP in Outlook / Hotmail</p>
          <ol className="flex flex-col gap-1 text-xs text-[var(--muted)] list-decimal list-inside">
            <li>Sign in at outlook.com → Settings (gear icon) → View all Outlook settings</li>
            <li>Go to Mail → Sync email → toggle &quot;Let devices and apps use POP&quot; ON</li>
            <li>Use your full email address and your regular Outlook password below</li>
            <li>If you have 2FA, generate an App Password at account.live.com/proofs</li>
          </ol>
        </div>
      )}

      {provider === "Yahoo Mail" && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-purple-400">STEP 2 — Get your Yahoo App Password</p>
          <ol className="flex flex-col gap-1 text-xs text-[var(--muted)] list-decimal list-inside">
            <li>Sign in at Yahoo → Account Security settings</li>
            <li>Make sure 2-Step Verification is ON</li>
            <li>Click &quot;Generate app password&quot; → select &quot;Other app&quot; → name it &quot;AMZ OS&quot;</li>
            <li>Copy the generated password and paste it below</li>
          </ol>
          <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-xs text-[var(--accent)] hover:underline">
            Open Yahoo Security Settings <ExternalLink size={11} />
          </a>
        </div>
      )}

      {provider === "iCloud" && (
        <div className="rounded-xl border border-slate-500/30 bg-slate-500/5 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-300">STEP 2 — Get your iCloud App-Specific Password</p>
          <ol className="flex flex-col gap-1 text-xs text-[var(--muted)] list-decimal list-inside">
            <li>Sign in at appleid.apple.com → Sign-In and Security</li>
            <li>Click &quot;App-Specific Passwords&quot; → &quot;Generate an app-specific password&quot;</li>
            <li>Name it &quot;AMZ OS&quot; and click Create</li>
            <li>Copy the password and paste it below (use your iCloud email above)</li>
          </ol>
          <a href="https://appleid.apple.com/account/manage" target="_blank" rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-xs text-[var(--accent)] hover:underline">
            Open Apple ID Settings <ExternalLink size={11} />
          </a>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-semibold text-[var(--muted)]">
          STEP {provider === "Custom" ? "2" : "3"} — Enter your credentials
        </label>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Your email address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                type="email"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Display name (optional)</label>
              <input
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="John Smith"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">
              {provider === "Gmail" ? "App Password (16 characters, no spaces)" : "Email password"}
            </label>
            <input
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder={provider === "Gmail" ? "xxxx xxxx xxxx xxxx" : "Your password"}
              type="password"
              className={inputCls}
            />
          </div>
          {provider === "Custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">SMTP host</label>
                <input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">SMTP port</label>
                <input value={port} onChange={e => setPort(Number(e.target.value))} type="number" placeholder="465" className={inputCls} />
              </div>
            </div>
          )}
        </div>
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
          testResult.success
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
            : "border-red-500/30 bg-red-500/5 text-red-400"
        }`}>
          {testResult.success
            ? <><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> Connection verified! Check your inbox for a test email.</>
            : <><AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>Failed: {testResult.error}. Double-check your App Password and make sure 2FA is enabled.</span></>
          }
        </div>
      )}

      <button
        onClick={handleSaveAndTest}
        disabled={!email || !appPassword || !host || isTesting || isPending}
        className="btn-primary flex w-fit items-center gap-2 disabled:opacity-40"
      >
        {isTesting || isPending
          ? <><Loader2 size={14} className="animate-spin" /> Connecting &amp; sending test email…</>
          : <><Mail size={14} /> Connect &amp; verify</>
        }
      </button>
      <p className="text-[11px] text-[var(--muted)]">
        A test email will be sent to your own address to confirm the connection works.
        Your password is encrypted before being stored.
      </p>
    </section>
  );
}
