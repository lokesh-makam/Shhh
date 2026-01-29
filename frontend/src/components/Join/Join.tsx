import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketProvider";
import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import type { Chat, Role, Status } from "./types";
import LoadingScreen from "./LoadingScreen";
import InvalidRoomScreen from "./InvalidRoomScreen";
import ErrorToast from "./ErrorToast";
import Header from "./Header";
import MessageList from "./MessageList";
import ReplyBar from "./ReplyBar";
import InputBar from "./InputBar";
import EmojiPicker from "./EmojiPicker";
import MediaPreviewModal from "./MediaPreviewModal";
import ConfirmEndChatModal from "./ConfirmEndChatModal";

export default function Join() {
	const { roomId } = useParams();
	const ws = useContext(SocketContext);
	const [maxSize, setMaxsize] = useState(2);
	const [status, setStatus] = useState<Status>("loading");
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Chat[]>([]);
	const [role, setRole] = useState<Role>("USER");
	const [username, setUsername] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [replyingTo, setReplyingTo] = useState<Chat | null>(null);
	const [uploadingMedia, setUploadingMedia] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [previewMedia, setPreviewMedia] = useState<{
		url: string;
		type: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const lastMetaRef = useRef<{
		fileType: string;
		fileName: string;
		sender?: string;
	} | null>(null);
	const location = useLocation();
	const name = location.state?.name;
	const containerRef = useRef<HTMLDivElement>(null);

	// Handle viewport height changes for mobile keyboard
	useEffect(() => {
		const updateHeight = () => {
			if (containerRef.current) {
				const vh = window.visualViewport?.height || window.innerHeight;
				containerRef.current.style.height = `${vh}px`;
			}
		};

		updateHeight();
		window.visualViewport?.addEventListener("resize", updateHeight);
		window.visualViewport?.addEventListener("scroll", updateHeight);

		return () => {
			window.visualViewport?.removeEventListener("resize", updateHeight);
			window.visualViewport?.removeEventListener("scroll", updateHeight);
		};
	}, []);

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

	/* ---------------- JOIN LOGIC ---------------- */
	useEffect(() => {
		if (!ws || !roomId) {
			window.location.href = "/";
			return;
		}

		ws.send(
			JSON.stringify({
				type: "JOIN_ROOM",
				payload: { roomId, username: name },
			}),
		);

		const handler = (event: MessageEvent) => {
			/* ---------- STRING (JSON) ---------- */
			if (typeof event.data === "string") {
				const data = JSON.parse(event.data);

				if (data.type === "JOINED_ROOM") {
					setRole(data.payload.role);
					setUsername(data.payload.username);
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
	}

	function confirmEndChat() {
		ws?.send(JSON.stringify({ type: "TERMINATE" }));
		toast.error("Chat ended");
		setTimeout(() => {
			window.location.href = "/";
		}, 1000);
	}

	function endChat() {
		setShowConfirm(true);
	}

	function leaveChat() {
		window.location.href = "/";
	}

	/* ---------------- FILE UPLOAD ---------------- */
	async function handleFile(e: any) {
		const file = e.target.files[0];
		if (!file || !ws) return;
		const MAX_SIZE = 50 * 1024 * 1024;

		if (file.size > MAX_SIZE) {
			toast.error("File too large (max 50MB)");
			return;
		}
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
				sender: username,
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

	/* ---------------- EMOJI HANDLER ---------------- */
	function addEmoji(emoji: string) {
		setMessage((prev) => prev + emoji);
	}

	function cancelReply() {
		setReplyingTo(null);
	}

	function handlePreviewMedia(url: string, type: string) {
		setPreviewMedia({ url, type });
	}

	/* ---------------- STATES ---------------- */
	if (status === "loading") return <LoadingScreen />;
	if (status === "invalid") return <InvalidRoomScreen />;

	const isGroupChat = maxSize > 2;

	/* ---------------- UI ---------------- */
	return (
		<div ref={containerRef} className="flex flex-col bg-black text-white h-[100dvh] overflow-hidden">
			<ErrorToast error={error} />

			<Header username={name} roomId={roomId} role={role} onLeaveChat={leaveChat} onEndChat={endChat} />

			<MessageList messages={messages} isGroupChat={isGroupChat} onReply={setReplyingTo} onPreviewMedia={handlePreviewMedia} />

			<ConfirmEndChatModal showConfirm={showConfirm} onCancel={() => setShowConfirm(false)} onConfirm={confirmEndChat} />

			<EmojiPicker showEmojiPicker={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} onEmojiSelect={addEmoji} />

			<ReplyBar replyingTo={replyingTo} username={name} onCancel={cancelReply} />

			<InputBar
				message={message}
				uploadingMedia={uploadingMedia}
				onMessageChange={setMessage}
				onSend={broadcast}
				onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
				onFileSelect={handleFile}
			/>

			<MediaPreviewModal previewMedia={previewMedia} onClose={() => setPreviewMedia(null)} />
		</div>
	);
}
