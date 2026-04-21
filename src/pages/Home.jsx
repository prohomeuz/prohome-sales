import { ArrowRight, Folder, FolderOpen, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import LoadTransition from "@/widgets/loading/LoadTransition";
import { useProjects } from "@/shared/hooks/use-projects";
import { useAppStore } from "@/entities/session/model";
import AddTjmModal from "@/features/tjm/ui/AddTjmModal";

const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN"]);

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const isAdmin = ADMIN_ROLES.has(user?.role);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { projects, error, loading, get: refreshProjects } = useProjects();
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  const handleClick = useCallback(
    (id) => navigate(`/tjm/${id}?manage=1`),
    [navigate]
  );

  return (
    <LoadTransition
      loading={loading}
      className="h-full"
      loader={<LogoLoader title="TJM yuklanmoqda" description="Loyihalar ro'yxati tayyorlanmoqda." />}
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <section className="animate-fade-in h-full overflow-y-auto p-4 sm:p-5 lg:p-6">
          <header className="mb-6 flex items-center justify-between rounded-3xl border border-border/40 px-6 py-4 bg-card">
            <h1 className="text-xl font-bold text-foreground">Turar joy majmualari</h1>
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted/80 border border-border"
              >
                <Plus className="size-4" />
                Qo&apos;shish
              </button>
            )}
          </header>

          {isAdmin && (
            <AddTjmModal
              open={isAddModalOpen}
              onOpenChange={setIsAddModalOpen}
              onSuccess={refreshProjects}
            />
          )}

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map(({ name, id }) => (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/20"
                  onClick={() => handleClick(id)}
                  onKeyDown={(e) => e.key === "Enter" && handleClick(id)}
                >
                  <div className="relative size-5 shrink-0">
                    <Folder className="absolute inset-0 size-5 transition-opacity duration-200 group-hover:opacity-0" />
                    <FolderOpen className="absolute inset-0 size-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </div>
                  <p className="min-w-0 flex-1 truncate">{name}</p>
                  <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyData text="Hozircha TJM mavjud emas!" />
          )}
        </section>
      )}
    </LoadTransition>
  );
}
