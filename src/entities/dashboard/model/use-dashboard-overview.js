import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

export const DASHBOARD_PERIODS = {
  today: "Bugun",
  yesterday: "Kecha",
  last7: "Hafta",
  last30: "Oy",
};

const EMPTY_STATE = {
  stats: null,
  floors: null,
  growth: null,
  cashflow: null,
  manager: null,
  crm: null,
  sectionErrors: {},
};

function buildQuery(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

async function requestJson(path, signal) {
  const res = await apiRequest(path, { signal });
  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

export function useDashboardOverview({ projectId, period = "last30", role }) {
  const [data, setData] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const get = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) {
        setData(EMPTY_STATE);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const sharedQuery = buildQuery({ projectId, filter: period });
      const scopedQuery = buildQuery({ filter: period });
      const requests = [];

      if (role !== "SALESMANAGER") {
        requests.push(
          { key: "stats", path: `/api/v1/dashboard/stats?${sharedQuery}` },
          { key: "floors", path: `/api/v1/dashboard/floors?${sharedQuery}` },
          { key: "growth", path: `/api/v1/dashboard/growth?${sharedQuery}` },
          { key: "cashflow", path: `/api/v1/dashboard/cashflow?${sharedQuery}` },
        );
      }

      requests.push(
        {
          key: "manager",
          path: `/api/v1/dashboard/manager/${projectId}${scopedQuery ? `?${scopedQuery}` : ""}`,
        },
        {
          key: "crm",
          path: `/api/v1/dashboard/crm/leads/statistik/${projectId}${scopedQuery ? `?${scopedQuery}` : ""}`,
        },
      );

      const settled = await Promise.allSettled(
        requests.map((request) => requestJson(request.path, controller.signal)),
      );

      if (controller.signal.aborted) return;

      const next = {
        stats: null,
        floors: null,
        growth: null,
        cashflow: null,
        manager: null,
        crm: null,
        sectionErrors: {},
      };

      let successCount = 0;

      settled.forEach((result, index) => {
        const { key } = requests[index];

        if (result.status === "fulfilled" && result.value.ok) {
          next[key] = result.value.data;
          successCount += 1;
          return;
        }

        if (result.status === "fulfilled") {
          next.sectionErrors[key] =
            result.value.status === 403
              ? "Ruxsat yo'q"
              : `HTTP ${result.value.status}`;
        } else {
          next.sectionErrors[key] = "Yuklab bo'lmadi";
        }
      });

      setData(next);
      setError(successCount === 0 ? "Boshqaruv paneli ma'lumotlarini yuklab bo'lmadi." : null);

      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      setLoading(false);
      setRefreshing(false);
    },
    [period, projectId, role],
  );

  useEffect(() => {
    get();

    return () => controllerRef.current?.abort();
  }, [get]);

  return {
    ...data,
    loading,
    refreshing,
    error,
    get,
  };
}
