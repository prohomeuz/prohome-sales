import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

export default function LoadTransition({
  loading,
  loader,
  children,
  className,
  contentClassName,
  loaderClassName,
  hideContentWhileLoading = false,
  minDuration = 320,
  transitionDuration = 280,
}) {
  const [renderLoader, setRenderLoader] = useState(Boolean(loading));
  const [loaderVisible, setLoaderVisible] = useState(Boolean(loading));
  const [renderContent, setRenderContent] = useState(Boolean(!loading && children));
  const [contentVisible, setContentVisible] = useState(Boolean(!loading && children));
  const loadStartedAtRef = useRef(loading ? Date.now() : 0);
  const settleTimerRef = useRef();
  const exitTimerRef = useRef();
  const frameRef = useRef();

  const hasContent = Boolean(children);

  useEffect(() => {
    return () => {
      window.clearTimeout(settleTimerRef.current);
      window.clearTimeout(exitTimerRef.current);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(settleTimerRef.current);
    window.clearTimeout(exitTimerRef.current);
    window.cancelAnimationFrame(frameRef.current);

    if (loading) {
      loadStartedAtRef.current = Date.now();
      setRenderLoader(true);
      if (hideContentWhileLoading && hasContent) {
        setRenderContent(true);
        setContentVisible(false);
      }
      frameRef.current = window.requestAnimationFrame(() => {
        setLoaderVisible(true);
      });
      return undefined;
    }

    if (!hasContent) {
      setLoaderVisible(false);
      exitTimerRef.current = window.setTimeout(() => {
        setRenderLoader(false);
      }, transitionDuration);
      return undefined;
    }

    const elapsed = loadStartedAtRef.current
      ? Date.now() - loadStartedAtRef.current
      : minDuration;
    const remaining = Math.max(0, minDuration - elapsed);

    settleTimerRef.current = window.setTimeout(() => {
      setRenderContent(true);
      frameRef.current = window.requestAnimationFrame(() => {
        setContentVisible(true);
        setLoaderVisible(false);
      });

      exitTimerRef.current = window.setTimeout(() => {
        setRenderLoader(false);
      }, transitionDuration);
    }, remaining);

    return undefined;
  }, [loading, hasContent, minDuration, transitionDuration]);

  useEffect(() => {
    if (!loading && hasContent) {
      setRenderContent(true);
      frameRef.current = window.requestAnimationFrame(() => {
        setContentVisible(true);
      });
    } else if (!hasContent) {
      setRenderContent(false);
      setContentVisible(false);
    }
  }, [loading, hasContent]);

  return (
    <div className={cn("relative", className)}>
      {renderContent && (
        <div
          className={cn(
            "transition-[opacity,transform,filter] ease-out",
            contentVisible
              ? "translate-y-0 scale-100 opacity-100 blur-0"
              : "translate-y-2 scale-[0.99] opacity-0 blur-[2px]",
            contentClassName,
          )}
          style={{ transitionDuration: `${transitionDuration}ms` }}
        >
          {children}
        </div>
      )}

      {renderLoader && (
        <div
          className={cn(
            "absolute inset-0 z-20 transition-[opacity,transform,filter] ease-out",
            loaderVisible
              ? "translate-y-0 scale-100 opacity-100 blur-0"
              : "-translate-y-1 scale-[0.985] opacity-0 blur-[2px] pointer-events-none",
            loaderClassName,
          )}
          style={{ transitionDuration: `${transitionDuration}ms` }}
        >
          {loader}
        </div>
      )}
    </div>
  );
}
