import http from "http";
import express, { Request, Response } from "express";
import WebSocket, { WebSocketServer } from "ws";
import { UserManager } from "./store/UserManager";

const app = express();
const userManager = new UserManager();
const server = http.createServer(app);

const wss = new WebSocketServer({
	server,
	maxPayload: 50 * 1024 * 1024,
});

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
	ws.on("error", (err) => {
		console.error("Socket error:", err.message);
		ws.terminate();
	});
	try {
		ws.on("message", (msg, isBinary) => {
			if (isBinary) {
				userManager.broadcastBinary(msg, ws);
				return;
			}
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
							role: result.role,
							name: result.name,
							maxSize: result.maxSize,
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
				const result = userManager.broadcastMessage(payload, ws);
				if (!result.ok) {
					sendError(ws, result.error!);
					return;
				}
			}
			if (type == "TERMINATE") {
				const result = userManager.terminate(ws);
				if (!result.ok) {
					sendError(ws, result.error!);
					return;
				}
			}
			if (type === "MEDIA_META") {
				const result = userManager.broadcastRaw(JSON.stringify(data), ws);

				if (!result.ok) {
					sendError(ws, result.error!);
					return;
				}
			}
		});
	} catch (err) {
		console.error("Handler error:", err);
		ws.close();
	}

	ws.on("close", () => {
		userManager.handleDisconnect(ws);
	});
});

server.listen(8080);
