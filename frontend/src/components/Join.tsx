import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SocketContext } from "../context/SocketProvider";

export default function Join() {
	const { roomId } = useParams();
	console.log(roomId);
	const [status, setStatus] = useState<"loading" | "joined" | "invalid">("loading");
	const [message, setMessage] = useState("");
	const ws = useContext(SocketContext);

	useEffect(() => {
		if (!ws) return;
		ws?.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId },
			}),
		);
		const handler = (event: MessageEvent) => {
			const data = JSON.parse(event.data);
			if (data.type === "JOINED_ROOM") {
				setStatus("joined");
			}
			if (data.type === "JOIN_FAILED") {
				setStatus("invalid");
			}
		};
		ws.addEventListener("message", handler);

		return () => {
			ws.removeEventListener("message", handler);
		};
	}, [ws, roomId]);

	function broadcast(message: string) {
		ws?.send(
			JSON.stringify({
				type: "SEND_MESSAGE",
				payload: {
					message,
				},
			}),
		);
	}
	return (
		<>
			{status == "loading" && (
				<div>
					<h4>Joining room...</h4>
				</div>
			)}
			{status == "invalid" && (
				<div>
					<h4>Invalid Credentials</h4>
				</div>
			)}
			{status == "joined" && (
				<div>
					<h4> Room code {roomId}</h4>
					<input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="enter the message" />
					<button onClick={() => broadcast(message)}>send</button>
				</div>
			)}
		</>
	);
}
