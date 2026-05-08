import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  accent?: "primary" | "secondary" | "accent";
  progress?: number;
}

const accentMap = {
  primary: "from-primary/30 to-primary/5 text-primary",
  secondary: "from-secondary/30 to-secondary/5 text-secondary",
  accent: "from-accent/30 to-accent/5 text-accent",
};

export default function StatCard({ icon: Icon, label, value, unit, trend, accent = "primary", progress }: Props) {
  return (
    <div className="glass-card p-6 float-card relative overflow-hidden group">
      <div className={cn("absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br opacity-40 blur-2xl", accentMap[accent])} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-11 h-11 rounded-xl glass flex items-center justify-center", `text-${accent}`)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className="text-xs mono text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              {trend}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {unit && <span className="text-sm text-muted-foreground mono">{unit}</span>}
        </div>
        {progress !== undefined && (
          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-1000", accentMap[accent])}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
