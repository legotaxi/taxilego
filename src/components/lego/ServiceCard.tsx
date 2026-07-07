import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  name: string;
  eta: string;
  price: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ icon: Icon, name, eta, price, selected, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-transparent bg-muted hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-base font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground">Chega em {eta}</div>
      </div>
      <div className="text-right">
        <div className="font-display text-base font-bold">{price}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Kz</div>
      </div>
    </button>
  );
}
