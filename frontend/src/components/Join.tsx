import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
	sender?: string;
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
	const [maxSize, setMaxsize] = useState(2);
	const [status, setStatus] = useState<"loading" | "joined" | "invalid">("loading");
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Chat[]>([]);
	const [role, setRole] = useState<"ADMIN" | "USER">("USER");
	const [username, setUsername] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [copied, setCopied] = useState(false);
	const [replyingTo, setReplyingTo] = useState<Chat | null>(null);
	const [uploadingMedia, setUploadingMedia] = useState(false);
	const [previewMedia, setPreviewMedia] = useState<{
		url: string;
		type: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fileRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const lastMetaRef = useRef<{
		fileType: string;
		fileName: string;
		sender?: string;
	} | null>(null);

	/* ---------------- AUTO SCROLL ---------------- */
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (!ws) return;
		const handleClose = () => {
			setError("Room ended by admin");
			setTimeout(() => {
				window.location.href = "/";
			}, 2000);
		};
		ws.addEventListener("close", handleClose);
		return () => ws?.removeEventListener("close", handleClose);
	}, [ws]);

	useEffect(() => {
		const esc = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setPreviewMedia(null);
				setShowEmojiPicker(false);
			}
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

		const handler = (event: MessageEvent) => {
			/* ---------- STRING (JSON) ---------- */
			if (typeof event.data === "string") {
				const data = JSON.parse(event.data);

				if (data.type === "JOINED_ROOM") {
					setRole(data.payload.role);
					setUsername(data.payload.name);
					setStatus("joined");
					setMaxsize(data.payload.maxSize);
				}

				if (data.type === "ERROR") {
					setStatus("invalid");
				}

				if (data.type === "ADMIN_CHANGED") {
					setRole(data.payload.role);
					setMaxsize(data.payload.maxSize.toString());
				}

				if (data.type === "MESSAGE") {
					setMessages((prev) => [
						...prev,
						{
							id: nanoid(),
							text: data.payload.message,
							replyTo: data.payload.replyTo ?? undefined,
							sender: data.payload.sender,
							me: false,
						},
					]);
				}
				// ⭐ store meta
				if (data.type === "MEDIA_META") {
					lastMetaRef.current = {
						...data.payload,
						sender: data.payload.sender,
					};
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
					sender: meta.sender,
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
				payload: {
					message,
					replyTo: replyingTo
						? {
								id: replyingTo.id,
								text: replyingTo.text,
								file: replyingTo.file,
							}
						: null,
				},
			}),
		);

		const newMessage: Chat = {
			id: nanoid(),
			text: message,
			me: true,
			sender: username,
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
		inputRef.current?.focus();
	}

	function endChat() {
		ws?.send(JSON.stringify({ type: "TERMINATE" }));
		window.location.href = "/";
	}

	function leaveChat() {
		window.location.href = "/";
	}

	/* ---------------- FILE UPLOAD ---------------- */
	async function handleFile(e: any) {
		const file = e.target.files[0];
		if (!file || !ws) return;

		setUploadingMedia(true);

		try {
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
				sender: username, // ⭐ ADD THIS
			};

			setMessages((prev) => [...prev, newMessage]);

			setTimeout(() => URL.revokeObjectURL(url), 60000);
		} catch (err) {
			setError("Failed to upload media");
			setTimeout(() => setError(null), 3000);
		} finally {
			setUploadingMedia(false);
		}
	}

	/* ---------------- COPY ROOM ID ---------------- */
	function copyRoomId() {
		if (roomId) {
			navigator.clipboard
				.writeText(roomId)
				.then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				})
				.catch(() => {
					setError("Failed to copy room ID");
					setTimeout(() => setError(null), 3000);
				});
		}
	}

	/* ---------------- EMOJI HANDLER ---------------- */
	function addEmoji(emoji: string) {
		setMessage((prev) => prev + emoji);
		inputRef.current?.focus();
	}

	function cancelReply() {
		setReplyingTo(null);
	}

	/* ---------------- DOUBLE CLICK TO REPLY (WEB) ---------------- */

	/* ---------------- EMOJI CATEGORIES ---------------- */
	const emojiCategories = {
		Smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋"],
		Gestures: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎"],
		Hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌"],
		Animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆"],
		Food: ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬"],
		Sports: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳"],
		Activities: ["🎮", "🕹", "🎲", "🎯", "🎳", "🎰", "🎨", "🎭", "🎪", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻"],
		Travel: ["✈️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥", "🛳", "⛴", "🚢", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊"],
	};

	/* ---------------- STATES ---------------- */
	if (status === "loading")
		return (
			<div className="h-screen flex items-center justify-center bg-black">
				<div className="text-center space-y-6">
					<div className="relative w-20 h-20 mx-auto">
						<div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
						<div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
					</div>
					<div className="space-y-2">
						<p className="text-white text-lg font-semibold">Connecting to room</p>
						<div className="flex items-center justify-center gap-1">
							<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
							<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
							<div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
						</div>
					</div>
				</div>
			</div>
		);

	if (status === "invalid")
		return (
			<div className="h-screen flex items-center justify-center bg-black p-4">
				<div className="text-center space-y-6 max-w-md">
					<div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
						<svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<h1 className="text-white text-2xl font-bold">Room Not Found</h1>
						<p className="text-gray-400 text-sm leading-relaxed">This room may have expired, been deleted, or doesn't exist. Please check the room ID and try again.</p>
					</div>
					<button
						onClick={() => (window.location.href = "/")}
						className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-500 hover:to-pink-500 transition active:scale-95 shadow-lg"
					>
						Return Home
					</button>
				</div>
			</div>
		);

	const isGroupChat = maxSize > 2;

	/* ---------------- UI ---------------- */
	return (
		<div className="flex flex-col bg-black text-white overflow-hidden h-[100dvh]">
			{" "}
			{/* ERROR TOAST */}
			{error && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
					<div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span className="text-sm font-medium">{error}</span>
					</div>
				</div>
			)}
			{/* HEADER */}
			<div className="flex-shrink-0 border-b border-gray-800 bg-black">
				<div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
					{/* Left - User Info */}
					<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
							<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
								{username.charAt(0).toUpperCase()}
							</div>
						{/* {!isGroupChat && (
						)} */}
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold truncate">{`${username}`}</p>
							<div className="flex items-center gap-2 text-xs text-gray-500">
								<span className="truncate">ID: {roomId?.slice(0, 8)}...</span>
								<button onClick={copyRoomId} className="flex-shrink-0 hover:text-gray-400 transition active:scale-95" title="Copy Room ID">
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

					{/* Right - Action Buttons */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<button
							onClick={leaveChat}
							className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 transition active:scale-95 flex items-center gap-1.5"
						>
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							<span className="hidden sm:inline">Leave</span>
						</button>
						{role === "ADMIN" && (
							<button
								onClick={endChat}
								className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition active:scale-95 flex items-center gap-1.5"
							>
								<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
								<span className="hidden sm:inline">End</span>
							</button>
						)}
					</div>
				</div>
			</div>
			{/* MESSAGES AREA */}
			<div className="flex-1 overflow-y-auto pb-2">
				{" "}
				<div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-2">
					{messages.length === 0 && (
						<div className="flex flex-col items-center justify-center h-full text-gray-600 py-20">
							<div className="w-20 h-20 rounded-full border-4 border-gray-800 flex items-center justify-center text-3xl mb-4">💬</div>
							<p className="text-sm font-medium">No messages yet</p>
							<p className="text-xs text-gray-700 mt-1">Send a message to start the conversation</p>
						</div>
					)}

					{messages.map((m) => {
						return (
							<div key={m.id} className={`flex gap-2 items-end ${m.me ? "flex-row-reverse" : "flex-row"} animate-messageIn`}>
								{/* Avatar */}
								{!m.me && (
									<div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
										{m.sender?.charAt(0).toUpperCase()}
									</div>
								)}

								<div className={`max-w-[75%] sm:max-w-md flex flex-col ${m.me ? "items-end" : "items-start"}`}>
									{/* ✅ ALWAYS SHOW NAME */}
									{isGroupChat && m.sender && !m.me && <span className={`text-xs mb-1 font-medium px-1 ${m.me ? "text-purple-300 text-right" : "text-gray-400"}`}>{m.sender}</span>}

									{/* Bubble */}
									<div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm break-words ${m.me ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-900 text-white"}`}>
										{m.text && <span>{m.text}</span>}

										{m.file && m.file.type.startsWith("image") && (
											<img
												src={m.file.url}
												className="rounded-2xl w-full max-h-80 object-cover cursor-pointer"
												onClick={() =>
													setPreviewMedia({
														url: m.file!.url,
														type: m.file!.type,
													})
												}
												draggable={false}
												onContextMenu={(e) => e.preventDefault()}
												alt="shared media"
											/>
										)}

										{m.file && m.file.type.startsWith("video") && (
											<video
												src={m.file.url}
												controls
												controlsList="nodownload noplaybackrate noremoteplayback"
												disablePictureInPicture
												onContextMenu={(e) => e.preventDefault()}
												className="rounded-2xl max-h-64 w-full object-contain mt-1"
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
			{/* EMOJI PICKER */}
			{showEmojiPicker && (
				<div
					ref={emojiPickerRef}
					className="absolute bottom-14 sm:bottom-20 left-2 right-2 sm:left-4 sm:right-auto sm:w-80 md:w-96 bg-[#1c1c1e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-slideUp max-h-96"
				>
					<div className="sticky top-0 bg-[#1c1c1e] p-3 border-b border-gray-800 flex items-center justify-between z-10">
						<h3 className="text-sm font-semibold">Emojis</h3>
						<button onClick={() => setShowEmojiPicker(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition active:scale-95">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="overflow-y-auto p-3 space-y-4 custom-scrollbar" style={{ maxHeight: "20rem" }}>
						{Object.entries(emojiCategories).map(([category, emojis]) => (
							<div key={category}>
								<p className="text-xs text-gray-500 font-semibold mb-2 sticky top-0 bg-[#1c1c1e] py-1">{category}</p>
								<div className="grid grid-cols-8 gap-1">
									{emojis.map((emoji, idx) => (
										<button
											key={idx}
											onClick={() => {
												addEmoji(emoji);
												setShowEmojiPicker(false);
											}}
											className="text-2xl p-2 hover:bg-gray-800 rounded-lg transition active:scale-90"
										>
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
				<div className="border-t border-gray-800 bg-gray-900/50 flex-shrink-0">
					<div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							<svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
							</svg>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-gray-500">Replying to {replyingTo.me ? "yourself" : replyingTo.sender || username}</p>
								<p className="text-sm text-gray-300 truncate">{replyingTo.text || "📷 Media"}</p>
							</div>
						</div>
						<button onClick={cancelReply} className="p-1 hover:bg-gray-800 rounded-full transition flex-shrink-0 active:scale-95">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			)}
			{/* INPUT BAR */}
			<div className="flex-shrink-0 border-t border-gray-800 bg-black">
				<div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
					<div className="flex items-center gap-1 sm:gap-2">
						{/* Message Input */}
						<div className="flex-1 relative order-2">
							<input
								ref={inputRef}
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && broadcast()}
								placeholder="Message..."
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gray-900 border border-gray-800 focus:outline-none focus:border-gray-700 text-sm transition placeholder-gray-600"
							/>
						</div>

						{/* Emoji Button (Left on Mobile) */}
						<button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0 order-1">
							<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</button>

						{/* Attach Button (Right on Mobile) */}
						<button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0 order-3" disabled={uploadingMedia}>
							{uploadingMedia ? (
								<div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
							) : (
								<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

						{/* Send Button */}
						<button
							onClick={broadcast}
							className={`p-2 sm:p-2.5 rounded-full transition active:scale-95 flex-shrink-0 order-4 ${
								message.trim() ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" : "bg-transparent opacity-40"
							}`}
							disabled={!message.trim()}
						>
							<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
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

				/* Slide Down Animation */
				@keyframes slideDown {
					from {
						opacity: 0;
						transform: translate(-50%, -20px);
					}
					to {
						opacity: 1;
						transform: translate(-50%, 0);
					}
				}

				.animate-slideDown {
					animation: slideDown 0.3s ease-out;
				}

				/* Custom Scrollbar */
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}

				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}

				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #3a3a3c;
					border-radius: 3px;
				}

				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #48484a;
				}

				/* Prevent text selection during drag */
				.select-none {
					user-select: none;
					-webkit-user-select: none;
				}
			`}</style>
			{/* MEDIA PREVIEW MODAL */}
			{previewMedia && (
				<div className="fixed inset-0 z-[9999] bg-black" style={{ height: "100dvh", width: "100vw" }} onClick={() => setPreviewMedia(null)}>
					<div className="absolute inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
						<button onClick={() => setPreviewMedia(null)} className="absolute top-4 left-4 p-2 rounded-full bg-black/60 active:scale-95 z-10">
							{" "}
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						{previewMedia.type.startsWith("image") && (
							<img src={previewMedia.url} draggable={false} onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-contain select-none" />
						)}

						{previewMedia.type.startsWith("video") && (
							<video
								src={previewMedia.url}
								autoPlay
								controls
								controlsList="nodownload noplaybackrate noremoteplayback"
								disablePictureInPicture
								onContextMenu={(e) => e.preventDefault()}
								className="w-full h-full object-cover"
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
