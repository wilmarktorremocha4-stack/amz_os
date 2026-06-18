"use client";

import { useRouter } from "next/navigation";
import { X, User } from "lucide-react";
import { useTransition, useRef } from "react";

const CONTACT_TYPES = [
  "Lead", "Customer", "Prospect", "Partner", "Vendor", "Other",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Manila",
  "Australia/Sydney",
];

export function CrmAddPanel({
  createSupplier,
}: {
  createSupplier: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function close() {
    router.push("/crm");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Combine firstName + lastName into contactName
    const first = String(fd.get("firstName") ?? "").trim();
    const last = String(fd.get("lastName") ?? "").trim();
    fd.set("contactName", [first, last].filter(Boolean).join(" "));
    // businessName → companyName fallback
    const biz = String(fd.get("businessName") ?? "").trim();
    if (biz) fd.set("companyName", biz);
    startTransition(async () => {
      try {
        await createSupplier(fd);
      } catch {
        // redirect() throws on success
      }
      router.push("/crm");
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Add Contact</h2>
          <button type="button" onClick={close}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)]">
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto">
          {/* Avatar placeholder */}
          <div className="flex flex-col items-start gap-1 border-b border-[var(--border)] px-6 py-5">
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">Contact image</p>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--muted)]">
              <User size={28} />
            </div>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            {/* First / Last */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                  First name <span className="text-red-500">*</span>
                </label>
                <input name="firstName" placeholder="Enter First name" required
                  className="input w-full" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Last name</label>
                <input name="lastName" placeholder="Enter Last name" className="input w-full" />
              </div>
            </div>

            {/* Business name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Business name</label>
              <input name="businessName" placeholder="Company or business name" className="input w-full" />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Email</label>
              <input name="email" type="email" placeholder="Please enter email address" className="input w-full" />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Phone</label>
              <input name="phone" placeholder="Enter phone number" className="input w-full" />
            </div>

            {/* Website */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Website</label>
              <input name="website" placeholder="https://example.com" className="input w-full" />
            </div>

            {/* Contact type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Contact type</label>
              <select name="contactType" className="input w-full bg-[var(--surface)]">
                <option value="">Select an option</option>
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Time zone</label>
              <select name="timezone" className="input w-full bg-[var(--surface)]">
                <option value="">Select an option</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Notes</label>
              <textarea name="notes" rows={3} placeholder="Additional notes..."
                className="input w-full resize-none" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex gap-2 border-t border-[var(--border)] px-6 py-4">
            <button type="button" onClick={close}
              className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 btn-primary disabled:opacity-50">
              {pending ? "Creating…" : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
