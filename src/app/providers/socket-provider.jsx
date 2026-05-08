import { useAppStore } from "@/entities/session/model";
import { SocketContext } from "@/shared/lib/socket-context";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Login qilgan foydalanuvchi uchun WebSocket ulanishini boshqaradi.
 * User chiqib ketsa — socket uziladi. Qaytib kirsa — qayta ulanadi.
 */
export function SocketProvider({ children }) {
  const userId = useAppStore((s) => s.user?.id);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;

    const socket = io(baseUrl, {
      query: { userId: String(userId), deviceId: "web" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}
