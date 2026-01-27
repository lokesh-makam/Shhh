// src/context/SocketContext.tsx
import { createContext, useRef, type ReactNode } from "react";
import { createSocket } from "../socket";

export const SocketContext = createContext<WebSocket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const wsRef = useRef<WebSocket | null>(null);

	if (!wsRef.current) {
		wsRef.current = createSocket();
	}

	return <SocketContext.Provider value={wsRef.current}>{children}</SocketContext.Provider>;
}
