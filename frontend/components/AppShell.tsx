"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CovenantMark } from "./CovenantMark";

const MAIN = [
  { href: "/dashboard", label: "Overview", hint: "Live pulse" },
  { href: "/app", label: "Create", hint: "Post intents" },
  { href: "/solver", label: "Solve", hint: "Order book" },
  { href: "/explore", label: "Explore", hint: "Settlements" },
];

const PROTOCOL = [
  { href: "/protocol", label: "Protocol", hint: "Architecture" },
];

function NavLink({
  href,
  label,
  hint,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  hint: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block border-l-2 px-4 py-2.5 transition-colors ${
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-transparent text-mist/65 hover:border-white/20 hover:bg-white/[0.03] hover:text-mist"
      }`}
    >
      <span className="block text-sm font-medium tracking-wide">{label}</span>
      <span className="mt-0.5 block text-[11px] text-mist/40">{hint}</span>
    </Link>
  );
}

function titleFor(pathname: string | null) {
  if (!pathname) return "Dashboard";
  if (pathname.startsWith("/dashboard")) return "Overview";
  if (pathname.startsWith("/app")) return "Create";
  if (pathname.startsWith("/solver")) return "Solve";
  if (pathname.startsWith("/explore")) return "Explore";
  if (pathname.startsWith("/protocol")) return "Protocol";
  return "Dashboard";
}

/**
 * Product dashboard chrome: left sidebar + top bar + main canvas.
 * Landing keeps MarketingNav; this shell is for /dashboard and consoles.
 */
export function AppShell({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname);

  const isActive = (href: string) =>
    pathname === href || Boolean(pathname?.startsWith(`${href}/`));

  const close = () => setOpen(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href="/dashboard"
        onClick={close}
        className="flex items-center gap-3 border-b border-white/10 px-5 py-5"
      >
        <CovenantMark className="h-8 w-8" />
        <div>
          <p className="font-display text-xl tracking-tight text-mist">
            Covenant
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-mist/40">
            Dashboard
          </p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-2 py-5">
        <p className="mb-2 px-4 text-[10px] uppercase tracking-[0.18em] text-mist/35">
          Main
        </p>
        <div className="space-y-0.5">
          {MAIN.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </div>

        <p className="mb-2 mt-8 px-4 text-[10px] uppercase tracking-[0.18em] text-mist/35">
          Protocol
        </p>
        <div className="space-y-0.5">
          {PROTOCOL.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-mist/40">
          Bonded settlement on NEAR. Real BTC via Chain Signatures.
        </p>
        <Link
          href="/"
          onClick={close}
          className="mt-3 inline-block text-xs text-gold hover:text-gold-soft"
        >
          ← Pitch landing
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-deep text-mist">
      {/* Mobile drawer */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-navy-deep/70 lg:hidden"
          onClick={close}
        />
      ) : null}

      {/* Desktop sidebar — always in tab order */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-navy lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer — removed from a11y tree when closed */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-navy transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-navy-deep/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-white/15 px-3 py-1.5 text-xs text-mist/70 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              Menu
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist/40">
                Covenant
              </p>
              <p className="font-display text-xl tracking-tight text-mist sm:text-2xl">
                {title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {right}
            <Link
              href="/app"
              className="hidden border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/20 sm:inline-flex"
            >
              + New intent
            </Link>
          </div>
        </header>

        <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
      </div>
    </div>
  );
}
