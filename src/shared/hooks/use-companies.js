/**
 * DATA layer: companies list.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("/api/v1/company/all", {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const { data } = await res.json();
        setCompanies(data ?? []);
      } else {
        setError("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      setError("Tizimda nosozlik!");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return { companies, error, loading, get };
}
