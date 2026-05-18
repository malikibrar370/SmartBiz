import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "accent";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-gradient-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  accent: "bg-gradient-accent text-accent-foreground",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-elegant transition-transform hover:-translate-y-0.5">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={cn("flex w-16 items-center justify-center", toneClasses[tone])}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex flex-1 flex-col justify-center px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-display text-3xl font-bold text-foreground">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
