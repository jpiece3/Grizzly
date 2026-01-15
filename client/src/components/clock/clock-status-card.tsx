import { CheckCircle2, Clock, MapPin, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@shared/schema";

interface ClockStatusCardProps {
  entry: TimeEntry | null;
  status: "clocked-in" | "clocked-out" | "not-started";
}

export function ClockStatusCard({ entry, status }: ClockStatusCardProps) {
  const statusConfig = {
    "clocked-in": {
      icon: CheckCircle2,
      label: "Clocked In",
      color: "text-status-online",
      bgColor: "bg-status-online/10",
      borderColor: "border-l-status-online",
    },
    "clocked-out": {
      icon: Clock,
      label: "Clocked Out",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-l-muted-foreground",
    },
    "not-started": {
      icon: AlertCircle,
      label: "Not Started",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-l-muted-foreground",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "p-5 border-l-4",
        config.bgColor,
        config.borderColor
      )}
      data-testid="clock-status-card"
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className={cn("w-5 h-5", config.color)} />
        <span className={cn("text-[15px] font-semibold", config.color)}>
          {config.label}
        </span>
      </div>

      {entry && (
        <div className="space-y-4">
          {entry.clockInTime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Clock In
                </p>
                <p className="text-[15px] font-medium text-foreground">
                  {format(new Date(entry.clockInTime), "h:mm a")}
                </p>
                {entry.clockInLocationName && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {entry.clockInLocationName}
                    </span>
                  </div>
                )}
              </div>

              {entry.clockOutTime && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Clock Out
                  </p>
                  <p className="text-[15px] font-medium text-foreground">
                    {format(new Date(entry.clockOutTime), "h:mm a")}
                  </p>
                  {entry.clockOutLocationName && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {entry.clockOutLocationName}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {entry.clockInLat && entry.clockInLng && (
            <p className="text-[11px] text-muted-foreground/70">
              GPS: {entry.clockInLat.toFixed(6)}, {entry.clockInLng.toFixed(6)}
            </p>
          )}
        </div>
      )}

      {!entry && status === "not-started" && (
        <p className="text-sm text-muted-foreground">
          You haven't clocked in today yet.
        </p>
      )}
    </Card>
  );
}
