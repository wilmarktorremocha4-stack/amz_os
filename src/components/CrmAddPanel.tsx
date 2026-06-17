"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useTransition, useRef } from "react";

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
    startTransition(async () => {
      try {
        await createSupplier(fd);
      } catch {
        // redirect() throws — that's expected on success
      }
      router.push("/crm");
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Add contact
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)]"
          >
            <X size={18} />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Company name <span className="text-red-500">*</span>
            </label>
            <input
              name="companyName"
              placeholder="e.g. Acme Wholesale"
              required
              className="input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Contact name
            </label>
            <input
              name="contactName"
              placeholder="e.g. John Smith"
              className="input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="contact@company.com"
              className="input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Phone
            </label>
            <input
              name="phone"
              placeholder="+1 (555) 000-0000"
              className="input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Website
            </label>
            <input
              name="website"
              placeholder="https://company.com"
              className="input w-full"
            />
          </div>

          <div className="mt-auto flex gap-2 pt-4">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
