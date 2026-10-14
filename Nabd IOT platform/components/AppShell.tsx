"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoMark } from "./Logo";

const NAV = [
  { href: "/fleet", label: "Overview" },
  { href: "/fleet#sites", label: "Sites" },
  { href: "/devices/nabd-01", label: "Devices" },
  { href: "/alerts", label: "Alerts", badge: "2" },
  { href: "/alerts#rules", label: "Rules" },
  { href: "/devices/nabd-01#firmware", label: "Firmware" },
  { href: "/architecture", label: "Architecture" },
  { href: "/ar", label: "العربية" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)", padding: "0 8px" }}>
          <LogoMark size={30} />
          <span className="display" style={{ fontSize: 20 }}>Nabd</span>
        </Link>
        <nav aria-label="App" className="sidebar-nav">
          {NAV.map((item) => {
            const section = (href: string) => href.split(/[/#]/)[1];
            const current = !item.href.includes("#") && section(pathname) === section(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
                {item.label}
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="demo-note card" style={{ marginTop: "auto", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <span className="muted">Demo mode</span>
          <span style={{ lineHeight: 1.5 }}>12 simulated nodes and 1 real board. Relays here are safe to flip.</span>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
