import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileSidebar } from "./MobileSidebar";
import { SidebarProvider } from "./SidebarContext";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden pb-16 md:pb-0">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
            <div className="mx-auto max-w-7xl pb-8 md:pb-0">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </SidebarProvider>
  );
}
