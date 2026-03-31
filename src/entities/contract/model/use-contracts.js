/**
 * @file DATA layer: contracts list by project with filters & pagination.
 * @module entities/contract/model/use-contracts
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import { apiRequest } from "@/shared/lib/api";

/** @type {{ contracts: object[], total: number, error: string|null, loading: boolean }} */
const INITIAL_STATE = {
  contracts: [],
  total: 0,
  error: null,
  loading: true,
};

/**
 * @param {typeof INITIAL_STATE} state
 * @param {{ type: string, payload?: any }} action
 */
function contractsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        contracts: action.payload.contracts,
        total: action.payload.total,
        error: null,
        loading: false,
      };
    case "FETCH_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

/**
 * @param {any} payload
 * @returns {{ contracts: object[], total: number }}
 */
function normalizeResponse(payload) {
  // Backend: { data: [...], total: N } yoki array
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.contracts)
        ? payload.contracts
        : [];

  const total =
    typeof payload?.total === "number"
      ? payload.total
      : typeof payload?.count === "number"
        ? payload.count
        : list.length;

  return { contracts: list, total };
}

/**
 * @typedef {Object} ContractFilters
 * @property {string} [search]
 * @property {string} [status] - PROCESS | SUCCESS | CANCELED
 * @property {string} [from]   - ISO date string
 * @property {string} [to]     - ISO date string
 * @property {string} [contractNumber]
 * @property {number} [minDownPayment]
 * @property {number} [maxDownPayment]
 * @property {number} [page]
 * @property {number} [limit]
 */

/**
 * Berilgan loyiha bo'yicha shartnomalar ro'yxatini yuklaydi.
 * @param {string|number} projectId
 * @param {ContractFilters} [filters]
 * @returns {{ contracts: object[], total: number, error: string|null, loading: boolean, get: Function }}
 */
export function useContracts(projectId, filters = {}) {
  const [state, dispatch] = useReducer(contractsReducer, INITIAL_STATE);
  const controllerRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const get = useCallback(async () => {
    if (!projectId) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "FETCH_START" });

    try {
      const params = new URLSearchParams();
      const f = filtersRef.current;

      if (f.search)           params.set("search", f.search);
      if (f.status)           params.set("status", f.status);
      if (f.from)             params.set("from", f.from);
      if (f.to)               params.set("to", f.to);
      if (f.contractNumber)   params.set("contractNumber", f.contractNumber);
      if (f.minDownPayment != null) params.set("minDownPayment", f.minDownPayment);
      if (f.maxDownPayment != null) params.set("maxDownPayment", f.maxDownPayment);
      if (f.page != null)     params.set("page", f.page);
      if (f.limit != null)    params.set("limit", f.limit);

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
        dispatch({ type: "FETCH_SUCCESS", payload: { contracts: [], total: 0 } });
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
  }, [projectId]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  return {
    contracts: state.contracts,
    total: state.total,
    error: state.error,
    loading: state.loading,
    get,
  };
}
