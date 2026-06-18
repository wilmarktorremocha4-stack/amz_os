"use client";

import { useState, useTransition } from "react";
import { Sparkles, Globe, Mail, Phone, Loader2, AlertCircle, CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { enrichContact } from "@/lib/actions/enrichment";

type Enrichment = {
  websiteUrl?: string | null; contactPageUrl?: string | null; linkedinUrl?: string | null;
  instagramUrl?: string | null; facebookUrl?: string | null; twitterUrl?: string | null;
  phone?: string | null; discoveredEmail?: string | null; enrichedAt?: Date | string;
};
type Supplier = { id: string; companyName: string; website: string | null; email: string | null; enrichment: Enrichment | null };

export function EnrichClient({ suppliers }: { suppliers: Supplier[] }) {
  const [results, setResults] = useState<Record<string, Enrichment | { error: string }>>({});
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);

  function handleEnrich(supplierId: string) {
    setRunning(supplierId);
    startTransition(async () => {
      const res = await enrichContact(supplierId);
      setResults((prev) => ({ ...prev, [supplierId]: res as Enrichment | { error: string } }));
      setRunning(null);
    });
  }

  const withWebsite = suppliers.filter((s) => s.website);
  const noWebsite = suppliers.filter((s) => !s.website);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Contact Enrichment</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Auto-discover emails, LinkedIn, Instagram, and social profiles from brand websites.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <div>
          <strong>How it works:</strong> We fetch the brand's website, extract contact emails and social links, and save them to the contact. If OpenAI is configured, AI picks the most relevant contact email.
        </div>
      </div>

      {noWebsite.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle size={14} />
          {noWebsite.length} contact{noWebsite.length !== 1 ? "s" : ""} have no website set — add a website URL to enrich them.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {withWebsite.length === 0 && (
          <div className="card rounded-xl border-dashed p-8 text-center text-sm text-[var(--muted)]">
            Add website URLs to your contacts to enable enrichment.
          </div>
        )}
        {withWebsite.map((s) => {
          const r = results[s.id];
          const enrichment = s.enrichment ?? (r && !("error" in r) ? r : null);
          const isRunning = running === s.id;
          const hasError = r && "error" in r;

          return (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--foreground)]">{s.companyName}</div>
                  <a href={s.website?.startsWith("http") ? s.website! : `https://${s.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-0.5">
                    <Globe size={10} />{s.website}
                  </a>

                  {enrichment && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {enrichment.discoveredEmail && (
                        <a href={`mailto:${enrichment.discoveredEmail}`} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)] hover:border-blue-400">
                          <Mail size={11} className="text-blue-500" />{enrichment.discoveredEmail}
                        </a>
                      )}
                      {enrichment.linkedinUrl && (
                        <a href={enrichment.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)] hover:border-blue-400">
                          <Link2 size={11} className="text-blue-600" />LinkedIn <ExternalLink size={9} />
                        </a>
                      )}
                      {enrichment.instagramUrl && (
                        <a href={enrichment.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)] hover:border-pink-400">
                          <Link2 size={11} className="text-pink-500" />Instagram <ExternalLink size={9} />
                        </a>
                      )}
                      {enrichment.facebookUrl && (
                        <a href={enrichment.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)] hover:border-blue-400">
                          <Link2 size={11} className="text-blue-500" />Facebook <ExternalLink size={9} />
                        </a>
                      )}
                      {enrichment.phone && (
                        <span className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)]">
                          <Phone size={11} className="text-[var(--muted)]" />{enrichment.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {hasError && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle size={12} /> {(r as { error: string }).error}
                    </div>
                  )}
                </div>

                <button type="button" disabled={isRunning || pending} onClick={() => handleEnrich(s.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    enrichment && !hasError ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                  }`}>
                  {isRunning ? <Loader2 size={13} className="animate-spin" /> : enrichment && !hasError ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
                  {isRunning ? "Enriching…" : enrichment && !hasError ? "Re-enrich" : "Enrich"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
