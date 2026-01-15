import { type ReactNode } from "react";
import { MobileNav } from "./mobile-nav";

interface DriverLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  headerAction?: ReactNode;
}

export function DriverLayout({
  children,
  title,
  subtitle,
  activeTab,
  onTabChange,
  headerAction,
}: DriverLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[15px] text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerAction}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">{children}</main>

      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
