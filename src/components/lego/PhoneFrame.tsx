import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[720px] w-[350px] rounded-[2.75rem] border-[10px] border-foreground bg-background shadow-elevated">
      <div className="absolute left-1/2 top-0 z-40 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-foreground" />
      <div className="h-full w-full overflow-hidden rounded-[2rem]">{children}</div>
    </div>
  );
}
