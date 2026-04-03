import * as React from "react";
import { cn } from "@/shared/lib/utils";

const TabsContext = React.createContext(null);

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const resolvedValue = isControlled ? value : internalValue;
  const handleValueChange = React.useCallback(
    (nextValue) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const contextValue = React.useMemo(
    () => ({ value: resolvedValue, onValueChange: handleValueChange }),
    [handleValueChange, resolvedValue],
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
        "inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
      )}
      onClick={() => context?.onValueChange?.(props.value)}
      {...props}
    />
  );
}

function TabsContent({ className, forceMount = false, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === props.value;
  if (!isActive && !forceMount) return null;

  return (
    <div
      data-slot="tabs-content"
      data-state={isActive ? "active" : "inactive"}
      className={cn("outline-none", !isActive && "hidden", className)}
      aria-hidden={!isActive}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
