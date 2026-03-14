"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandProvider, useBrand, Avatar } from "@ex-group/ui";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: "\u2302" },
  { label: "Bookings", href: "/bookings", icon: "\uD83D\uDCC5" },
  { label: "Wallet", href: "/wallet", icon: "\uD83D\uDCB3" },
  { label: "Loyalty", href: "/loyalty", icon: "\u2B50" },
  { label: "Profile", href: "/profile", icon: "\uD83D\uDC64" },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const brand = useBrand();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
          role="presentation"
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          collapsed ? "-translate-x-full" : "translate-x-0",
          "w-64",
        ].join(" ")}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: brand.colors.accent }}
          >
            {brand.name.charAt(0)}
          </div>
          <span className="text-lg font-semibold text-brand-primary">{brand.name}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-accent/10 text-brand-accent"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    ].join(" ")}
                    onClick={() => {
                      if (window.innerWidth < 1024) onToggle();
                    }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar alt="User" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">Guest User</p>
              <p className="truncate text-xs text-gray-500">guest@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-brand-surface">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider brandId="ex_style">
      <AppShell>{children}</AppShell>
    </BrandProvider>
  );
}
