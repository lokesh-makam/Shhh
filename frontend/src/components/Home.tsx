import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketProvider";

export default function Home() {
	const ws = useContext(SocketContext); // ✅ get global socket

	const [members, setMembers] = useState(2);
	const [roomIdInput, setRoomIdInput] = useState("");
	const [roomIdValue, setRoomIdValue] = useState<string | null>(null);
	const [userId, setUserId] = useState("");
	const [mode, setMode] = useState<"create" | "join" | null>(null);

	useEffect(() => {
		if (!ws) return;

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "ROOM_CREATED") {
				setRoomIdValue(data.payload.roomId);
				setUserId(data.payload.userId);
			}
		};

		return () => {
			// only remove listener, DON'T close
			ws.onmessage = null;
		};
	}, [ws]);

	function createRoom(maxSize: number) {
		ws?.send(
			JSON.stringify({
				type: "CREATE_ROOM",
				payload: { maxSize },
			}),
		);
	}

	function joinRoom(roomId: string) {
		ws?.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId },
			}),
		);
	}

	return (
		<div>
			<button onClick={() => setMode("create")}>Create Room</button>
			<button onClick={() => setMode("join")}>Join Room</button>

			{mode === "create" && (
				<div>
					<input type="number" min={2} max={10} value={members} onChange={(e) => setMembers(Number(e.target.value))} />

					<button onClick={() => createRoom(members)}>Create</button>

					{roomIdValue && <>Your room id is {roomIdValue}</>}
				</div>
			)}

			{mode === "join" && (
				<div>
					<input value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} placeholder="Room ID" />
					<button onClick={() => joinRoom(roomIdInput)}>Join</button>
				</div>
			)}
		</div>
	);
}
