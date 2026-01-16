import { Link, useLocation } from "wouter";
import { Map, Users, Clock, MapPin, LogOut, Package, Calendar, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "stops", label: "Delivery Stops", Icon: Package, href: "/admin/stops" },
  { id: "confirm-route", label: "Confirm Route", Icon: ClipboardCheck, href: "/admin/confirm-route" },
  { id: "routes", label: "Routes", Icon: Map, href: "/admin" },
  { id: "calendar", label: "Calendar", Icon: Calendar, href: "/admin/calendar" },
  { id: "drivers", label: "Drivers", Icon: Users, href: "/admin/drivers" },
  { id: "time-tracking", label: "Time Tracking", Icon: Clock, href: "/admin/time-tracking" },
  { id: "locations", label: "Work Locations", Icon: MapPin, href: "/admin/locations" },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthContext();

  return (
    <aside className="w-[280px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
          Grizzly Mats
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Driver Management</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map(({ id, label, Icon, href }) => {
            const isActive = location === href || (href !== "/admin" && location.startsWith(href));
            const isExactMatch = location === href;
            const shouldHighlight = href === "/admin" ? isExactMatch : isActive;

            return (
              <Link
                key={id}
                href={href}
                data-testid={`sidebar-nav-${id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all",
                  shouldHighlight
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover-elevate"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 text-muted-foreground"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
