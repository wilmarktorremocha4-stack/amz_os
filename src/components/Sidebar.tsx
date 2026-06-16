import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/calculators", label: "Calculators" },
  { href: "/crm", label: "Supplier CRM" },
  { href: "/research", label: "Product Research" },
  { href: "/research/brands", label: "Brand Research" },
  { href: "/progress", label: "Progress Tracker" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        AMZ OS
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
