import { SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";
import { SidebarTrigger } from "@/shared/ui/sidebar";

export default function SidebarHeader() {
  return (
    <header className="bg-background sticky top-0 z-45 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <Link
        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
        to={"/settings"}
      >
        <SettingsIcon />
      </Link>
    </header>
  );
}
