/**
 * DATA layer: single project structure (TJM details).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

const STATUS_TO_STAT_KEY = {
  SOLD: "totalSold",
  RESERVED: "totalReserved",
  EMPTY: "totalEmpty",
  NOT: "totalNot",
};

function adjustStatistics(stats, fromStatus, toStatus) {
  if (!stats || fromStatus === toStatus) return stats;

  const fromKey = STATUS_TO_STAT_KEY[fromStatus];
  const toKey = STATUS_TO_STAT_KEY[toStatus];
  const next = { ...stats };

  if (fromKey && typeof next[fromKey] === "number") {
    next[fromKey] = Math.max(0, next[fromKey] - 1);
  }
  if (toKey && typeof next[toKey] === "number") {
    next[toKey] = Math.max(0, next[toKey] + 1);
  }

  return next;
}

export function useProjectStructure(id) {
  const [structure, setStructure] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef(null);

  const get = useCallback(async () => {
    if (!id) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await apiRequest(`/api/v1/projects/${id}/structure`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setStructure(data);
      } else if (res.status === 404 || res.status === 400) {
        setNotFound(true);
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
  }, [id]);

  useEffect(() => {
    get();
    return () => controllerRef.current?.abort();
  }, [get]);

  const updateRoomStatus = useCallback((roomId, patch) => {
    setStructure((prev) => {
      if (!prev?.blocks) return prev;

      let hasChanges = false;
      let previousStatus = null;
      let nextStatus = null;
      const nextBlocks = Object.fromEntries(
        Object.entries(prev.blocks).map(([blockName, block]) => {
          let blockChanged = false;
          let blockNextStats = block?.statistics;
          const nextAppartment = (block?.appartment ?? []).map((floorRooms) => {
            let floorChanged = false;
            const nextFloorRooms = floorRooms.map((room) => {
              if (String(room.id) !== String(roomId)) return room;
              floorChanged = true;
              hasChanges = true;
              previousStatus = room.status;
              nextStatus = patch?.status ?? room.status;
              return { ...room, ...patch };
            });

            if (floorChanged) blockChanged = true;
            return floorChanged ? nextFloorRooms : floorRooms;
          });

          if (
            blockChanged &&
            previousStatus &&
            nextStatus &&
            previousStatus !== nextStatus
          ) {
            blockNextStats = adjustStatistics(
              block?.statistics,
              previousStatus,
              nextStatus,
            );
          }

          if (!blockChanged) {
            return [blockName, block];
          }

          const nextBlock = { ...block, appartment: nextAppartment };
          if (blockNextStats !== undefined) {
            nextBlock.statistics = blockNextStats;
          }

          return [blockName, nextBlock];
        }),
      );

      const nextTotalStatistics =
        previousStatus && nextStatus && previousStatus !== nextStatus
          ? adjustStatistics(prev?.totalStatistics, previousStatus, nextStatus)
          : prev?.totalStatistics;

      return hasChanges
        ? { ...prev, blocks: nextBlocks, totalStatistics: nextTotalStatistics }
        : prev;
    });
  }, []);

  return { structure, notFound, error, loading, get, updateRoomStatus };
}
