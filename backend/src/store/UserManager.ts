import { randomUUID } from "crypto";
import WebSocket from "ws";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export interface Chat {
	chatId: string;
	message: string;
}

export interface User {
	userId: string;
	roomId: string;
	type: "ADMIN" | "USER";
	name: string;
	socket: WebSocket;
}

interface Room {
	socket: Set<WebSocket>;
	maxSize: number;
}

export class UserManager {
	private rooms: Map<string, Room>;
	private users: Map<string, User>;
	private socketToUser: Map<WebSocket, string>;
	constructor() {
		this.rooms = new Map<string, Room>();
		this.users = new Map<string, User>();
		this.socketToUser = new Map<WebSocket, string>();
	}

	getRoom(roomId: string) {
		return this.rooms.get(roomId) ?? null;
	}

	createRoom(socket: WebSocket, maxSize: number) {
		const roomId = nanoid();
		const userId = randomUUID();
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
		return { roomId, userId };
	}

	joinChat(roomId: string, socket: WebSocket) {
		const userId = randomUUID();
		const room = this.getRoom(roomId);
		if (!room) {
			console.log("room not exist 1");
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

	leaveChat(roomId: string, userId: string) {
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

	broadcast(message: string, ws: WebSocket) {
		const userId = this.socketToUser.get(ws)!;
		const roomId = this.users.get(userId)!.roomId;
		const room = this.rooms.get(roomId);
		const user = this.users.get(userId);
		if (!room || !user) {
			console.error("room not exist 2");
			return;
		}
		for (const s of room.socket) {
			s.send(
				JSON.stringify({
					event: "message",
					data: {
						userId,
						message,
					},
				}),
			);
		}
		console.log("message sent" + message);
	}
	terminate(ws: WebSocket) {
		const userId = this.socketToUser.get(ws);
		if (!userId) return;

		const user = this.users.get(userId);
		if (!user) return;

		if (user.type !== "ADMIN") return;

		const room = this.rooms.get(user.roomId);
		if (!room) return;

		for (const client of room.socket) {
			client.close();
		}

		this.rooms.delete(user.roomId);
	}

	handleDisconnect(ws: WebSocket) {
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
