import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = "neutral",
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-status-online",
    negative: "text-status-busy",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("p-6", className)} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <span className={cn("text-xs font-medium", changeColors[changeType])}>
                {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
