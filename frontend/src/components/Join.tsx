import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketProvider";

type Chat = {
	id: string;
	text?: string;
	file?: string;
	me: boolean;
};

export default function Join() {
	const { roomId } = useParams();
	const ws = useContext(SocketContext);
	const navigate = useNavigate();

	const [status, setStatus] = useState<"loading" | "joined" | "invalid">("loading");
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Chat[]>([]);
	const fileRef = useRef<HTMLInputElement>(null);

	const username = "You";

	/* ---------------- JOIN LOGIC (unchanged) ---------------- */
	useEffect(() => {
		if (!ws) return;

		ws.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId },
			}),
		);

		const handler = (event: MessageEvent) => {
			const data = JSON.parse(event.data);

			if (data.type === "JOINED_ROOM") setStatus("joined");
			if (data.type === "JOIN_FAILED") setStatus("invalid");

			if (data.type === "MESSAGE") {
				setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: data.payload.message, me: false }]);
			}
		};

		ws.addEventListener("message", handler);
		return () => ws.removeEventListener("message", handler);
	}, [ws, roomId]);

	/* ---------------- SEND MESSAGE ---------------- */
	function broadcast() {
		if (!message.trim()) return;

		ws?.send(
			JSON.stringify({
				type: "SEND_MESSAGE",
				payload: { message },
			}),
		);

		setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: message, me: true }]);

		setMessage("");
	}

	/* ---------------- FILE UPLOAD ---------------- */
	function handleFile(e: any) {
		const file = e.target.files[0];
		if (!file) return;

		const url = URL.createObjectURL(file);

		setMessages((prev) => [...prev, { id: crypto.randomUUID(), file: url, me: true }]);
	}

	/* ---------------- UI ---------------- */

	if (status === "loading") return <div className="h-screen flex items-center justify-center text-white bg-black">Joining secure room...</div>;

	if (status === "invalid") return <div className="h-screen flex items-center justify-center text-red-400 bg-black">Invalid Room</div>;

	return (
		<div className="h-screen flex flex-col bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
			{/* ---------------- HEADER ---------------- */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/10 backdrop-blur-md bg-white/5">
				{/* left */}
				<div className="font-semibold text-sm text-gray-300">Room: {roomId}</div>

				{/* right */}
				<div className="flex items-center gap-3">
					<span className="text-sm text-gray-400">{username}</span>

					<button onClick={() => navigate("/")} className="px-3 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600">
						Leave
					</button>

					<button className="px-3 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-500">End</button>
				</div>
			</div>

			{/* ---------------- CHAT AREA ---------------- */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{messages.map((m) => (
					<div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
						<div className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${m.me ? "bg-indigo-600 rounded-br-sm" : "bg-gray-800 rounded-bl-sm"}`}>
							{m.text && <span>{m.text}</span>}
							{m.file && <img src={m.file} className="rounded-lg max-h-48" />}
						</div>
					</div>
				))}
			</div>

			{/* ---------------- INPUT BAR ---------------- */}
			<div className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-md">
				<div className="flex items-center gap-2">
					{/* emoji */}
					<button onClick={() => setMessage((p) => p + " 😊")} className="text-xl">
						😊
					</button>

					{/* file */}
					<button onClick={() => fileRef.current?.click()} className="text-xl">
						📎
					</button>

					<input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

					{/* text */}
					<input
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && broadcast()}
						placeholder="Type a message..."
						className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none"
					/>

					<button onClick={broadcast} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500">
						Send
					</button>
				</div>
			</div>
		</div>
	);
}
