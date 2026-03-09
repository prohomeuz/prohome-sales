/**
 * DATA layer: dashboard stats by period.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/shared/lib/api";

const PERIOD_MAP = { 1: "today", 2: "yesterday", 3: "last7", 4: "last30" };

export function useDashboardStats(periodIndex = 4, projectId = 1) {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    const filter = PERIOD_MAP[periodIndex] ?? "last30";
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(
        `/api/v1/dashboard/stats?projectId=${projectId}&filter=${filter}`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        setError("Xatolik yuz berdi qayta urunib ko'ring!");
        toast.error("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      setError("Tizimda nosozlik!");
      toast.error("Tizimda nosozlik!");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, [periodIndex, projectId]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return { sales, loading, error };
}
