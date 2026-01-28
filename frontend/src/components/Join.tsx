import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketProvider";
import { nanoid } from "nanoid";

type Chat = {
	id: string;
	text?: string;
	file?: {
		url: string;
		type: string;
		name: string;
	};
	me: boolean;
	replyTo?: {
		id: string;
		text?: string;
		file?: {
			url: string;
			type: string;
			name: string;
		};
	};
};

export default function Join() {
	const { roomId } = useParams();
	const ws = useContext(SocketContext);
	const navigate = useNavigate();
	const [maxSize, setMaxsize] = useState("2");
	const [status, setStatus] = useState<"loading" | "joined" | "invalid">("loading");
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Chat[]>([]);
	const [role, setRole] = useState<"ADMIN" | "USER">("USER");
	const [username, setUsername] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [copied, setCopied] = useState(false);
	const [replyingTo, setReplyingTo] = useState<Chat | null>(null);
	const [uploadingMedia, setUploadingMedia] = useState(false);
	const [draggedMessage, setDraggedMessage] = useState<string | null>(null);
	const [dragStartX, setDragStartX] = useState(0);
	const [previewMedia, setPreviewMedia] = useState<{
		url: string;
		type: string;
	} | null>(null);

	const fileRef = useRef<HTMLInputElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const lastMetaRef = useRef<{
		fileType: string;
		fileName: string;
	} | null>(null);
	/* ---------------- AUTO SCROLL ---------------- */

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!ws) return;
		const handleClose = () => {
			alert("Room ended");
			window.location.href = "/";
		};
		ws.addEventListener("close", handleClose);
		return () => ws?.removeEventListener("close", handleClose);
	}, [ws]);

	useEffect(() => {
		const esc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setPreviewMedia(null);
		};

		window.addEventListener("keydown", esc);
		return () => window.removeEventListener("keydown", esc);
	}, []);
	useEffect(() => {
		if (previewMedia) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.body.style.overflow = "auto";
		};
	}, [previewMedia]);
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
		if (!ws || !roomId) {
			window.location.href = "/";
			return;
		}

		ws.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId },
			}),
		);

		// const handler = (event: MessageEvent) => {
		// 	const data = JSON.parse(event.data);
		// 	if (typeof event.data === "string") {
		// 		if (data.type === "JOINED_ROOM") {
		// 			setRole(data.payload.role);
		// 			setUsername(data.payload.name);
		// 			console.log("ROLE FROM SERVER →", data.payload.role);
		// 			console.log(role);
		// 			setStatus("joined");
		// 		}

		// 		if (data.type === "JOIN_FAILED") setStatus("invalid");
		// 		if (data.type === "ADMIN_CHANGED") {
		// 			const curRole = data.payload.role;
		// 			console.log(curRole);
		// 			setRole(curRole);
		// 		}
		// 		if (data.type === "MESSAGE") {
		// 			setMessages((prev) => [
		// 				...prev,
		// 				{
		// 					id: nanoid(),
		// 					text: data.payload.message,
		// 					me: false,
		// 				},
		// 			]);
		// 		}
		// 		if (data.type === "MEDIA_META") {
		// 			lastMetaRef.current = data.payload;
		// 		}
		// 		return;
		// 	}
		// 	const meta = lastMetaRef.current;
		// 	if (!meta) return;

		// 	const blob = new Blob([event.data], {
		// 		type: meta.fileType,
		// 	});

		// 	const url = URL.createObjectURL(blob);

		// 	setMessages((prev) => [
		// 		...prev,
		// 		{
		// 			id: nanoid(),
		// 			file: {
		// 				url,
		// 				type: meta.fileType,
		// 				name: meta.fileName,
		// 			},
		// 			me: false,
		// 		},
		// 	]);

		// 	lastMetaRef.current = null;
		// };

		const handler = (event: MessageEvent) => {
			/* ---------- STRING (JSON) ---------- */
			if (typeof event.data === "string") {
				const data = JSON.parse(event.data);

				if (data.type === "JOINED_ROOM") {
					setRole(data.payload.role);
					setUsername(data.payload.name);
					setStatus("joined");
					setMaxsize(data.payload.maxSize.toString());
				}

				if (data.type === "ERROR") {
					setStatus("invalid");
				}

				if (data.type === "ADMIN_CHANGED") {
					setRole(data.payload.role);
				}

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

				// ⭐ store meta
				if (data.type === "MEDIA_META") {
					lastMetaRef.current = data.payload;
				}

				return;
			}

			/* ---------- BINARY (MEDIA) ---------- */

			const meta = lastMetaRef.current;
			if (!meta) return;

			const blob = new Blob([event.data], { type: meta.fileType });
			const url = URL.createObjectURL(blob);

			setMessages((prev) => [
				...prev,
				{
					id: nanoid(),
					file: {
						url,
						type: meta.fileType,
						name: meta.fileName,
					},
					me: false,
				},
			]);

			lastMetaRef.current = null;
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

		const newMessage: Chat = {
			id: nanoid(),
			text: message,
			me: true,
		};

		if (replyingTo) {
			newMessage.replyTo = {
				id: replyingTo.id,
				text: replyingTo.text,
				file: replyingTo.file,
			};
		}

		setMessages((prev) => [...prev, newMessage]);
		setMessage("");
		setReplyingTo(null);
		setShowEmojiPicker(false);
	}

	function endChat() {
		ws?.send(JSON.stringify({ type: "TERMINATE" }));
		window.location.href = "/";
	}
	function leaveChat() {
		window.location.href = "/";
	}

	/* ---------------- FILE UPLOAD ---------------- */
	// async function handleFile(e: any) {
	// 	const file = e.target.files[0];
	// 	if (!file) return;

	// 	setUploadingMedia(true);

	// 	// Simulate upload delay
	// 	await new Promise((resolve) => setTimeout(resolve, 1000));

	// 	const url = URL.createObjectURL(file);

	// 	const newMessage: Chat = {
	// 		id: nanoid(),
	// 		file: url,
	// 		me: true,
	// 	};

	// 	if (replyingTo) {
	// 		newMessage.replyTo = {
	// 			id: replyingTo.id,
	// 			text: replyingTo.text,
	// 			file: replyingTo.file,
	// 		};
	// 	}

	// 	setMessages((prev) => [...prev, newMessage]);
	// 	setUploadingMedia(false);
	// 	setReplyingTo(null);

	// 	setTimeout(() => URL.revokeObjectURL(url), 60000);
	// }

	async function handleFile(e: any) {
		const file = e.target.files[0];
		if (!file || !ws) return;

		setUploadingMedia(true);

		// send meta first
		ws.send(
			JSON.stringify({
				type: "MEDIA_META",
				payload: {
					fileName: file.name,
					fileType: file.type,
				},
			}),
		);

		// send binary
		ws.send(file);

		// local preview (same UI)
		const url = URL.createObjectURL(file);

		const newMessage: Chat = {
			id: nanoid(),
			file: {
				url,
				type: file.type,
				name: file.name,
			},
			me: true,
		};

		setMessages((prev) => [...prev, newMessage]);

		setUploadingMedia(false);

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

	/* ---------------- REPLY HANDLER ---------------- */
	function handleReply(msg: Chat) {
		setReplyingTo(msg);
	}

	function cancelReply() {
		setReplyingTo(null);
	}

	/* ---------------- DOUBLE CLICK TO REPLY (WEB) ---------------- */
	function handleDoubleClick(msg: Chat) {
		handleReply(msg);
	}

	/* ---------------- DRAG TO REPLY (MOBILE) ---------------- */
	function handleTouchStart(e: React.TouchEvent, msgId: string) {
		setDragStartX(e.touches[0].clientX);
		setDraggedMessage(msgId);
	}

	function handleTouchMove(e: React.TouchEvent, msg: Chat) {
		if (!draggedMessage) return;

		const currentX = e.touches[0].clientX;
		const diff = currentX - dragStartX;

		// If dragged more than 50px to the right, trigger reply
		if (diff > 50) {
			handleReply(msg);
			setDraggedMessage(null);
		}
	}

	function handleTouchEnd() {
		setDraggedMessage(null);
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
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<button onClick={() => leaveChat()} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0" title="Leave Chat">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
								{username.charAt(0).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold truncate">{username}</p>
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<span className="truncate">ID: {roomId?.slice(0, 8)}...</span>
									<button onClick={copyRoomId} className="flex-shrink-0 hover:text-gray-400 transition" title="Copy Room ID">
										{copied ? (
											<svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										) : (
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
												/>
											</svg>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Right - End Chat for Admin */}
					{role === "ADMIN" && (
						<button
							onClick={endChat}
							className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition active:scale-95 flex-shrink-0"
						>
							End Chat
						</button>
					)}
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
							<div
								key={m.id}
								className={`group flex gap-2 items-end ${m.me ? "flex-row-reverse" : "flex-row"} animate-messageIn`}
								onDoubleClick={() => handleDoubleClick(m)}
								onTouchStart={(e) => handleTouchStart(e, m.id)}
								onTouchMove={(e) => handleTouchMove(e, m)}
								onTouchEnd={handleTouchEnd}
							>
								{/* Avatar for received messages */}
								{!m.me && (
									<div
										className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 ${showAvatar ? "visible" : "invisible"}`}
									>
										{username.charAt(0).toUpperCase()}
									</div>
								)}

								{/* Message Bubble */}
								<div className={`max-w-[70%] sm:max-w-md ${m.me ? "items-end" : "items-start"} flex flex-col gap-0.5 relative`}>
									{/* Reply Icon (Web only - shows on hover) */}
									<button
										onClick={() => handleReply(m)}
										className={`hidden sm:block absolute top-1/2 -translate-y-1/2 ${m.me ? "-left-8" : "-right-8"} p-1.5 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition`}
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
										</svg>
									</button>

									<div
										className={`px-4 py-2 rounded-3xl text-sm break-words ${
											m.me ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md" : "bg-gray-900 text-white rounded-bl-md"
										}`}
									>
										{/* Reply Preview */}
										{m.replyTo && (
											<div className={`mb-2 pb-2 border-l-2 pl-2 text-xs opacity-70 ${m.me ? "border-white/30" : "border-gray-700"}`}>
												{m.replyTo.text && <p className="italic">{m.replyTo.text}</p>}
												{m.replyTo.file && <p className="italic">📷 Photo</p>}
											</div>
										)}

										{m.text && <span>{m.text}</span>}
										{m.file && (
											<>
												{m.file.type.startsWith("image") && (
													<img
														src={m.file.url}
														onClick={() =>
															setPreviewMedia({
																url: m.file!.url,
																type: m.file!.type,
															})
														}
														className="rounded-2xl max-h-80 w-full object-cover cursor-pointer hover:opacity-95 transition"
														alt="shared media"
													/>
												)}

												{m.file.type.startsWith("video") && (
													<video
														src={m.file.url}
														controls
														onClick={() =>
															setPreviewMedia({
																url: m.file!.url,
																type: m.file!.type,
															})
														}
														className="rounded-2xl max-h-80 w-full cursor-pointer"
													/>
												)}

												{m.file.type.startsWith("audio") && <audio src={m.file.url} controls />}
											</>
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

			{/* REPLY BAR */}
			{replyingTo && (
				<div className="border-t border-gray-800 bg-gray-900/50">
					<div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
							</svg>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-gray-500">Replying to {replyingTo.me ? "yourself" : username}</p>
								<p className="text-sm text-gray-300 truncate">{replyingTo.text || "📷 Photo"}</p>
							</div>
						</div>
						<button onClick={cancelReply} className="p-1 hover:bg-gray-800 rounded-full transition flex-shrink-0">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
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
						<button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0" disabled={uploadingMedia}>
							{uploadingMedia ? (
								<div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
							) : (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
									/>
								</svg>
							)}
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

						{/* Send Button - Dynamic Icon */}
						<button
							onClick={broadcast}
							className={`p-2.5 rounded-full transition active:scale-95 flex-shrink-0 ${
								message.trim() ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" : "bg-transparent opacity-40"
							}`}
							disabled={!message.trim()}
						>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
							</svg>
						</button>
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
			{previewMedia && (
				<div className="fixed inset-0 bg-black z-[9999] flex flex-col" style={{ height: "100dvh" }} onClick={() => setPreviewMedia(null)}>
					{/* ---------- TOP BAR ---------- */}
					<div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-md">
						{/* MOBILE BACK BUTTON */}
						<button onClick={() => setPreviewMedia(null)} className="p-2 active:scale-95">
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>

						<span className="text-white text-sm font-medium">Preview</span>

						{/* DESKTOP CLOSE */}
						<button onClick={() => setPreviewMedia(null)} className="hidden sm:block text-white text-2xl font-bold hover:opacity-70">
							✕
						</button>
					</div>

					{/* ---------- MEDIA AREA ---------- */}
					<div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
						{previewMedia.type.startsWith("image") && <img src={previewMedia.url} className="max-h-full max-w-full object-contain rounded-lg" />}

						{previewMedia.type.startsWith("video") && <video src={previewMedia.url} controls autoPlay className="max-h-full max-w-full rounded-lg" />}

						{previewMedia.type.startsWith("audio") && <audio src={previewMedia.url} controls autoPlay />}
					</div>
				</div>
			)}
		</div>
	);
}
