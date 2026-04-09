/**
 * @file DATA layer: projects list (TJM).
 * @module entities/project/model/use-projects
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unwrapProjectsPayload(payload) {
  let current = payload;
  const keys = [
    "data",
    "items",
    "results",
    "result",
    "rows",
    "list",
    "payload",
    "projects",
  ];

  for (let i = 0; i < 5; i += 1) {
    if (Array.isArray(current)) return current;
    if (!isObject(current)) return [];

    const nextKey = keys.find((key) => {
      const candidate = current[key];
      return Array.isArray(candidate) || isObject(candidate);
    });

    if (!nextKey) {
      return typeof current.id !== "undefined" ? [current] : [];
    }

    current = current[nextKey];
  }

  if (Array.isArray(current)) return current;
  return isObject(current) && typeof current.id !== "undefined"
    ? [current]
    : [];
}

function normalizeProjects(payload) {
  return unwrapProjectsPayload(payload).filter(
    (project) => isObject(project) && typeof project.id !== "undefined",
  );
}

/**
 * Barcha loyihalar ro'yxatini yuklaydi.
 * @returns {{ projects: object[], error: string|null, loading: boolean, get: Function }}
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
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
      const res = await apiRequest("/api/v1/projects", {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setProjects(normalizeProjects(data));
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

  return { projects, error, loading, get };
}
