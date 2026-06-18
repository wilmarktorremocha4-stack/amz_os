import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { BarChart3, Mail, MousePointer, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

export default async function EmailAnalyticsPage() {
  const user = await getCurrentUser();

  const campaigns = await prisma.emailCampaign.findMany({
    where: { userId: user.id },
    include: {
      recipients: { select: { status: true, sentAt: true, openedAt: true, clickedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allRecipients = campaigns.flatMap((c) => c.recipients);
  const sent = allRecipients.filter((r) => r.status !== "queued").length;
  const opened = allRecipients.filter((r) => r.status === "opened" || r.status === "clicked").length;
  const clicked = allRecipients.filter((r) => r.status === "clicked").length;
  const bounced = allRecipients.filter((r) => r.status === "bounced").length;
  const unsubscribed = allRecipients.filter((r) => r.status === "unsubscribed").length;

  const stats = [
    { label: "Total Sent", value: sent.toLocaleString(), icon: <Mail size={18} />, color: "text-blue-600 bg-blue-50" },
    { label: "Open Rate", value: pct(opened, sent), icon: <CheckCircle2 size={18} />, color: "text-emerald-600 bg-emerald-50" },
    { label: "Click Rate", value: pct(clicked, sent), icon: <MousePointer size={18} />, color: "text-violet-600 bg-violet-50" },
    { label: "Bounce Rate", value: pct(bounced, sent), icon: <AlertCircle size={18} />, color: "text-red-500 bg-red-50" },
  ];

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Email Analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Real-time performance across all campaigns.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{s.value}</div>
            <div className="mt-0.5 text-sm text-[var(--muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-campaign breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Campaign Breakdown</h2>
        {campaigns.length === 0 ? (
          <div className="card rounded-xl border-dashed p-8 text-center text-sm text-[var(--muted)]">
            No campaigns sent yet. Create a campaign to see analytics here.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--accent-soft)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Campaign</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Opens</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Clicks</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Bounces</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Open %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {campaigns.map((c) => {
                  const r = c.recipients;
                  const cSent = r.filter((x) => x.status !== "queued").length;
                  const cOpened = r.filter((x) => x.status === "opened" || x.status === "clicked").length;
                  const cClicked = r.filter((x) => x.status === "clicked").length;
                  const cBounced = r.filter((x) => x.status === "bounced").length;
                  return (
                    <tr key={c.id} className="hover:bg-[var(--accent-soft)] transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--foreground)]">{c.name}</div>
                        <div className="text-xs text-[var(--muted)]">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--foreground)]">{cSent}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{cOpened}</td>
                      <td className="px-4 py-3 text-right text-violet-600">{cClicked}</td>
                      <td className="px-4 py-3 text-right text-red-500">{cBounced}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--border)]">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct(cOpened, cSent) }} />
                          </div>
                          <span className="text-xs text-[var(--foreground)]">{pct(cOpened, cSent)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unsubscribed > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <TrendingUp size={15} />
          <span>{unsubscribed} contact{unsubscribed !== 1 ? "s" : ""} unsubscribed across all campaigns.</span>
        </div>
      )}
    </main>
  );
}
