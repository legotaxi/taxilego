import { LucideIcon } from "lucide-react";

interface ServiceCardPremiumProps {
  icon: LucideIcon;
  name: string;
  eta: string;
  price: string;
  selected: boolean;
  onClick: () => void;
}

export function ServiceCardPremium({
  icon: Icon,
  name,
  eta,
  price,
  selected,
  onClick,
}: ServiceCardPremiumProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3 transition-all duration-300 border-2 flex items-center gap-3 group ${
        selected
          ? "bg-primary/10 border-primary shadow-glow"
          : "bg-muted/50 border-border/30 hover:border-primary/50 hover:bg-muted/70"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
          selected
            ? "bg-primary text-primary-foreground scale-110"
            : "bg-muted text-foreground group-hover:bg-primary/20"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="font-display font-bold text-sm text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">{eta}</div>
      </div>

      <div className="text-right">
        <div
          className={`font-display font-bold transition-colors duration-300 ${
            selected ? "text-primary text-base" : "text-foreground text-sm"
          }`}
        >
          {price === "—" ? "—" : `Kz ${price}`}
        </div>
      </div>
    </button>
  );
}
