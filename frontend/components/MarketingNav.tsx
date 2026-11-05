"use client";

import Link from "next/link";
import { CovenantMark } from "./CovenantMark";

/**
 * Landing / pitch nav — marketing anchors + one entry into the product dashboard.
 * In-app Create / Solve / Explore / Protocol stay on AppShell after you enter.
 */
export function MarketingNav() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-navy-deep/85 px-4 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between md:px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <CovenantMark className="h-7 w-7" />
          <span className="font-display text-lg tracking-tight text-mist">
            Covenant
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <a
            href="#how"
            className="hidden text-sm text-mist/70 transition-colors hover:text-gold sm:inline"
          >
            How it works
          </a>
          <a
            href="#demo"
            className="hidden text-sm text-mist/70 transition-colors hover:text-gold md:inline"
          >
            Demo
          </a>
          <Link
            href="/protocol"
            className="hidden text-sm text-mist/70 transition-colors hover:text-gold sm:inline"
          >
            Protocol
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center bg-gold px-4 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
