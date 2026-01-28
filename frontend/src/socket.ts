const WS_URL = import.meta.env.DEV ? "ws://localhost:8080" : "wss://yourapp.railway.app";

export function createSocket() {
	return new WebSocket("ws://172.39.10.37:8080");
}
