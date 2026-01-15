// App constants
export const APP_NAME = "Grizzly Mats";
export const GEOFENCE_RADIUS_METERS = 100;

// Route status labels
export const ROUTE_STATUS = {
  draft: "Draft",
  assigned: "Assigned",
  published: "Published",
} as const;

// Role labels
export const USER_ROLES = {
  admin: "Admin",
  driver: "Driver",
} as const;

// Tab navigation items for driver mobile view
export const DRIVER_NAV_ITEMS = [
  { id: "schedule", label: "Schedule", icon: "calendar" },
  { id: "clock", label: "Time Clock", icon: "clock" },
  { id: "profile", label: "Profile", icon: "user" },
] as const;

// Admin sidebar navigation items
export const ADMIN_NAV_ITEMS = [
  { id: "routes", label: "Routes", icon: "map", href: "/admin" },
  { id: "drivers", label: "Drivers", icon: "users", href: "/admin/drivers" },
  { id: "time-tracking", label: "Time Tracking", icon: "clock", href: "/admin/time-tracking" },
  { id: "locations", label: "Work Locations", icon: "map-pin", href: "/admin/locations" },
] as const;
