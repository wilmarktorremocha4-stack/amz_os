"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// TopBar is only shown on the dashboard (/) - renders a compact CRM contact search
// On other pages it renders nothing

type Contact = { id: string; companyName: string; contactName: string | null; email: string | null };

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function TopBar({ contacts = [] }: { contacts?: Contact[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? contacts.filter((c) =>
        c.companyName.toLowerCase().includes(query.toLowerCase()) ||
        (c.contactName ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Only render on dashboard
  if (pathname !== "/") return null;

  return (
    <header className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
      <div ref={ref} className="relative w-full max-w-xs">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Search size={13} className="shrink-0 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search contacts…"
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setOpen(false); }}>
              <X size={12} className="text-[var(--muted)]" />
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            {filtered.map((c) => (
              <Link key={c.id} href={`/crm/${c.id}`}
                onClick={() => { setQuery(""); setOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--accent-soft)] transition-colors">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {getInitials(c.companyName)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-[var(--foreground)]">{c.companyName}</div>
                  {(c.contactName || c.email) && (
                    <div className="truncate text-[10px] text-[var(--muted)]">{c.contactName ?? c.email}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        {open && query.trim() && filtered.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 shadow-xl">
            <p className="text-xs text-[var(--muted)]">No contacts found</p>
          </div>
        )}
      </div>
    </header>
  );
}
