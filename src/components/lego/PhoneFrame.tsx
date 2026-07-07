import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto", className)}>
      <div className="relative rounded-[2.75rem] border-[10px] border-foreground bg-foreground p-0 shadow-elevated">
        <div className="relative h-[760px] w-[380px] overflow-hidden rounded-[2.1rem] bg-background">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-50 flex h-7 w-32 -translate-x-1/2 items-center justify-center rounded-full bg-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
