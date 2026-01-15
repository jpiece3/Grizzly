import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/auth-context";
import { useGeolocation, calculateDistance } from "@/hooks/use-geolocation";
import { ClockButton } from "@/components/clock/clock-button";
import { ClockStatusCard } from "@/components/clock/clock-status-card";
import { LocationPermissionModal } from "@/components/clock/location-permission-modal";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { TimeEntry, WorkLocation } from "@shared/schema";

const GEOFENCE_RADIUS = 100; // meters

export function DriverClockView() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { position, error: geoError, isLoading: geoLoading, getCurrentPosition } = useGeolocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [clockAction, setClockAction] = useState<"in" | "out" | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayEntry, isLoading: entryLoading } = useQuery<TimeEntry | null>({
    queryKey: ["/api/time-entries", "today", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries/today?driverId=${user?.id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch time entry");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: workLocations = [] } = useQuery<WorkLocation[]>({
    queryKey: ["/api/work-locations"],
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { lat: number; lng: number; locationName: string }) => {
      return apiRequest<TimeEntry>("POST", "/api/time-entries/clock-in", {
        driverId: user?.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Clocked in successfully" });
      setClockAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clock in",
        description: error.message,
        variant: "destructive",
      });
      setClockAction(null);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: { lat: number; lng: number; locationName: string }) => {
      return apiRequest<TimeEntry>("POST", "/api/time-entries/clock-out", {
        driverId: user?.id,
        entryId: todayEntry?.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Clocked out successfully" });
      setClockAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clock out",
        description: error.message,
        variant: "destructive",
      });
      setClockAction(null);
    },
  });

  const findNearestWorkLocation = (lat: number, lng: number) => {
    let nearestLocation: WorkLocation | null = null;
    let minDistance = Infinity;

    for (const loc of workLocations) {
      const distance = calculateDistance({ lat, lng }, { lat: loc.lat, lng: loc.lng });
      if (distance < minDistance && distance <= loc.radiusMeters) {
        minDistance = distance;
        nearestLocation = loc;
      }
    }

    return { location: nearestLocation, distance: minDistance };
  };

  const handleClockAction = async (action: "in" | "out") => {
    setClockAction(action);
    const pos = await getCurrentPosition();

    if (!pos) {
      setShowLocationModal(true);
      setClockAction(null);
      return;
    }

    const { location: nearestLoc, distance } = findNearestWorkLocation(pos.lat, pos.lng);

    if (!nearestLoc) {
      const minRadius = Math.min(...workLocations.map(loc => loc.radiusMeters));
      toast({
        title: "Outside work area",
        description: `You must be within ${minRadius}m of a work location to clock ${action}. Current distance: ${Math.round(distance)}m`,
        variant: "destructive",
      });
      setClockAction(null);
      return;
    }

    if (action === "in") {
      clockInMutation.mutate({
        lat: pos.lat,
        lng: pos.lng,
        locationName: nearestLoc.name,
      });
    } else {
      clockOutMutation.mutate({
        lat: pos.lat,
        lng: pos.lng,
        locationName: nearestLoc.name,
      });
    }
  };

  const handleEnableLocation = async () => {
    const pos = await getCurrentPosition();
    setShowLocationModal(false);
    if (pos && clockAction) {
      handleClockAction(clockAction);
    }
  };

  const isClockedIn = todayEntry?.clockInTime && !todayEntry?.clockOutTime;
  const isClockedOut = todayEntry?.clockOutTime;
  const status = isClockedIn ? "clocked-in" : isClockedOut ? "clocked-out" : "not-started";

  const isLoading = entryLoading || geoLoading || clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <div className="space-y-6">
      <ClockStatusCard entry={todayEntry} status={status} />

      {workLocations.length === 0 && (
        <Card className="p-4 border-l-4 border-l-status-away bg-status-away/5">
          <div className="flex items-center gap-2 text-status-away">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">No work locations configured</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Contact your administrator to set up work locations for GPS verification.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {!isClockedIn && !isClockedOut && (
          <ClockButton
            type="in"
            onClick={() => handleClockAction("in")}
            isLoading={clockAction === "in" && isLoading}
            disabled={isLoading || workLocations.length === 0}
          />
        )}

        {isClockedIn && (
          <ClockButton
            type="out"
            onClick={() => handleClockAction("out")}
            isLoading={clockAction === "out" && isLoading}
            disabled={isLoading || workLocations.length === 0}
          />
        )}

        {isClockedOut && (
          <Card className="p-5 bg-muted/30 border-l-4 border-l-status-online">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-status-online" />
              <span className="text-[15px] font-medium text-foreground">
                Shift completed for today
              </span>
            </div>
          </Card>
        )}
      </div>

      {position && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Your Location</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        </Card>
      )}

      <LocationPermissionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onEnable={handleEnableLocation}
        isLoading={geoLoading}
      />
    </div>
  );
}
