"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";

type Contact = { id: string; companyName: string; contactName: string | null; email: string | null };

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function ContactSearch({ contacts }: { contacts: Contact[] }) {
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
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <Search size={15} className="shrink-0 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search contacts…"
          className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}>
            <X size={14} className="text-[var(--muted)] hover:text-[var(--foreground)]" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          {filtered.map((contact) => (
            <Link key={contact.id} href={`/crm/${contact.id}`}
              onClick={() => { setQuery(""); setOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--accent-soft)] transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {getInitials(contact.companyName)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--foreground)]">
                  {contact.companyName}
                </div>
                {(contact.contactName || contact.email) && (
                  <div className="truncate text-xs text-[var(--muted)]">
                    {contact.contactName ?? contact.email}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-xl">
          <p className="text-sm text-[var(--muted)]">No contacts found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
