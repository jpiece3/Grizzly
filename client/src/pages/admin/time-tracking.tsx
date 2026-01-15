import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Clock, Download, Search, MapPin, Calendar } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import type { TimeEntry, User } from "@shared/schema";

export default function AdminTimeTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getDriverName = (driverId: string) => {
    const driver = users.find((u) => u.id === driverId);
    return driver?.name || "Unknown Driver";
  };

  const calculateHours = (entry: TimeEntry) => {
    if (!entry.clockInTime || !entry.clockOutTime) return null;
    const minutes = differenceInMinutes(new Date(entry.clockOutTime), new Date(entry.clockInTime));
    return (minutes / 60).toFixed(2);
  };

  const filteredEntries = timeEntries.filter((entry) => {
    const driverName = getDriverName(entry.driverId).toLowerCase();
    return driverName.includes(searchQuery.toLowerCase());
  });

  const handleExport = () => {
    const csvContent = [
      ["Driver Name", "Date", "Clock In Time", "Clock In Location", "Clock Out Time", "Clock Out Location", "Total Hours", "GPS Coordinates"].join(","),
      ...filteredEntries.map((entry) => [
        getDriverName(entry.driverId),
        entry.date,
        entry.clockInTime ? format(new Date(entry.clockInTime), "h:mm a") : "",
        entry.clockInLocationName || "",
        entry.clockOutTime ? format(new Date(entry.clockOutTime), "h:mm a") : "",
        entry.clockOutLocationName || "",
        calculateHours(entry) || "",
        entry.clockInLat && entry.clockInLng ? `${entry.clockInLat},${entry.clockInLng}` : "",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-tracking-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const todayEntries = filteredEntries.filter(
    (e) => e.date === format(new Date(), "yyyy-MM-dd")
  );

  const activeDrivers = todayEntries.filter(
    (e) => e.clockInTime && !e.clockOutTime
  ).length;

  return (
    <AdminLayout
      title="Time Tracking"
      subtitle={`${timeEntries.length} entries • ${activeDrivers} drivers clocked in`}
      actions={
        <Button onClick={handleExport} variant="outline" data-testid="button-export-time">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="p-5" data-testid="stat-today-entries">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayEntries.length}</p>
              <p className="text-sm text-muted-foreground">Today's Entries</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="stat-active-drivers">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-online/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-status-online" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeDrivers}</p>
              <p className="text-sm text-muted-foreground">Clocked In Now</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="stat-total-entries">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{timeEntries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by driver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-time"
            />
          </div>
        </div>

        {entriesLoading ? (
          <LoadingSpinner className="py-12" text="Loading time entries..." />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No time entries"
            description="Time entries will appear here when drivers clock in and out."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} data-testid={`time-entry-${entry.id}`}>
                    <TableCell className="font-medium">
                      {getDriverName(entry.driverId)}
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      {entry.clockInTime ? (
                        <div>
                          <p>{format(new Date(entry.clockInTime), "h:mm a")}</p>
                          {entry.clockInLocationName && (
                            <p className="text-xs text-muted-foreground">
                              {entry.clockInLocationName}
                            </p>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.clockOutTime ? (
                        <div>
                          <p>{format(new Date(entry.clockOutTime), "h:mm a")}</p>
                          {entry.clockOutLocationName && (
                            <p className="text-xs text-muted-foreground">
                              {entry.clockOutLocationName}
                            </p>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {calculateHours(entry) ? `${calculateHours(entry)}h` : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.clockInTime && !entry.clockOutTime ? (
                        <Badge className="bg-status-online/10 text-status-online">
                          Active
                        </Badge>
                      ) : entry.clockOutTime ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
