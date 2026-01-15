import { useState } from "react";
import { DriverLayout } from "@/components/layout/driver-layout";
import { DriverScheduleView } from "@/components/driver/schedule-view";
import { DriverClockView } from "@/components/driver/clock-view";
import { DriverProfileView } from "@/components/driver/profile-view";
import { useAuthContext } from "@/context/auth-context";

export default function DriverPage() {
  const [activeTab, setActiveTab] = useState("schedule");
  const { user } = useAuthContext();

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    schedule: { title: "Today's Schedule", subtitle: "Your assigned route" },
    clock: { title: "Time Clock", subtitle: "GPS-verified check in/out" },
    profile: { title: "Profile", subtitle: user?.name || "" },
  };

  const currentTab = tabTitles[activeTab] || tabTitles.schedule;

  return (
    <DriverLayout
      title={currentTab.title}
      subtitle={currentTab.subtitle}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "schedule" && <DriverScheduleView />}
      {activeTab === "clock" && <DriverClockView />}
      {activeTab === "profile" && <DriverProfileView />}
    </DriverLayout>
  );
}
