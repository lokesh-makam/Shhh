const WS_URL = import.meta.env.VITE_WS_URL;

export function createSocket() {
	return new WebSocket(WS_URL);
}
