"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CovenantMark } from "./CovenantMark";

export function SiteHeader({
  right,
}: {
  right?: React.ReactNode;
}) {
  const pathname = usePathname();
  const inApp = pathname?.startsWith("/app");

  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" className="group flex items-center gap-3">
        <CovenantMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-3" />
        <span className="font-display text-2xl tracking-tight text-mist group-hover:text-gold-soft transition-colors">
          Covenant
        </span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/app"
          className={`tracking-wide transition-colors ${
            inApp
              ? "text-gold"
              : "text-mist/60 hover:text-gold"
          }`}
        >
          App
        </Link>
        {right}
      </nav>
    </header>
  );
}
