import { LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClockButtonProps {
  type: "in" | "out";
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ClockButton({ type, onClick, isLoading, disabled }: ClockButtonProps) {
  const isClockIn = type === "in";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "w-full h-16 rounded-2xl text-[17px] font-semibold gap-3 transition-transform active:scale-95",
        isClockIn
          ? "bg-status-online hover:bg-status-online/90 text-white border-status-online"
          : "bg-status-busy hover:bg-status-busy/90 text-white border-status-busy"
      )}
      data-testid={`button-clock-${type}`}
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : isClockIn ? (
        <LogIn className="w-6 h-6" />
      ) : (
        <LogOut className="w-6 h-6" />
      )}
      {isClockIn ? "Clock In" : "Clock Out"}
    </Button>
  );
}
