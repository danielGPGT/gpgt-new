import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
      />
      <div 
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-72"
        }`}
      >
        <Header showNavigation={false} sidebarCollapsed={sidebarCollapsed} onSidebarCollapseToggle={() => setSidebarCollapsed((c) => !c)} />
        <main className="bg-background text-[var(--foreground)]">
          {children}
        </main>
      </div>
    </div>
  );
} 