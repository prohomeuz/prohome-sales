/**
 * @file DATA layer: companies list with pagination.
 * @module entities/company/model/use-companies
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

const DEFAULT_LIMIT = 10;

/**
 * Kompaniyalar ro'yxatini pagination bilan yuklaydi.
 * @param {{ page?: number, limit?: number, search?: string }} params
 */
export function useCompanies({ page = 1, limit = DEFAULT_LIMIT, search = "" } = {}) {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
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
      const params = new URLSearchParams({ limit, page });
      if (search.trim()) params.set("companyName", search.trim());
      const res = await apiRequest(`/api/v1/company/all?${params}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const json = await res.json();
        setCompanies(json.data ?? []);
        setTotal(
          typeof json.pagination?.total === "number"
            ? json.pagination.total
            : typeof json.total === "number"
              ? json.total
              : typeof json.totalCount === "number"
                ? json.totalCount
                : (json.data?.length ?? 0)
        );
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
  }, [page, limit, search]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { companies, total, totalPages, error, loading, get };
}
