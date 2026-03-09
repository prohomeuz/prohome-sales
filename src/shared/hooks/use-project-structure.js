/**
 * DATA layer: single project structure (TJM details).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/shared/lib/api";

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
      const nextBlocks = Object.fromEntries(
        Object.entries(prev.blocks).map(([blockName, block]) => {
          let blockChanged = false;
          const nextAppartment = (block?.appartment ?? []).map((floorRooms) => {
            let floorChanged = false;
            const nextFloorRooms = floorRooms.map((room) => {
              if (String(room.id) !== String(roomId)) return room;
              floorChanged = true;
              hasChanges = true;
              return { ...room, ...patch };
            });

            if (floorChanged) blockChanged = true;
            return floorChanged ? nextFloorRooms : floorRooms;
          });

          return [
            blockName,
            blockChanged ? { ...block, appartment: nextAppartment } : block,
          ];
        }),
      );

      return hasChanges ? { ...prev, blocks: nextBlocks } : prev;
    });
  }, []);

  return { structure, notFound, error, loading, get, updateRoomStatus };
}
