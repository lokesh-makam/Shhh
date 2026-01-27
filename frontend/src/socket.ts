const WS_URL = import.meta.env.DEV ? "ws://localhost:8080" : "wss://yourapp.railway.app";

export function createSocket() {
	return new WebSocket("ws://localhost:8080");
}
