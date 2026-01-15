import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/context/auth-context";
import { RouteStopItem } from "@/components/routes/route-stop-item";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Clock, ExternalLink } from "lucide-react";
import type { Route, RouteStop } from "@shared/schema";

export function DriverScheduleView() {
  const { user } = useAuthContext();

  const { data: routes = [], isLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes", "driver", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/routes?driverId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch routes");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const todayRoute = routes.find((r) => r.status === "published" || r.status === "assigned");
  const stops = (todayRoute?.stopsJson || []) as RouteStop[];

  if (isLoading) {
    return <LoadingSpinner className="py-16" text="Loading your schedule..." />;
  }

  if (!todayRoute || stops.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No route assigned"
        description="You don't have a route assigned for today. Check back later or contact your administrator."
      />
    );
  }

  return (
    <div className="space-y-4">
      {todayRoute.routeLink && (
        <Button
          asChild
          className="w-full h-14 rounded-xl text-[17px] font-semibold gap-2"
        >
          <a
            href={todayRoute.routeLink}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-open-maps"
          >
            <Navigation className="w-5 h-5" />
            Open Route in Google Maps
            <ExternalLink className="w-4 h-4 ml-auto" />
          </a>
        </Button>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {stops.length} stops
            </span>
          </div>
          {todayRoute.estimatedTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                ~{Math.round(todayRoute.estimatedTime)} min
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {stops.map((stop, index) => (
            <RouteStopItem key={stop.id} stop={stop} index={index} />
          ))}
        </div>
      </Card>
    </div>
  );
}
