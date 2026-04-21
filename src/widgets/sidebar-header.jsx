import { SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { MicVoiceButton } from "@/features/voice-control/ui/VoiceButton";

export default function SidebarHeader() {
  return (
    <header className="bg-background sticky top-0 z-45 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex items-center gap-1">
        <MicVoiceButton />
        <Link
          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
          to={"/settings"}
        >
          <SettingsIcon />
        </Link>
      </div>
    </header>
  );
}
