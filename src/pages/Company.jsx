import { ArrowRight, CircleCheck, CircleXIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import LoadTransition from "@/widgets/loading/LoadTransition";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { useCompanies } from "@/entities/company/model/use-companies";
import { apiUrl } from "@/shared/lib/api";

const LIMIT = 10;

export default function Company() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { companies, totalPages, error, loading } = useCompanies({ page, limit: LIMIT });
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  return (
    <LoadTransition
      loading={loading && page === 1}
      className="h-full"
      loader={<LogoLoader title="Kompaniyalar yuklanmoqda" description="Hamkor kompaniyalar ro'yxati tayyorlanmoqda." />}
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <section className="animate-fade-in flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
          <header className="bg-primary/2 mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
            <>
              <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-1 place-content-start items-start gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-2">
                {companies.map(({ id, name, logo, status }) => (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/20"
                    onClick={() => navigate(`/company/${id}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/company/${id}`)}
                  >
                    <Avatar className="size-14 overflow-visible sm:size-16">
                      <AvatarImage
                        className="rounded-full object-cover"
                        src={logo ? apiUrl(logo) : undefined}
                        alt={name}
                      />
                      <AvatarFallback className="uppercase">{name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5">
                        <h2 className="truncate text-base font-semibold tracking-[-0.02em] sm:text-lg">
                          {name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              status
                                ? "border-primary/20 bg-primary/6 text-primary hover:bg-primary/6"
                                : "border-destructive/20 bg-destructive/6 text-destructive hover:bg-destructive/6"
                            }
                          >
                            <span className="relative mr-0.5 flex size-2.5">
                              {status && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
                              )}
                              <span
                                className={`relative inline-flex size-2.5 rounded-full ${
                                  status ? "bg-primary" : "bg-destructive"
                                }`}
                              />
                            </span>
                            {status ? <CircleCheck /> : <CircleXIcon />}
                            {status ? "Faol" : "To'xtagan"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {status ? "Ishonchli hamkor" : "Vaqtincha faol emas"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 shrink-0">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => !loading && page > 1 && setPage((p) => p - 1)}
                          aria-disabled={page <= 1 || loading}
                          className={page <= 1 || loading ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + idx);
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p) =>
                          typeof p === "string" ? (
                            <PaginationItem key={p}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={p === page}
                                onClick={() => !loading && setPage(p)}
                                className={loading ? "pointer-events-none opacity-50" : ""}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => !loading && page < totalPages && setPage((p) => p + 1)}
                          aria-disabled={page >= totalPages || loading}
                          className={page >= totalPages || loading ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            !loading && <EmptyData text="Hozircha hech qanday kompaniya mavjud emas!" />
          )}
        </section>
      )}
    </LoadTransition>
  );
}
