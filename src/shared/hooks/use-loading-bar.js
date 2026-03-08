/**
 * Stable wrapper over react-top-loading-bar to avoid double start/complete
 * (StrictMode or rapid rerenders).
 */
import { useCallback, useEffect, useRef } from "react";
import { useLoadingBar } from "react-top-loading-bar";

let pendingStarts = 0;
const bars = new Set();
let activeBar = null;

export function useStableLoadingBar(options) {
  const bar = useLoadingBar({
    shadow: false,
    waitingTime: 500,
    transitionTime: 300,
    ...options,
  });
  const active = useRef(false);

  useEffect(() => {
    bars.add(bar);
    activeBar = bar;

    return () => {
      bars.delete(bar);
      if (activeBar === bar) {
        activeBar = Array.from(bars).at(-1) ?? null;
      }
    };
  }, [bar]);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    const controller = activeBar ?? bar;
    if (pendingStarts === 0) controller.start();
    pendingStarts += 1;
  }, [bar]);

  const complete = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    const controller = activeBar ?? bar;
    pendingStarts = Math.max(0, pendingStarts - 1);
    if (pendingStarts === 0) controller.complete();
  }, [bar]);

  useEffect(
    () => () => {
      if (!active.current) return;
      active.current = false;
      const controller = activeBar ?? bar;
      pendingStarts = Math.max(0, pendingStarts - 1);
      if (pendingStarts === 0) controller.complete();
    },
    [bar]
  );

  return { ...bar, start, complete };
}
