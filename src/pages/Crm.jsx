import { KanbanBoard } from "@/widgets/crm/KanbanBoard";

export default function Crm() {
  return (
    <section className="relative h-full w-full bg-background animate-fade-in">
      {/* Absolute inset-0 detaches the Kanban board from the flex flow of the main page, completely preventing any layout stretching or sidebar overlapping */}
      <div className="absolute inset-0">
        <KanbanBoard />
      </div>
    </section>
  );
}
