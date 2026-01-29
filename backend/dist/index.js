"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const UserManager_1 = require("./store/UserManager");
const app = (0, express_1.default)();
const userManager = new UserManager_1.UserManager();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({
    server,
    maxPayload: 50 * 1024 * 1024,
});
function sendError(ws, message) {
    ws.send(JSON.stringify({
        type: "ERROR",
        payload: {
            message,
        },
    }));
}
wss.on("connection", (ws) => {
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
                const result = userManager.joinChat(payload.roomId, ws);
                if (!result.ok) {
                    sendError(ws, result.error);
                    return;
                }
                ws.send(JSON.stringify({
                    type: "JOINED_ROOM",
                    payload: {
                        roomId: result.roomId,
                        role: result.role,
                        name: result.name,
                        maxSize: result.maxSize,
                    },
                }));
            }
            if (type === "CREATE_ROOM") {
                const result = userManager.createRoom(ws, payload.maxSize);
                if (!result.ok) {
                    sendError(ws, result.error);
                    return;
                }
                ws.send(JSON.stringify({
                    type: "ROOM_CREATED",
                    payload: {
                        roomId: result.roomId,
                    },
                }));
            }
            if (type === "SEND_MESSAGE") {
                const result = userManager.broadcastMessage(payload, ws);
                if (!result.ok) {
                    sendError(ws, result.error);
                    return;
                }
            }
            if (type == "TERMINATE") {
                const result = userManager.terminate(ws);
                if (!result.ok) {
                    sendError(ws, result.error);
                    return;
                }
            }
            if (type === "MEDIA_META") {
                const result = userManager.broadcastRaw(JSON.stringify(data), ws);
                if (!result.ok) {
                    sendError(ws, result.error);
                    return;
                }
            }
        });
    }
    catch (err) {
        console.error("Handler error:", err);
        ws.close();
    }
    ws.on("close", () => {
        userManager.handleDisconnect(ws);
    });
});
server.listen(8080);
