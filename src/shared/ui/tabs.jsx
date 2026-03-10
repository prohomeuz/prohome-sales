import * as React from "react";
import { cn } from "@/shared/lib/utils";

const TabsContext = React.createContext(null);

function Tabs({ className, value, onValueChange, ...props }) {
  const contextValue = React.useMemo(
    () => ({ value, onValueChange }),
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "bg-muted inline-flex h-auto w-fit flex-wrap items-center gap-1 rounded-xl p-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === props.value;

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm",
        className,
      )}
      onClick={() => context?.onValueChange?.(props.value)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  const context = React.useContext(TabsContext);
  if (context?.value !== props.value) return null;

  return (
    <div
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
