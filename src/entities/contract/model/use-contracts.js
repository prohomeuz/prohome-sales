/**
 * @file DATA layer: contracts list by project with filters & pagination.
 * @module entities/contract/model/use-contracts
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import { apiRequest } from "@/shared/lib/api";

/** @type {{ contracts: object[], total: number, statistics: object|null, error: string|null, loading: boolean }} */
const INITIAL_STATE = {
  contracts: [],
  total: 0,
  statistics: null,
  error: null,
  loading: true,
};

function contractsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        contracts: action.payload.contracts,
        total: action.payload.total,
        statistics: action.payload.statistics,
        error: null,
        loading: false,
      };
    case "FETCH_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

function normalizeResponse(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.contracts)
        ? payload.contracts
        : [];

  const total =
    typeof payload?.pagination?.total === "number"
      ? payload.pagination.total
      : typeof payload?.total === "number"
        ? payload.total
        : list.length;

  return { contracts: list, total, statistics: payload?.statistics ?? null };
}

/**
 * @typedef {Object} ContractFilters
 * @property {string} [search]
 * @property {string} [status]          - PENDING | SUCCESS | CANCELED
 * @property {string} [from]            - ISO date
 * @property {string} [to]              - ISO date
 * @property {string} [contractNumber]
 * @property {number} [minDownPayment]
 * @property {number} [maxDownPayment]
 * @property {number} [page]
 * @property {number} [limit]
 */

/**
 * @param {string|number} projectId
 * @param {ContractFilters} [filters]
 */
export function useContracts(projectId, filters = {}) {
  const [state, dispatch] = useReducer(contractsReducer, INITIAL_STATE);
  const controllerRef = useRef(null);

  // Har bir filter o'zgarganda get qayta yaratiladi → useEffect qayta ishlaydi
  const get = useCallback(async () => {
    if (!projectId) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "FETCH_START" });

    try {
      const params = new URLSearchParams();

      if (filters.search)                params.set("search", filters.search);
      if (filters.status)                params.set("status", filters.status);
      if (filters.from)                  params.set("from", filters.from);
      if (filters.to)                    params.set("to", filters.to);
      if (filters.contractNumber)        params.set("contractNumber", filters.contractNumber);
      if (filters.minDownPayment != null) params.set("minDownPayment", filters.minDownPayment);
      if (filters.maxDownPayment != null) params.set("maxDownPayment", filters.maxDownPayment);
      if (filters.page != null)          params.set("page", filters.page);
      if (filters.limit != null)         params.set("limit", filters.limit);

      const query = params.toString();
      const url = `/api/v1/contract/contract/${projectId}${query ? `?${query}` : ""}`;

      const res = await apiRequest(url, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "FETCH_SUCCESS", payload: normalizeResponse(data) });
        return;
      }
      if (res.status === 404) {
        dispatch({ type: "FETCH_SUCCESS", payload: { contracts: [], total: 0, statistics: null } });
        return;
      }
      dispatch({ type: "FETCH_ERROR", payload: "Xatolik yuz berdi, qayta urinib ko'ring!" });
    } catch (error) {
      if (error?.name === "AbortError") return;
      dispatch({ type: "FETCH_ERROR", payload: "Tizimda nosozlik!" });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filters.search, filters.status, filters.from, filters.to,
      filters.contractNumber, filters.minDownPayment, filters.maxDownPayment,
      filters.page, filters.limit]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return {
    contracts: state.contracts,
    total: state.total,
    statistics: state.statistics,
    error: state.error,
    loading: state.loading,
    get,
  };
}
