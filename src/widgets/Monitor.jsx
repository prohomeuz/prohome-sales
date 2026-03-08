import { useDragDropMonitor } from "@dnd-kit/react";

export default function Monitor() {
  useDragDropMonitor({
    onDragStart(event, manager) {
      console.log("Started dragging", event.operation.source);
    },
    onDragEnd(event, manager) {
      const { operation, canceled } = event;

      if (canceled) {
        console.log("Drag cancelled");
        return;
      }

      if (operation.target) {
        console.log(operation.source);

        console.log(
          `Dropped ${operation.source.id} onto ${operation.target.id}`,
        );
      }
    },
  });

  return null;
}
