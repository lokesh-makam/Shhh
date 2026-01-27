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
app.get("/", (req, res) => {
    res.send("Server running");
});
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.send("Hello from server");
    ws.on("message", (msg) => {
        const data = JSON.parse(msg.toString());
        const type = data.type;
        const payload = data.payload;
        if (type === "JOIN_ROOM") {
            userManager.joinChat(payload.roomId, ws);
        }
        if (type === "CREATE_ROOM") {
            const roomId = userManager.createRoom(ws, payload.maxSize);
            console.log("room created id:" + JSON.stringify(roomId));
            ws.send(JSON.stringify({
                roomId,
            }));
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
