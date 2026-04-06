import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/widgets/app-sidebar";
import SidebarHeader from "@/widgets/sidebar-header";

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarHeader />
        <main className="flex-1 min-h-0 w-full overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
