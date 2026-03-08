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
        <main className="h-full w-full overflow-x-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
