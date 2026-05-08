/**
 * @file WebSocket orqali xona o'zgarishlarini real vaqtda tinglaydi.
 * @module entities/room/model/use-room-socket
 */

import { useSocketRef } from "@/shared/lib/socket-context";
import { useEffect } from "react";

/**
 * Room eventlarini Socket.IO orqali tinglaydi.
 * Barcha callbacklar useCallback bilan stabillashtirilib berilishi kerak.
 *
 * @param {{
 *   onStatusUpdated?: (data: { roomId: number, status: string, soldDate: string|null, bookingDate: string|null }) => void,
 *   onRoomUpdated?:   (data: { id: number }) => void,
 *   onRoomDeleted?:   (data: { id: number }) => void,
 * }} handlers
 */
export function useRoomSocket({ onStatusUpdated, onRoomUpdated, onRoomDeleted } = {}) {
  const socketRef = useSocketRef();

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    if (onStatusUpdated) socket.on("room_status_updated", onStatusUpdated);
    if (onRoomUpdated)   socket.on("room_updated", onRoomUpdated);
    if (onRoomDeleted)   socket.on("room_deleted", onRoomDeleted);

    return () => {
      if (onStatusUpdated) socket.off("room_status_updated", onStatusUpdated);
      if (onRoomUpdated)   socket.off("room_updated", onRoomUpdated);
      if (onRoomDeleted)   socket.off("room_deleted", onRoomDeleted);
    };
  }, [socketRef, onStatusUpdated, onRoomUpdated, onRoomDeleted]);
}
