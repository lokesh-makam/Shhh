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
		const roomId = nanoid().toString();
		const userId = randomUUID().toString();
		if (maxSize < 2 || maxSize > 10) {
			console.error("room size should be from 2-10");
			return {
				ok: false,
				error: "ROOM_FULL",
			};
		}
		if (this.getRoom(roomId)) {
			console.log("romm already there please join");
			return {
				ok: false,
				error: "ROOM_DUPLICATE",
			};
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

		return {
			ok: true,
			roomId,
		};
	}

	joinChat(roomId: string, socket: WebSocket) {
		const userId = randomUUID();
		const room = this.getRoom(roomId);
		if (!room) {
			return {
				ok: false,
				error: "ROOM_NOT_FOUND",
			};
		}
		if (room.maxSize <= room.socket.size) {
			console.log("room is full");
			return {
				ok: false,
				error: "INVALID_ROOM_SIZE",
			};
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
		return {
			ok: true,
			roomId,
		};
	}

	leaveChat(roomId: string, userId: string) {
		const room = this.getRoom(roomId);
		const user = this.users.get(userId);
		if (!room || !user) {
			console.log("room or User not exists");
			return {
				ok: false,
				error: "ROOM_NOT_EXISTS",
			};
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
		return { ok: true, message: "ROOM_LEFT" };
	}

	broadcast(message: string, ws: WebSocket) {
		const userId = this.socketToUser.get(ws);
		if (!userId) {
			return { ok: false, error: "USER_NOT_FOUND" };
		}
		const roomId = this.users.get(userId)!.roomId;
		const room = this.rooms.get(roomId);
		const user = this.users.get(userId);
		if (!room || !user) {
			console.error("room not exist 2");
			return {
				ok: false,
				error: "ROOM_NOT_EXISTS",
			};
		}
		for (const s of room.socket) {
			s.send(
				JSON.stringify({
					type: "MESSAGE",
					payload: {
						userId,
						message,
					},
				}),
			);
		}
		console.log("message sent" + message);
		return { ok: true, message: "MESSAGE_SENT" };
	}
	terminate(ws: WebSocket) {
		const userId = this.socketToUser.get(ws);
		if (!userId) {
			return {
				ok: false,
				error: "USER_NOT_FOUND",
			};
		}

		const user = this.users.get(userId);
		if (!user) {
			return {
				ok: false,
				error: "USER_NOT_FOUND",
			};
		}

		if (user.type !== "ADMIN") {
			return {
				ok: false,
				error: "NOT_ADMIN",
			};
		}

		const room = this.rooms.get(user.roomId);
		if (!room) {
			return {
				ok: false,
				error: "ROOM_NOT_FOUND",
			};
		}

		for (const client of room.socket) {
			client.close();
		}

		this.rooms.delete(user.roomId);
		return { ok: true, message: "SESSION_TERMINATED" };
	}

	handleDisconnect(ws: WebSocket) {
		const userId = this.socketToUser.get(ws);
		if (!userId) {
			console.log("room not exist 4");

			return {
				ok: false,
				error: "USER_NOT_FOUND",
			};
		}

		const user = this.users.get(userId);
		if (!user) {
			console.log("room not exist 5");

			return {
				ok: false,
				error: "USER_NOT_FOUND",
			};
		}

		this.leaveChat(user.roomId, userId);
	}
}
