import type { ReactNode } from "react";

/**
 * Content canvas inside AppShell.
 * Page title lives in the top bar — this frame holds description, toolbar, body.
 */
export function DashboardFrame({
  description,
  actions,
  toolbar,
  children,
}: {
  /** @deprecated Title comes from AppShell top bar */
  eyebrow?: string;
  /** @deprecated Title comes from AppShell top bar */
  title?: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="space-y-5 px-4 py-6 sm:px-6">
      {description || actions ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-mist/60">
              {description}
            </p>
          ) : (
            <span />
          )}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {toolbar ? <div className="space-y-3">{toolbar}</div> : null}
      {children}
    </main>
  );
}
