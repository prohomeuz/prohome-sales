import { createContext, useContext } from "react";

export const SocketContext = createContext(null);

/**
 * Global socket ref ni qaytaradi (SocketProvider tomonidan beriladi).
 * @returns {import("react").MutableRefObject<import("socket.io-client").Socket|null>|null}
 */
export function useSocketRef() {
  return useContext(SocketContext);
}
