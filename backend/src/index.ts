import http from "http";
import express, { Request, Response } from "express";
import WebSocket, { WebSocketServer } from "ws";
import { UserManager } from "./store/UserManager";

const app = express();
const userManager = new UserManager();
app.get("/", (req: Request, res: Response) => {
	res.send("Server running");
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
function sendError(ws: WebSocket, message: string) {
	ws.send(
		JSON.stringify({
			type: "ERROR",
			payload: {
				message,
			},
		}),
	);
}
wss.on("connection", (ws: WebSocket) => {
	console.log("Client connected");
	ws.on("message", (msg) => {
		const data = JSON.parse(msg.toString());
		const type = data.type;
		const payload = data.payload;
		if (type === "JOIN_ROOM") {
			const result = userManager.joinChat(payload.roomId, ws)!;
			if (!result.ok) {
				sendError(ws, result.error!);
				return;
			}
			ws.send(
				JSON.stringify({
					type: "JOINED_ROOM",
					payload: {
						roomId: result.roomId,
					},
				}),
			);
		}
		if (type === "CREATE_ROOM") {
			const result = userManager.createRoom(ws, payload.maxSize);
			if (!result.ok) {
				sendError(ws, result.error!);
				return;
			}
			console.log("room created id:" + JSON.stringify(result.roomId));
			ws.send(
				JSON.stringify({
					type: "ROOM_CREATED",
					payload: {
						roomId: result.roomId,
					},
				}),
			);
		}
		if (type === "SEND_MESSAGE") {
			const result = userManager.broadcast(payload.message, ws);
			if (!result.ok) {
				sendError(ws, result.error!);
				return;
			}
			ws.send(
				JSON.stringify({
					type: "MESSAGE_SENT",
					payload: {},
				}),
			);
		}
		if (type == "TERMINATE") {
			const result = userManager.terminate(payload.roomId);
			if (!result.ok) {
				sendError(ws, result.error!);
				return;
			}
		}
	});

	ws.on("close", () => {
		userManager.handleDisconnect(ws);
		console.log("Client disconnected");
	});
});

server.listen(8080, () => {
	console.log("Server running on port 8080");
});
