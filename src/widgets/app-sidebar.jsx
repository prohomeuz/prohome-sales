import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/shared/ui/sidebar";
import {
  BrickWall,
  Building2,
  FileText,
  Gauge,
  HomeIcon,
  LogOut,
  User,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppStore } from "@/entities/session/model";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const routes = {
  SUPERADMIN: [
    { url: "/dashboard", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/", text: "Boshqaruv paneli", icon: <Gauge /> },
    { url: "/company", text: "Kompaniyalar", icon: <Building2 /> },
    { url: "/admin", text: "Adminlar", icon: <User /> },
    { url: "/rop", text: "Roplar", icon: <User /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contract", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  ADMIN: [
    { url: "/dashboard", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/", text: "Boshqaruv paneli", icon: <Gauge /> },
    { url: "/company", text: "Kompaniyalar", icon: <Building2 /> },
    { url: "/rop", text: "Roplar", icon: <User /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contract", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  ROP: [
    { url: "/dashboard", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/", text: "Boshqaruv paneli", icon: <Gauge /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contract", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  SALESMANAGER: [
    { url: "/dashboard", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/", text: "Boshqaruv paneli", icon: <Gauge /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
};

export function AppSidebar({ ...props }) {
  const { user, setUser } = useAppStore();
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  function handleLogout() {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    setUser(null);
    navigate("/login", { replace: true });
    toast.info("Tizimdan chiqdingiz!");
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link className="inline-flex items-center gap-3 px-1 py-2" to={"/"}>
          <img
            className="inline-flex h-11 w-11 rounded-lg object-cover object-center"
            src="/logo.png"
            alt="Logo"
          />
          <strong className="text-base font-semibold">{user.role}</strong>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex h-full flex-col gap-0.5 p-2">
          {routes[user.role].map(({ url, text, icon }, index) => {
            return (
              <Link
                className={cn(
                  "relative h-11 w-full inline-flex items-center justify-start gap-3 rounded-lg px-3 text-[15px] font-medium transition-all duration-150 [&_svg]:size-5! outline-none",
                  url === currentPath
                    ? "bg-primary/10 text-primary [&_svg]:text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.75 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary [&_svg]:text-muted-foreground hover:[&_svg]:text-primary",
                )}
                key={index}
                to={url}
              >
                {icon}
                {text}
              </Link>
            );
          })}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-auto h-11 w-full text-[15px] [&_svg]:size-5!" variant="outline">
                <LogOut /> Chiqish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Rostan ham tizimni tark etmoqchimisiz?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tizimdan chiqsangiz, boshqa amalarni bajarish uchun yana
                  tizimga kirshingiz talab etiladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Yo'q</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Ha</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
