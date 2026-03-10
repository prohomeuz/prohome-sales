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
import { Button, buttonVariants } from "@/shared/ui/button";

const routes = {
  SUPERADMIN: [
    { url: "/", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/dashboard", text: "Dashboard", icon: <Gauge /> },
    { url: "/company", text: "Kompaniyalar", icon: <Building2 /> },
    { url: "/admin", text: "Adminlar", icon: <User /> },
    { url: "/rop", text: "Roplar", icon: <User /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contracts", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  ADMIN: [
    { url: "/", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/dashboard", text: "Dashboard", icon: <Gauge /> },
    { url: "/company", text: "Kompaniyalar", icon: <Building2 /> },
    { url: "/rop", text: "Roplar", icon: <User /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contracts", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  ROP: [
    { url: "/", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/dashboard", text: "Dashboard", icon: <Gauge /> },
    { url: "/salesmanager", text: "Sotuv menejerlari", icon: <User /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/contracts", text: "Shartnomalar", icon: <FileText /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
  SALESMANAGER: [
    { url: "/", text: "Bosh sahifa", icon: <HomeIcon /> },
    { url: "/tjm", text: "TJM", icon: <BrickWall /> },
    { url: "/crm", text: "CRM", icon: <UsersRound /> },
  ],
};

export function AppSidebar({ ...props }) {
  const { user, setUser } = useAppStore();
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  function handleLogout() {
    setUser(null);
    navigate("/login", { replace: true });
    toast.info("Tizimdan chiqdingiz!");
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link className="inline-flex items-center gap-3" to={"/"}>
          <img
            className="inline-flex h-10 w-10 rounded object-cover object-center"
            src="/logo.png"
            alt="Logo"
          />
          <strong className="font-medium">{user.role}</strong>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex h-full flex-col p-2">
          {routes[user.role].map(({ url, text, icon }, index) => {
            return (
              <Link
                className={`${buttonVariants({
                  variant: "ghost",
                })} justify-start ${
                  url === currentPath
                    ? "bg-accent text-accent-foreground dark:bg-accent/50"
                    : ""
                }`}
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
              <Button className="mt-auto w-full" variant="outline">
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
