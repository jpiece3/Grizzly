import { useAuthContext } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, LogOut, Shield } from "lucide-react";

export function DriverProfileView() {
  const { user, logout } = useAuthContext();

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {user?.name?.charAt(0) || "D"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user?.name || "Driver"}</h2>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <User className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-[15px] font-medium text-foreground">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-border">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-[15px] font-medium text-foreground">
                {user?.phone || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-[15px] font-medium text-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </Card>

      <Button
        variant="outline"
        onClick={logout}
        className="w-full h-14 rounded-xl text-[15px] font-medium gap-2"
        data-testid="button-logout-driver"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        RouteSimply v1.0
      </p>
    </div>
  );
}
