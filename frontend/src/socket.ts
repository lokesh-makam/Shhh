const WS_URL = import.meta.env.DEV ? "ws://localhost:8080" : "wss://yourapp.railway.app";

export function createSocket() {
	return new WebSocket("ws://10.128.32.216:8080");
}
