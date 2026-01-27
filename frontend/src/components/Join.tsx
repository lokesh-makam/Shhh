import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketProvider";
import { nanoid } from "nanoid";

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
	const [role, setRole] = useState<"ADMIN" | "USER">("USER");
	const [username, setUsername] = useState("");

	const fileRef = useRef<HTMLInputElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	/* ---------------- AUTO SCROLL ---------------- */
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	/* ---------------- JOIN LOGIC ---------------- */
	useEffect(() => {
		if (!ws || !roomId) return;

		ws.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId },
			}),
		);

		const handler = (event: MessageEvent) => {
			const data = JSON.parse(event.data);

			if (data.type === "JOINED_ROOM") {
				setRole(data.payload.role);
				setUsername(data.payload.name);
				console.log("ROLE FROM SERVER →", data.payload.role);
				console.log(role);
				setStatus("joined");
			}

			if (data.type === "JOIN_FAILED") setStatus("invalid");

			if (data.type === "MESSAGE") {
				setMessages((prev) => [
					...prev,
					{
						id: nanoid(),
						text: data.payload.message,
						me: false,
					},
				]);
			}
		};

		ws.addEventListener("message", handler);
		return () => ws.removeEventListener("message", handler);
	}, [ws, roomId]);

	/* ---------------- SEND TEXT ---------------- */
	function broadcast() {
		if (!message.trim()) return;

		ws?.send(
			JSON.stringify({
				type: "SEND_MESSAGE",
				payload: { message },
			}),
		);

		setMessages((prev) => [...prev, { id: nanoid(), text: message, me: true }]);

		setMessage("");
	}
	function endChat() {
		ws?.send(JSON.stringify({ type: "TERMINATE" }));
		navigate("/");
	}

	/* ---------------- FILE UPLOAD ---------------- */
	function handleFile(e: any) {
		const file = e.target.files[0];
		if (!file) return;

		const url = URL.createObjectURL(file);

		setMessages((prev) => [...prev, { id: nanoid(), file: url, me: true }]);

		setTimeout(() => URL.revokeObjectURL(url), 60000);
	}

	/* ---------------- STATES ---------------- */
	if (status === "loading") return <div className="h-screen flex items-center justify-center bg-black text-gray-300 animate-pulse">Connecting securely...</div>;

	if (status === "invalid") return <div className="h-screen flex items-center justify-center bg-black text-red-400">Room not found or expired</div>;

	/* ---------------- UI ---------------- */
	return (
		<div className="h-screen flex justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
			{/* CHAT CONTAINER */}
			<div className="w-full max-w-2xl flex flex-col">
				{/* HEADER */}
				<div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-md">
					<span className="text-xs text-gray-400">Room • {roomId}</span>

					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-indigo-400">{username}</span>
						<button onClick={() => navigate("/")} className="px-3 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 transition">
							Leave
						</button>
						{role === "ADMIN" && (
							<button onClick={endChat} className="px-3 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-500 transition">
								End
							</button>
						)}{" "}
					</div>
				</div>

				{/* MESSAGES */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{messages.map((m) => (
						<div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl text-sm shadow-lg transition
                ${m.me ? "bg-indigo-600 rounded-br-sm" : "bg-gray-800 rounded-bl-sm"}`}
							>
								{m.text && <span>{m.text}</span>}
								{m.file && <img src={m.file} className="rounded-lg max-h-56 mt-1" />}
							</div>
						</div>
					))}
					<div ref={bottomRef} />
				</div>

				{/* INPUT BAR */}
				<div className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-xl">
					<div className="flex items-center gap-2">
						<button onClick={() => setMessage((p) => p + " 😊")} className="text-xl hover:scale-110 transition">
							😊
						</button>

						<button onClick={() => fileRef.current?.click()} className="text-xl hover:scale-110 transition">
							📎
						</button>

						<input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

						<input
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && broadcast()}
							placeholder="Type a message..."
							className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-indigo-500"
						/>

						<button onClick={broadcast} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition">
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
