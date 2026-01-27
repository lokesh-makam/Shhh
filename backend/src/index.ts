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

wss.on("connection", (ws: WebSocket) => {
	console.log("Client connected");
	ws.on("message", (msg) => {
		const data = JSON.parse(msg.toString());
		const type = data.type;
		const payload = data.payload;
		if (type === "JOIN_ROOM") {
			const roomId = userManager.joinChat(payload.roomId, ws)!;
			ws.send(
				JSON.stringify({
					type: "JOINED_ROOM",
					payload: {
						roomId,
					},
				}),
			);
		}
		if (type === "CREATE_ROOM") {
			const roomId = userManager.createRoom(ws, payload.maxSize)!;
			console.log("room created id:" + JSON.stringify(roomId));
			ws.send(
				JSON.stringify({
					type: "ROOM_CREATED",
					payload: {
						roomId,
					},
				}),
			);
		}
		if (type === "SEND_MESSAGE") {
			userManager.broadcast(payload.message, ws);
		}
		if (type == "TERMINATE") {
			userManager.terminate(payload.roomId);
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
