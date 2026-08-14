import type { ReactNode } from "react";

export function BottomSheet({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative z-30 -mt-6 rounded-t-3xl border-t border-border bg-card shadow-elevated">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
      {title && (
        <div className="px-5 pt-3 font-display text-base font-bold">{title}</div>
      )}
      <div className="max-h-[55vh] overflow-y-auto px-5 pb-6 pt-3">{children}</div>
    </div>
  );
}
