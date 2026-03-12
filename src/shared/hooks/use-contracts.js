import { useCallback, useEffect, useReducer, useRef } from "react";
import { apiRequest } from "@/shared/lib/api";

const INITIAL_STATE = {
  contracts: [],
  error: null,
  loading: true,
};

function contractsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        contracts: action.payload,
        error: null,
        loading: false,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
}

function normalizeContracts(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.contracts)
        ? payload.contracts
        : [];

  return [...list].sort((a, b) => {
    const aTime = Number(new Date(a?.contractDate ?? 0));
    const bTime = Number(new Date(b?.contractDate ?? 0));
    return bTime - aTime;
  });
}

export function useContracts(projectId) {
  const [state, dispatch] = useReducer(contractsReducer, INITIAL_STATE);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (!projectId) return;

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "FETCH_START" });

    try {
      const res = await apiRequest(`/api/v1/contract/contract/${projectId}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (res.ok) {
        const data = await res.json();
        dispatch({
          type: "FETCH_SUCCESS",
          payload: normalizeContracts(data),
        });
        return;
      }

      if (res.status === 404) {
        dispatch({ type: "FETCH_SUCCESS", payload: [] });
        return;
      }

      dispatch({
        type: "FETCH_ERROR",
        payload: "Xatolik yuz berdi qayta urunib ko'ring!",
      });
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
    error: state.error,
    loading: state.loading,
    get,
  };
}
