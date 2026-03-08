import { Home } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { buttonVariants } from "@/shared/ui/button";

export default function NotFound({ user }) {
  if (user) {
    return (
      <div className="animate-fade-in flex h-full w-full items-center justify-center">
        <div className="tex-center flex w-full max-w-sm flex-col items-center">
          <h3 className="mb-3 text-2xl font-medium">404</h3>
          <p className="text-muted-foreground mb-5">
            Bunday sahifa mavjud emas!
          </p>
          <Link className={buttonVariants({ variant: "secondary" })} to={"/"}>
            <Home /> Bosh sahihaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return <Navigate to={"/login"} />;
}
