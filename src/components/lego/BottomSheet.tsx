import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: ReactNode;
  title?: string;
  className?: string;
  isOpen?: boolean;
}

export function BottomSheet({ children, title, className, isOpen = true }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        // Posicionado acima da bottom-nav (h-20) com margem segura
        "absolute inset-x-0 bottom-20 z-40 flex max-h-[50%] flex-col rounded-t-3xl bg-background/98 backdrop-blur-xl px-5 pt-4 pb-3 shadow-premium ring-1 ring-border/50 animate-in slide-in-from-bottom duration-300 overflow-hidden",
        className,
      )}
    >
      {/* Premium handle for dragging feel */}
      <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

      {title && (
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
      )}

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">{children}</div>
    </div>
  );
}
