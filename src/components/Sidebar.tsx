"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Users,
  PackageSearch,
  Sparkles,
  TrendingUp,
  Settings,
  BarChart3,
  Bot,
  Boxes,
  LogOut,
} from "lucide-react";
import { logOut } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/crm", label: "Supplier CRM", icon: Users },
  { href: "/research", label: "Product Research", icon: PackageSearch },
  { href: "/research/brands", label: "Brand Research", icon: Sparkles },
  { href: "/progress", label: "Progress Tracker", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai-agent", label: "AI Agent", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-8 flex items-center gap-2 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30">
          <Boxes size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            AMZ OS
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Wholesale Operating System
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={2}
                className={isActive ? "text-white" : ""}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        {userEmail && (
          <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--muted)]">
            {userEmail}
          </div>
        )}
        <form action={logOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <LogOut size={16} />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
