import { SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { cn } from "@/shared/lib/utils";
import { MicVoiceButton } from "@/features/voice-control/ui/VoiceButton";

export default function SidebarHeader() {
  return (
    <header className="bg-background sticky top-0 z-45 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-5">
      <SidebarTrigger className="-ml-1" />

      <div className="flex items-center gap-1">
        <MicVoiceButton />
        <Link
          className={cn(buttonVariants({ variant: "ghost" }), "size-10 [&_svg]:size-7!")}
          to={"/settings"}
        >
          <SettingsIcon />
        </Link>
      </div>
    </header>
  );
}
