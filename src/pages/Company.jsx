import { ArrowRight, CircleCheck, CircleXIcon, Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useCompanies } from "@/shared/hooks/use-companies";
import { apiUrl } from "@/shared/lib/api";

export default function Company() {
  const navigate = useNavigate();
  const { companies, error, loading, get } = useCompanies();
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  if (loading) return <LogoLoader />;
  if (error) return <GeneralError />;

  return (
    <section className="animate-fade-in h-full p-5">
      <header className="bg-primary/2 mb-10 flex items-center justify-between rounded border p-3">
        <h2 className="text-2xl font-bold">Kompaniyalar</h2>
        <Button
          onClick={() => navigate("/add/company")}
          variant="secondary"
          disabled={loading}
          size="sm"
        >
          <Plus />
          Qo&apos;shish
        </Button>
      </header>

      {companies.length > 0 ? (
        <div className="grid h-[40vh] grid-cols-2 place-content-start items-start gap-5 overflow-y-auto p-5">
          {companies.map(({ id, name, logo, status }) => (
            <div
              key={id}
              role="button"
              tabIndex={0}
              className="group relative flex cursor-pointer items-center gap-5 rounded-sm p-4 text-center shadow"
              onClick={() => navigate(`/company/${id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/company/${id}`)}
            >
              <Avatar className="shadow">
                <AvatarImage
                  src={logo ? apiUrl(logo) : undefined}
                  alt={name}
                />
                <AvatarFallback className="uppercase">{name?.[0]}</AvatarFallback>
              </Avatar>
              <h2>{name}</h2>
              <Badge
                className={`absolute right-5 top-0 -translate-y-2/4 ${status === false ? "bg-background" : ""}`}
                variant={status ? "default" : "outline"}
              >
                {status ? (
                  <>
                    <CircleCheck /> Faol
                  </>
                ) : (
                  <>
                    <CircleXIcon /> To&apos;xtagan
                  </>
                )}
              </Badge>
              <ArrowRight className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyData text="Hozircha hech qanday kompaniya mavjud emas!" />
      )}
    </section>
  );
}
