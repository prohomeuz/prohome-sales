/**
 * DATA layer: projects list (TJM).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("/api/v1/projects", {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        setError("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    } catch {
      setError("Tizimda nosozlik!");
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return { projects, error, loading, get };
}
