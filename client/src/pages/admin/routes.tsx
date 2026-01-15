import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { CSVUpload } from "@/components/upload/csv-upload";
import { RouteCard } from "@/components/routes/route-card";
import { GenerateRoutesDialog } from "@/components/routes/generate-routes-dialog";
import { DriverAssignDialog } from "@/components/routes/driver-assign-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Map, Plus, Upload, RefreshCw, Download } from "lucide-react";
import type { Route, Location, User } from "@shared/schema";

export default function AdminRoutesPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/locations/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      setUploadSuccess(true);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "CSV uploaded successfully" });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      setUploadSuccess(false);
    },
  });

  const generateRoutesMutation = useMutation({
    mutationFn: async (driverCount: number) => {
      return apiRequest<Route[]>("POST", "/api/routes/generate", { driverCount });
    },
    onSuccess: () => {
      setShowGenerateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Routes generated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate routes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({
      routeId,
      driverId,
      driverName,
    }: {
      routeId: string;
      driverId: string;
      driverName: string;
    }) => {
      return apiRequest<Route>("PATCH", `/api/routes/${routeId}/assign`, {
        driverId,
        driverName,
      });
    },
    onSuccess: () => {
      setShowAssignDialog(false);
      setSelectedRoute(null);
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Driver assigned successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishRoutesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/routes/publish");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Routes published successfully" });
    },
  });

  const handleUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    uploadMutation.mutate(file);
  };

  const handleAssign = (route: Route) => {
    setSelectedRoute(route);
    setShowAssignDialog(true);
  };

  const draftRoutes = routes.filter((r) => r.status === "draft");
  const assignedRoutes = routes.filter((r) => r.status === "assigned");
  const publishedRoutes = routes.filter((r) => r.status === "published");

  const isLoading = routesLoading || locationsLoading;

  return (
    <AdminLayout
      title="Route Management"
      subtitle={`${locations.length} locations • ${routes.length} routes`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUpload(!showUpload)}
            data-testid="button-toggle-upload"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            disabled={locations.length === 0}
            data-testid="button-generate-routes"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Routes
          </Button>
        </div>
      }
    >
      {showUpload && (
        <Card className="p-6 mb-6" data-testid="csv-upload-section">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Upload Delivery Locations
          </h3>
          <CSVUpload
            onUpload={handleUpload}
            isLoading={uploadMutation.isPending}
            error={uploadError}
            success={uploadSuccess}
          />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-16" text="Loading routes..." />
      ) : routes.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No routes yet"
          description="Upload a CSV file with delivery locations, then generate optimized routes for your drivers."
          action={
            <Button onClick={() => setShowUpload(true)} data-testid="button-first-upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Locations
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-routes">
                All ({routes.length})
              </TabsTrigger>
              <TabsTrigger value="draft" data-testid="tab-draft-routes">
                Draft ({draftRoutes.length})
              </TabsTrigger>
              <TabsTrigger value="assigned" data-testid="tab-assigned-routes">
                Assigned ({assignedRoutes.length})
              </TabsTrigger>
              <TabsTrigger value="published" data-testid="tab-published-routes">
                Published ({publishedRoutes.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {assignedRoutes.length > 0 && (
                <Button
                  onClick={() => publishRoutesMutation.mutate()}
                  disabled={publishRoutesMutation.isPending}
                  data-testid="button-publish-routes"
                >
                  Publish All Routes
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="all">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onAssign={() => handleAssign(route)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="draft">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {draftRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onAssign={() => handleAssign(route)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assigned">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="published">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publishedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <GenerateRoutesDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        locationCount={locations.length}
        onGenerate={(count) => generateRoutesMutation.mutate(count)}
        isLoading={generateRoutesMutation.isPending}
      />

      <DriverAssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        route={selectedRoute}
        drivers={drivers}
        onAssign={(routeId, driverId, driverName) =>
          assignDriverMutation.mutate({ routeId, driverId, driverName })
        }
        isLoading={assignDriverMutation.isPending}
      />
    </AdminLayout>
  );
}
