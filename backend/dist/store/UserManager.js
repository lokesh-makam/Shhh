"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
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
    sendMessage(userId, message) {
        const user = this.users.get(userId);
        if (!user) {
            console.log("you are not in the room");
            return;
        }
        const room = this.getRoom(user.roomId);
        if (!room) {
            console.error("romm not found");
            return;
        }
        this.broadcast(user.roomId, userId, message);
    }
    createRoom(roomId, userId, socket, maxSize) {
        if (maxSize < 2) {
            console.error("room size should be minimum 2");
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
    }
    joinChat(roomId, userId, socket) {
        const room = this.getRoom(roomId);
        if (!room) {
            console.log("room not exist 1");
            return;
        }
        const user = this.users.get(userId);
        if (user) {
            console.log("user already present in the room");
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
    broadcast(roomId, userId, message) {
        const room = this.rooms.get(roomId);
        const user = this.users.get(userId);
        if (!room || !user) {
            console.log("room not exist 2");
            return;
        }
        for (const ws of room.socket) {
            ws.send(JSON.stringify({
                event: "message",
                data: {
                    userId,
                    message,
                },
            }));
        }
        console.log("message sent" + message);
    }
    terminate(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log("room not exist 3");
            return;
        }
        for (const ws of room.socket) {
            this.users.delete(this.socketToUser.get(ws));
            this.socketToUser.delete(ws);
            ws.close();
        }
        this.rooms.delete(roomId);
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
