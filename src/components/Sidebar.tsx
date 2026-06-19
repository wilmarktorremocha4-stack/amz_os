"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
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
  Archive,
  Telescope,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Mail,
  Send,
  LineChart,
  Store,
  Zap,
  SearchCheck,
} from "lucide-react";
import { logOut } from "@/lib/actions/auth";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { label: "─── CRM", icon: Users, href: "", divider: true },
  { href: "/crm", label: "Contacts", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: TrendingUp },
  { href: "/contacts/enrich", label: "Enrich Contacts", icon: SearchCheck },
  { label: "─── Sourcing", icon: Store, href: "", divider: true },
  { href: "/brands/finder", label: "Brand Finder", icon: Store },
  { href: "/research", label: "Product Research", icon: PackageSearch },
  { href: "/research/brands", label: "Brand Research", icon: Sparkles },
  { href: "/scout", label: "Market Scout", icon: Telescope },
  { label: "─── Email", icon: Mail, href: "", divider: true },
  { href: "/email/campaigns", label: "Campaigns", icon: Send },
  { href: "/email/sequences", label: "Sequences", icon: Zap },
  { href: "/email/templates", label: "Templates", icon: Mail },
  { href: "/email/analytics", label: "Email Analytics", icon: LineChart },
  { label: "─── Reports", icon: BarChart3, href: "", divider: true },
  { href: "/progress", label: "Progress Tracker", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai-agent", label: "AI Agent", icon: Bot },
  { href: "/archive", label: "Archive", icon: Archive },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
  return (
    <Suspense fallback={null}>
      <SidebarInner userEmail={userEmail} />
    </Suspense>
  );
}

function SidebarInner({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.includes("?")) {
      const [hrefPath, hrefQuery] = href.split("?");
      if (!pathname.startsWith(hrefPath)) return false;
      const [paramKey, paramVal] = hrefQuery.split("=");
      return searchParams.get(paramKey) === paramVal;
    }
    // Plain path: active only when no conflicting query-param link would match
    if (!pathname.startsWith(href)) return false;
    // For /crm, only active when no tab param or tab=contacts (not tab=tags etc going to separate pages)
    if (href === "/crm") {
      const tab = searchParams.get("tab");
      return !tab || tab === "contacts" || tab === "tags";
    }
    return true;
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-0.5 overflow-y-auto">
      {links.map((link) => {
        if ((link as { divider?: boolean }).divider) {
          if (collapsed) return null;
          return (
            <div key={link.label} className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]/60">
              {link.label.replace("─── ", "")}
            </div>
          );
        }
        const active = isActive(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href + link.label}
            href={link.href}
            title={collapsed ? link.label : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25"
                : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            } ${collapsed ? "justify-center px-2" : ""}`}
          >
            <Icon size={17} strokeWidth={2} className={active ? "text-white shrink-0" : "shrink-0"} />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-md md:hidden"
      >
        <Menu size={18} className="text-[var(--foreground)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ${
          collapsed ? "w-[60px]" : "w-64"
        } relative`}
      >
        <SidebarContent
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          userEmail={userEmail}
          NavLinks={NavLinks}
          pathname={pathname}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)]"
        >
          <X size={16} />
        </button>
        <SidebarContent
          collapsed={false}
          toggleCollapse={() => {}}
          userEmail={userEmail}
          NavLinks={NavLinks}
          pathname={pathname}
          hideMobileToggle
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  toggleCollapse,
  userEmail,
  NavLinks,
  hideMobileToggle,
}: {
  collapsed: boolean;
  toggleCollapse: () => void;
  userEmail?: string;
  NavLinks: React.ComponentType;
  pathname: string;
  hideMobileToggle?: boolean;
}) {
  return (
    <div className={`flex h-full flex-col p-3 ${collapsed ? "items-center" : ""}`}>
      {/* Logo */}
      <div className={`mb-5 flex items-center gap-2 px-1 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30">
            <Boxes size={18} />
          </div>
        ) : (
          <Image
            src="https://assets.cdn.filesafe.space/2rx7sGBL7YKaiP0HwK56/media/6a3427f3671890ccaac6cf63.png"
            alt="AMZ OS"
            width={140}
            height={56}
            className="h-12 w-auto object-contain"
            unoptimized
          />
        )}
      </div>

      <NavLinks />

      {/* Bottom */}
      <div className={`mt-auto flex flex-col gap-1 border-t border-[var(--border)] pt-3 ${collapsed ? "items-center w-full" : ""}`}>
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] ${collapsed ? "justify-center px-2" : ""}`}
        >
          <Settings size={17} strokeWidth={2} className="shrink-0" />
          {!collapsed && "Settings"}
        </Link>

        {userEmail && !collapsed && (
          <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--muted)]">
            {userEmail}
          </div>
        )}

        <form action={logOut}>
          <button
            type="submit"
            title={collapsed ? "Log out" : undefined}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] ${collapsed ? "justify-center px-2" : ""}`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && "Log out"}
          </button>
        </form>

        {/* Collapse toggle — desktop only */}
        {!hideMobileToggle && (
          <button
            onClick={toggleCollapse}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
