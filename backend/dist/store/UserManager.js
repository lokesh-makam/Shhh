"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const crypto_1 = require("crypto");
const nanoid_1 = require("nanoid");
const nanoid = (0, nanoid_1.customAlphabet)("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
class UserManager {
    constructor() {
        this.rooms = new Map();
        this.users = new Map();
        this.socketToUser = new Map();
    }
    getRoom(roomId) {
        var _a;
        return (_a = this.rooms.get(roomId)) !== null && _a !== void 0 ? _a : null;
    }
    createRoom(socket, maxSize) {
        const roomId = nanoid().toString();
        const userId = (0, crypto_1.randomUUID)().toString();
        if (maxSize < 2 || maxSize > 10) {
            console.error("room size should be from 2-10");
            return;
        }
        if (this.getRoom(roomId)) {
            console.log("romm already there please join");
            return;
        }
        this.rooms.set(roomId, {
            socket: new Set([socket]),
            maxSize,
        });
        this.users.set(userId, {
            userId,
            name: "lokesh",
            type: "ADMIN",
            roomId,
            socket,
        });
        this.socketToUser.set(socket, userId);
        console.log(JSON.stringify(this.users.get(userId)) + "room");
        console.log(JSON.stringify(this.rooms.get(roomId)) + "room");
        return roomId;
    }
    joinChat(roomId, socket) {
        const userId = (0, crypto_1.randomUUID)();
        const room = this.getRoom(roomId);
        if (!room) {
            socket.send(JSON.stringify({
                type: "JOIN_FAILED",
                payload: {
                    reason: "Room not found",
                },
            }));
            return;
        }
        if (room.maxSize <= room.socket.size) {
            console.log("room is full");
            return;
        }
        const type = room.socket.size == 0 ? "ADMIN" : "USER";
        room.socket.add(socket);
        this.users.set(userId, {
            userId,
            name: "lokesh",
            type,
            roomId,
            socket,
        });
        this.socketToUser.set(socket, userId);
        console.log(JSON.stringify(this.users.get(userId)) + "room");
        console.log(JSON.stringify(this.rooms.get(roomId)) + "room");
        return roomId;
    }
    leaveChat(roomId, userId) {
        const room = this.getRoom(roomId);
        const user = this.users.get(userId);
        if (!room || !user) {
            console.log("room or User not exists");
            return;
        }
        room.socket.delete(user.socket);
        this.socketToUser.delete(user.socket);
        this.users.delete(userId);
        console.log("user left the chat..");
        console.log("No of players present in the chat are " + room.socket.size);
        if (room.socket.size == 0) {
            setTimeout(() => {
                if (room.socket.size == 0) {
                    this.rooms.delete(roomId);
                    console.log("no users present room deleted");
                }
            }, 10000);
        }
    }
    broadcast(message, ws) {
        const userId = this.socketToUser.get(ws);
        const roomId = this.users.get(userId).roomId;
        const room = this.rooms.get(roomId);
        const user = this.users.get(userId);
        if (!room || !user) {
            console.error("room not exist 2");
            return;
        }
        for (const s of room.socket) {
            s.send(JSON.stringify({
                event: "message",
                data: {
                    userId,
                    message,
                },
            }));
        }
        console.log("message sent" + message);
    }
    terminate(ws) {
        const userId = this.socketToUser.get(ws);
        if (!userId)
            return;
        const user = this.users.get(userId);
        if (!user)
            return;
        if (user.type !== "ADMIN")
            return;
        const room = this.rooms.get(user.roomId);
        if (!room)
            return;
        for (const client of room.socket) {
            client.close();
        }
        this.rooms.delete(user.roomId);
    }
    handleDisconnect(ws) {
        const userId = this.socketToUser.get(ws);
        if (!userId) {
            console.log("room not exist 4");
            return;
        }
        const user = this.users.get(userId);
        if (!user) {
            console.log("room not exist 5");
            return;
        }
        this.leaveChat(user.roomId, userId);
    }
}
exports.UserManager = UserManager;
