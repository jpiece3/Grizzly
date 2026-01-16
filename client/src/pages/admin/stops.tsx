import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { CSVUpload } from "@/components/upload/csv-upload";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Upload, Trash2, Search } from "lucide-react";
import type { Location } from "@shared/schema";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon", fullLabel: "Monday" },
  { value: "tuesday", label: "Tue", fullLabel: "Tuesday" },
  { value: "wednesday", label: "Wed", fullLabel: "Wednesday" },
  { value: "thursday", label: "Thu", fullLabel: "Thursday" },
  { value: "friday", label: "Fri", fullLabel: "Friday" },
  { value: "saturday", label: "Sat", fullLabel: "Saturday" },
  { value: "sunday", label: "Sun", fullLabel: "Sunday" },
];

export default function AdminStopsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
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
      setShowUpload(false);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "CSV uploaded successfully" });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      setUploadSuccess(false);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, daysOfWeek }: { id: string; daysOfWeek: string[] }) => {
      return apiRequest<Location>("PATCH", `/api/locations/${id}`, { daysOfWeek });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update location",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete location",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDayToggle = (location: Location, day: string) => {
    const currentDays = location.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    
    updateLocationMutation.mutate({ id: location.id, daysOfWeek: newDays });
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const locationsWithDays = locations.filter((loc) => (loc.daysOfWeek?.length || 0) > 0);
  const locationsWithoutDays = locations.filter((loc) => !(loc.daysOfWeek?.length));

  return (
    <AdminLayout
      title="Delivery Stops"
      subtitle={`${locations.length} stops uploaded, ${locationsWithDays.length} scheduled`}
      actions={
        <Button onClick={() => setShowUpload(!showUpload)} data-testid="button-upload-csv">
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      }
    >
      {showUpload && (
        <Card className="p-6 mb-6">
          <CSVUpload
            onUpload={(file) => uploadMutation.mutate(file)}
            isLoading={uploadMutation.isPending}
            error={uploadError}
            success={uploadSuccess}
          />
        </Card>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-stops"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            {locationsWithDays.length} scheduled
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {locationsWithoutDays.length} unscheduled
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" text="Loading stops..." />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No delivery stops"
          description="Upload a CSV file with delivery addresses to get started."
          action={
            <Button onClick={() => setShowUpload(true)} data-testid="button-first-upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-center">Schedule Days</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id} data-testid={`stop-row-${location.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{location.customerName}</p>
                      {location.serviceType && (
                        <p className="text-xs text-muted-foreground">{location.serviceType}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = location.daysOfWeek?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            onClick={() => handleDayToggle(location, day.value)}
                            className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            data-testid={`day-toggle-${location.id}-${day.value}`}
                            title={day.fullLabel}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLocationMutation.mutate(location.id)}
                      data-testid={`button-delete-stop-${location.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
}
