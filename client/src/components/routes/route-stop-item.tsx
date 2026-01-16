import { GripVertical, ChevronRight } from "lucide-react";
import type { RouteStop } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RouteStopItemProps {
  stop: RouteStop;
  index: number;
  isDragging?: boolean;
  showDragHandle?: boolean;
  onClick?: () => void;
  onCustomerClick?: (stop: RouteStop) => void;
  isCompact?: boolean;
}

export function RouteStopItem({
  stop,
  index,
  isDragging,
  showDragHandle = false,
  onClick,
  onCustomerClick,
  isCompact = false,
}: RouteStopItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-background rounded-xl border border-border transition-all",
        isCompact ? "p-3" : "p-4",
        isDragging && "shadow-lg opacity-95",
        onClick && "cursor-pointer hover-elevate"
      )}
      onClick={onClick}
      data-testid={`route-stop-${stop.id}`}
    >
      {showDragHandle && (
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <div
        className={cn(
          "rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center flex-shrink-0",
          isCompact ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"
        )}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-foreground truncate",
            isCompact ? "text-sm" : "text-[17px]",
            onCustomerClick && "cursor-pointer hover:text-primary transition-colors"
          )}
          onClick={(e) => {
            if (onCustomerClick) {
              e.stopPropagation();
              onCustomerClick(stop);
            }
          }}
          data-testid={`customer-name-${stop.id}`}
        >
          {stop.customerName}
        </p>
        <p
          className={cn(
            "text-muted-foreground truncate",
            isCompact ? "text-xs" : "text-[13px]"
          )}
        >
          {stop.address}
        </p>
        {stop.serviceType && !isCompact && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {stop.serviceType}
          </p>
        )}
      </div>

      {onClick && (
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}
