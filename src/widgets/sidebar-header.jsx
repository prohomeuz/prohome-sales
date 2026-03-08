import { ArrowLeft, SettingsIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/shared/ui/button";
import { SidebarTrigger, useSidebar } from "@/shared/ui/sidebar";

const fullScreens = ["/crm"];

export default function SidebarHeader() {
  const { open, setOpen } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleSidebar() {
    setOpen(true);
    navigate("/");
  }

  useLayoutEffect(() => {
    if (fullScreens.includes(pathname)) {
      setOpen(false);
    }
  }, [pathname, setOpen]);

  return (
    <header className="bg-background sticky top-0 z-45 flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
      {fullScreens.includes(pathname) && open === false ? (
        <Button
          onClick={handleSidebar}
          className={"-ml-1 size-7"}
          variant="ghost"
        >
          <ArrowLeft />
        </Button>
      ) : (
        <SidebarTrigger className="-ml-1" />
      )}

      {fullScreens.includes(pathname) === false && (
        <Link
          className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
          to={"/settings"}
        >
          <SettingsIcon />
        </Link>
      )}
    </header>
  );
}
