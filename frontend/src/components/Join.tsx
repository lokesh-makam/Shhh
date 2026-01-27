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
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [copied, setCopied] = useState(false);

	const fileRef = useRef<HTMLInputElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);

	/* ---------------- AUTO SCROLL ---------------- */
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	/* ---------------- CLOSE EMOJI PICKER ON OUTSIDE CLICK ---------------- */
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
				setShowEmojiPicker(false);
			}
		}

		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker]);

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
		const closeHandler = () => {
			alert("Chat session ended");
			navigate("/");
		};

		ws.addEventListener("message", handler);
		ws.addEventListener("close", closeHandler);

		return () => {
			ws.removeEventListener("message", handler);
			ws.removeEventListener("close", closeHandler);
		};
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
		setShowEmojiPicker(false);
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

	/* ---------------- COPY ROOM ID ---------------- */
	function copyRoomId() {
		if (roomId) {
			navigator.clipboard.writeText(roomId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	/* ---------------- EMOJI HANDLER ---------------- */
	function addEmoji(emoji: string) {
		setMessage((prev) => prev + emoji);
	}

	/* ---------------- EMOJI CATEGORIES ---------------- */
	const emojiCategories = {
		"😊": [
			"😀",
			"😃",
			"😄",
			"😁",
			"😅",
			"😂",
			"🤣",
			"😊",
			"😇",
			"🙂",
			"🙃",
			"😉",
			"😌",
			"😍",
			"🥰",
			"😘",
			"😗",
			"😙",
			"😚",
			"😋",
			"😛",
			"😝",
			"😜",
			"🤪",
			"🤨",
			"🧐",
			"🤓",
			"😎",
			"🤩",
			"🥳",
			"😏",
			"😒",
			"😞",
			"😔",
			"😟",
			"😕",
			"🙁",
			"😣",
			"😖",
			"😫",
			"😩",
			"🥺",
		],
		"👋": [
			"👋",
			"🤚",
			"🖐",
			"✋",
			"🖖",
			"👌",
			"🤌",
			"🤏",
			"✌️",
			"🤞",
			"🤟",
			"🤘",
			"🤙",
			"👈",
			"👉",
			"👆",
			"🖕",
			"👇",
			"☝️",
			"👍",
			"👎",
			"✊",
			"👊",
			"🤛",
			"🤜",
			"👏",
			"🙌",
			"👐",
			"🤲",
			"🤝",
			"🙏",
		],
		"❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💋", "💏", "💑", "💐", "🌹", "🌷", "🌺", "🌸", "💮"],
		"🐶": [
			"🐶",
			"🐱",
			"🐭",
			"🐹",
			"🐰",
			"🦊",
			"🐻",
			"🐼",
			"🐨",
			"🐯",
			"🦁",
			"🐮",
			"🐷",
			"🐸",
			"🐵",
			"🐔",
			"🐧",
			"🐦",
			"🐤",
			"🦆",
			"🦅",
			"🦉",
			"🦇",
			"🐺",
			"🐗",
			"🐴",
			"🦄",
			"🐝",
			"🐛",
			"🦋",
			"🐌",
			"🐞",
			"🐜",
			"🦟",
			"🦗",
		],
		"🍎": [
			"🍎",
			"🍊",
			"🍋",
			"🍌",
			"🍉",
			"🍇",
			"🍓",
			"🫐",
			"🍈",
			"🍒",
			"🍑",
			"🥭",
			"🍍",
			"🥥",
			"🥝",
			"🍅",
			"🍆",
			"🥑",
			"🥦",
			"🥬",
			"🥒",
			"🌶",
			"🫑",
			"🌽",
			"🥕",
			"🫒",
			"🧄",
			"🧅",
			"🥔",
			"🍠",
			"🥐",
			"🥯",
			"🍞",
			"🥖",
			"🥨",
		],
		"⚽": [
			"⚽",
			"🏀",
			"🏈",
			"⚾",
			"🥎",
			"🎾",
			"🏐",
			"🏉",
			"🥏",
			"🎱",
			"🪀",
			"🏓",
			"🏸",
			"🏒",
			"🏑",
			"🥍",
			"🏏",
			"🪃",
			"🥅",
			"⛳",
			"🪁",
			"🏹",
			"🎣",
			"🤿",
			"🥊",
			"🥋",
			"🎽",
			"🛹",
			"🛼",
			"🛷",
			"⛸",
			"🥌",
		],
		"🎮": ["🎮", "🕹", "🎲", "🎯", "🎳", "🎰", "🎨", "🎭", "🎪", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎬", "🎥", "📷", "📸", "📹", "📼", "🔍", "🔎", "💡", "🔦"],
		"✈️": [
			"✈️",
			"🚀",
			"🛸",
			"🚁",
			"🛶",
			"⛵",
			"🚤",
			"🛥",
			"🛳",
			"⛴",
			"🚢",
			"🚂",
			"🚃",
			"🚄",
			"🚅",
			"🚆",
			"🚇",
			"🚈",
			"🚉",
			"🚊",
			"🚝",
			"🚞",
			"🚋",
			"🚌",
			"🚍",
			"🚎",
			"🚐",
			"🚑",
			"🚒",
			"🚓",
			"🚔",
			"🚕",
		],
	};

	/* ---------------- STATES ---------------- */
	if (status === "loading")
		return (
			<div className="h-screen flex items-center justify-center bg-black">
				<div className="text-center space-y-4">
					<div className="w-12 h-12 border-3 border-gray-700 border-t-white rounded-full animate-spin mx-auto"></div>
					<p className="text-gray-400 text-sm">Connecting...</p>
				</div>
			</div>
		);

	if (status === "invalid")
		return (
			<div className="h-screen flex items-center justify-center bg-black">
				<div className="text-center space-y-4 p-6">
					<div className="text-5xl">⚠️</div>
					<p className="text-white text-lg font-medium">Room not found</p>
					<p className="text-gray-500 text-sm">This room may have expired or doesn't exist</p>
					<button onClick={() => navigate("/")} className="mt-4 px-6 py-2.5 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition">
						Go Home
					</button>
				</div>
			</div>
		);

	/* ---------------- UI ---------------- */
	return (
		<div className="h-screen flex flex-col bg-black text-white overflow-hidden">
			{/* HEADER - Instagram Style */}
			<div className="flex-shrink-0 border-b border-gray-800">
				<div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
					{/* Left - Back & User Info */}
					<div className="flex items-center gap-3 flex-1">
						<button onClick={() => navigate("/")} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
								{username.charAt(0).toUpperCase()}
							</div>
							<div>
								<p className="text-sm font-semibold">{username}</p>
								<p className="text-xs text-gray-500">Active now</p>
							</div>
						</div>
					</div>

					{/* Right - Actions */}
					<div className="flex items-center gap-2">
						<button onClick={copyRoomId} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 relative group" title="Copy Room ID">
							{copied ? (
								<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							) : (
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							)}
							<span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
								{copied ? "Copied!" : "Copy Room ID"}
							</span>
						</button>

						{role === "ADMIN" && (
							<button onClick={endChat} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95" title="End Chat">
								<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* MESSAGES AREA - Instagram Style */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-4xl mx-auto px-4 py-4 space-y-2">
					{messages.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-600 py-20">
							<div className="w-20 h-20 rounded-full border-4 border-gray-800 flex items-center justify-center text-3xl mb-4">💬</div>
							<p className="text-sm font-medium">No messages yet</p>
							<p className="text-xs text-gray-700 mt-1">Send a message to start the conversation</p>
						</div>
					)}

					{messages.map((m, idx) => {
						const showAvatar = idx === messages.length - 1 || messages[idx + 1]?.me !== m.me;

						return (
							<div key={m.id} className={`flex gap-2 items-end ${m.me ? "flex-row-reverse" : "flex-row"} animate-messageIn`}>
								{/* Avatar for received messages */}
								{!m.me && (
									<div
										className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 ${showAvatar ? "visible" : "invisible"}`}
									>
										{username.charAt(0).toUpperCase()}
									</div>
								)}

								{/* Message Bubble */}
								<div className={`max-w-[70%] sm:max-w-md ${m.me ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
									<div
										className={`px-4 py-2 rounded-3xl text-sm break-words ${
											m.me ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md" : "bg-gray-900 text-white rounded-bl-md"
										}`}
									>
										{m.text && <span>{m.text}</span>}
										{m.file && (
											<img
												src={m.file}
												className="rounded-2xl max-h-80 w-full object-cover cursor-pointer hover:opacity-95 transition"
												alt="shared media"
												onClick={() => window.open(m.file, "_blank")}
											/>
										)}
									</div>
								</div>
							</div>
						);
					})}
					<div ref={bottomRef} />
				</div>
			</div>

			{/* EMOJI PICKER - Modern Design */}
			{showEmojiPicker && (
				<div
					ref={emojiPickerRef}
					className="absolute bottom-16 sm:bottom-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-96 bg-[#1c1c1e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-slideUp"
					style={{ maxWidth: "calc(100vw - 32px)" }}
				>
					<div className="p-4 border-b border-gray-800 flex items-center justify-between">
						<h3 className="text-sm font-semibold">Emojis</h3>
						<button onClick={() => setShowEmojiPicker(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="h-80 overflow-y-auto p-4 space-y-4 custom-scrollbar">
						{Object.entries(emojiCategories).map(([icon, emojis]) => (
							<div key={icon}>
								<p className="text-2xl mb-2">{icon}</p>
								<div className="grid grid-cols-8 gap-1">
									{emojis.map((emoji, idx) => (
										<button key={idx} onClick={() => addEmoji(emoji)} className="text-2xl p-2 hover:bg-gray-800 rounded-lg transition active:scale-90">
											{emoji}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* INPUT BAR - Instagram Style */}
			<div className="flex-shrink-0 border-t border-gray-800">
				<div className="max-w-4xl mx-auto px-4 py-3">
					<div className="flex items-center gap-2">
						{/* Emoji Button */}
						<button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</button>

						{/* Attach Button */}
						<button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
								/>
							</svg>
						</button>

						<input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,video/*,audio/*" />

						{/* Message Input */}
						<div className="flex-1 relative">
							<input
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && broadcast()}
								placeholder="Message..."
								className="w-full px-4 py-2.5 rounded-full bg-gray-900 border border-gray-800 focus:outline-none focus:border-gray-700 text-sm transition placeholder-gray-600"
							/>
						</div>

						{/* Send Button - Icon Only */}
						{message.trim() ? (
							<button
								onClick={broadcast}
								className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-500 hover:to-pink-500 transition active:scale-95 flex-shrink-0"
							>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
								</svg>
							</button>
						) : (
							<button className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0 opacity-50 cursor-not-allowed" disabled>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
									/>
								</svg>
							</button>
						)}
					</div>
				</div>
			</div>

			<style>{`
				/* Message In Animation */
				@keyframes messageIn {
					from {
						opacity: 0;
						transform: scale(0.95) translateY(10px);
					}
					to {
						opacity: 1;
						transform: scale(1) translateY(0);
					}
				}

				.animate-messageIn {
					animation: messageIn 0.2s ease-out;
				}

				/* Slide Up Animation */
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-slideUp {
					animation: slideUp 0.2s ease-out;
				}

				/* Custom Scrollbar */
				.custom-scrollbar::-webkit-scrollbar {
					width: 8px;
				}

				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}

				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #3a3a3c;
					border-radius: 4px;
				}

				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #48484a;
				}
			`}</style>
		</div>
	);
}
