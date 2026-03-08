/**
 * DATA layer: dashboard cashflow.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/shared/lib/api";

export function useCashflow(projectId = 1) {
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/api/v1/dashboard/cashflow?projectId=${projectId}`,
        { signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        setCashflow(data);
      } else {
        toast.error("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    } catch {
      toast.error("Tizimda nosozlik!");
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return { cashflow, loading };
}
