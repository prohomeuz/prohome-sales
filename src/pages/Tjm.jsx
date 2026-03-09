import { ArrowRight, Folder, FolderOpen } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
import LoadTransition from "@/widgets/loading/LoadTransition";
import { useProjects } from "@/shared/hooks/use-projects";

export default function Tjm() {
  const navigate = useNavigate();
  const { projects, error, loading } = useProjects();
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  const handleClick = useCallback(
    (id) => navigate(`/tjm/${id}`),
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
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map(({ name, id }) => (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  className="hover:border-primary group flex cursor-pointer items-center gap-3 rounded-[22px] border-2 bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                  onClick={() => handleClick(id)}
                  onKeyDown={(e) => e.key === "Enter" && handleClick(id)}
                >
                  <Folder className="animate-fade-in group-hover:hidden" />
                  <FolderOpen className="animate-fade-in hidden group-hover:inline-block" />
                  <p className="min-w-0 flex-1 truncate">{name}</p>
                  <ArrowRight className="animate-fade-in ml-auto hidden group-hover:inline-block" />
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
