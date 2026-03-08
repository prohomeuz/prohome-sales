import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useEffect, useRef, useState } from "react";

const Lead = memo(function Lead({ data, highlighted, onOpen }) {
  const [flash, setFlash] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!highlighted) return;
    timersRef.current.forEach(clearTimeout);
    // Double flash: on → off → on → off
    setFlash(true);
    timersRef.current = [
      setTimeout(() => setFlash(false), 420),
      setTimeout(() => setFlash(true),  700),
      setTimeout(() => setFlash(false), 1280),
    ];
    return () => timersRef.current.forEach(clearTimeout);
  }, [highlighted]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: data.id });

  return (
    <li
      id={`lead-${data.id}`}
      ref={setNodeRef}
      onDoubleClick={() => onOpen?.(data)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [
          transition ?? "transform 200ms cubic-bezier(0.25,1,0.5,1)",
          "background-color 320ms ease-out",
        ].join(", "),
        opacity: isDragging ? 0.4 : 1,
        touchAction: "none",
        backgroundColor: flash ? "rgb(251 191 36 / 0.4)" : undefined,
      }}
      className="bg-background w-full cursor-grab rounded border p-2 select-none hover:shadow-sm transition-shadow"
      {...attributes}
      {...listeners}
    >
      <h3 className="font-medium text-sm leading-tight">{data.title}</h3>
      {data.phone && (
        <p className="text-muted-foreground text-xs mt-0.5">{data.phone}</p>
      )}
      {data.budget != null && (
        <p className="text-xs font-medium mt-1" style={{ color: '#10b981' }}>
          ${data.budget.toLocaleString()}
        </p>
      )}
      {data.address && (
        <p className="text-muted-foreground text-xs truncate">{data.address}</p>
      )}
    </li>
  );
});

export default Lead;
