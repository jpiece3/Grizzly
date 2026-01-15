import { MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  isLoading?: boolean;
}

export function LocationPermissionModal({
  open,
  onOpenChange,
  onEnable,
  isLoading,
}: LocationPermissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Enable Location Access</DialogTitle>
          <DialogDescription className="text-[15px] text-muted-foreground mt-2">
            We need your location to verify you're at the work site when clocking in or out. Your location is only used for time tracking verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            onClick={onEnable}
            className="w-full h-14 rounded-xl text-[17px] font-semibold"
            disabled={isLoading}
            data-testid="button-enable-location"
          >
            Enable Location
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
            data-testid="button-cancel-location"
          >
            Not now
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground/70 mt-2">
          Your location data is stored securely and only used for time tracking.
        </p>
      </DialogContent>
    </Dialog>
  );
}
