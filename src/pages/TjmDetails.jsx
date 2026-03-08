import { Search, XIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import GeneralError from "@/widgets/error/GeneralError";
import HomeDetails from "@/widgets/HomeDetails";
import LogoLoader from "@/widgets/loading/LogoLoader";
import { useProjectStructure } from "@/shared/hooks/use-project-structure";
import { formatNumber } from "@/shared/lib/utils";

const STATUS_CLASS = {
  SOLD: "bg-red-500",
  RESERVED: "bg-yellow-500",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const STATUS_LABEL = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

export default function TjmDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { structure: home, notFound, error, loading } = useProjectStructure(id);
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  const handleActiveHome = useCallback(
    (detailsId) => navigate(`?details=${detailsId}`),
    [navigate]
  );

  if (loading) return <LogoLoader />;
  if (error) return <GeneralError />;
  if (notFound)
    return (
      <div className="animate-fade-in flex h-full w-full items-center justify-center">
        <div className="tex-center flex w-full max-w-sm flex-col items-center">
          <h3 className="mb-3 text-2xl font-medium">404</h3>
          <p className="text-muted-foreground mb-5">
            Bunday turar joy majmuosi mavjud emas!
          </p>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            to="/tjm"
          >
            <Search /> Mavjud turar joylar
          </Link>
        </div>
      </div>
    );

  if (!home) return null;

  return (
    <section className="animate-fade-in flex h-full max-h-screen w-full flex-col">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className={`${buttonVariants({ size: "icon", variant: "secondary" })} absolute right-0 top-0 z-50 rounded-none border shadow`}
            to="/tjm"
          >
            <XIcon />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Orqaga qaytish</p>
        </TooltipContent>
      </Tooltip>

      <section className="h-full w-full">
        <div className="flex h-30 w-full flex-col">
          <div className="mt-auto flex items-center justify-between p-3">
            <div className="flex gap-3">
              {Object.entries(STATUS_CLASS).map(([key, value]) => (
                <Badge
                  key={key}
                  className={`text-primary-foreground ${value}`}
                >
                  {STATUS_LABEL[key]}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100%-120px)] w-full overflow-hidden">
          <div className="no-scrollbar h-full w-full overflow-auto">
            <div className="bg-background sticky top-0 z-10 mx-10 mb-10 flex min-w-max gap-20">
              {Object.keys(home.blocks ?? {}).map((b) => (
                <div
                  key={b}
                  className="text-muted-foreground bg-background sticky left-10 w-58 p-1 text-xs"
                >
                  <h3>{b}</h3>
                </div>
              ))}
            </div>
            <div className="flex min-w-max flex-col">
              {Array.from(
                { length: home.maxFloor ?? 0 },
                (_, index) => index + 1
              ).map((_, index, arr) => {
                const floorNum = arr.length - index;
                return (
                  <div
                    key={index}
                    className="hover:bg-accent group relative flex min-h-10 w-full cursor-pointer transition-colors"
                  >
                    <div className="text-muted-foreground bg-background group-hover:bg-primary sticky left-0 z-20 flex w-10 items-center justify-center text-center text-xs">
                      <span className="group-hover:text-primary-foreground transition-transform group-hover:scale-150 group-hover:font-bold">
                        {floorNum}
                      </span>
                    </div>

                    <div className="flex gap-20">
                      {Object.keys(home.blocks ?? {}).map((b) =>
                        floorNum <= (home.blocks[b]?.floor ?? 0) ? (
                          <div key={b} className="flex gap-2">
                            {(home.blocks[b]?.appartment?.[index] ?? []).map(
                              (h) => {
                                const detailsId = new URL(
                                  location.href
                                ).searchParams.get("details");
                                const isActive = String(h.id) === detailsId;
                                return (
                                  <Tooltip key={h.id}>
                                    <TooltipTrigger
                                      className="focus-within:outline-none"
                                      tabIndex={-1}
                                    >
                                      <div
                                        onClick={() => handleActiveHome(h.id)}
                                        className={`flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded border-5 border-transparent text-sm leading-none font-bold text-white transition-colors duration-400 ${STATUS_CLASS[h.status] ?? ""} ${isActive ? "border-destructive! shadow" : ""}`}
                                      >
                                        {h.room}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="pointer-events-none">
                                      <div className="flex flex-col">
                                        <div className="flex gap-1">
                                          <h4 className="font-bold">
                                            Uy raqami:
                                          </h4>
                                          <span className="font-mono">
                                            #{h.houseNumber}
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          <h4 className="font-bold">
                                            Narxi:
                                          </h4>
                                          <span className="font-mono">
                                            {formatNumber(h.price * h.size)}
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          <h4 className="font-bold">
                                            m<sup>2</sup>:
                                          </h4>
                                          <span className="font-mono">
                                            {formatNumber(h.price)}
                                          </span>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                            )}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div className="text-muted-foreground bg-background group-hover:bg-primary sticky right-0 z-20 ml-auto flex w-10 items-center justify-center text-center text-xs">
                      <span className="group-hover:text-primary-foreground transition-transform group-hover:scale-150 group-hover:font-bold">
                        {floorNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <HomeDetails />
        </div>
      </section>
    </section>
  );
}
