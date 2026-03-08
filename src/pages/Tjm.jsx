import { ArrowRight, Folder, FolderOpen } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LogoLoader from "@/widgets/loading/LogoLoader";
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

  if (loading) return <LogoLoader />;
  if (error) return <GeneralError />;

  return (
    <section className="animate-fade-in h-full p-5">
      {projects.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {projects.map(({ name, id }) => (
            <div
              key={id}
              role="button"
              tabIndex={0}
              className="hover:border-primary group flex cursor-pointer gap-3 rounded border-2 p-3 transition"
              onClick={() => handleClick(id)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(id)}
            >
              <Folder className="animate-fade-in group-hover:hidden" />
              <FolderOpen className="animate-fade-in hidden group-hover:inline-block" />
              <p>{name}</p>
              <ArrowRight className="animate-fade-in ml-auto hidden group-hover:inline-block" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyData text="Hozircha TJM mavjud emas!" />
      )}
    </section>
  );
}
