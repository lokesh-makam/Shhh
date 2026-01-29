import React, { useRef } from "react";
import type { Chat } from "./types";

type MessageProps = {
	message: Chat;
	isGroupChat: boolean;
	onReply: (message: Chat) => void;
	onPreviewMedia: (url: string, type: string) => void;
};

export default function Message({ message: m, isGroupChat, onReply, onPreviewMedia }: MessageProps) {
	const dragRef = useRef<{ id: string | null; startX: number }>({
		id: null,
		startX: 0,
	});

	function handleTouchStart(e: React.TouchEvent, id: string) {
		dragRef.current = {
			id,
			startX: e.touches[0].clientX,
		};

		const el = document.getElementById("msg-" + id);
		if (el) el.style.transition = "none";
	}

	function handleTouchMove(e: React.TouchEvent) {
		const dx = e.touches[0].clientX - dragRef.current.startX;
		const el = document.getElementById("msg-" + dragRef.current.id);

		if (!el || dx <= 0) return;

		const MAX = 110;

		// ⭐ rubber effect (WhatsApp style resistance)
		const move = dx < MAX ? dx : MAX + (dx - MAX) * 0.25;

		el.style.transform = `translateX(${move}px)`;
	}

	function handleTouchEnd() {
		const el = document.getElementById("msg-" + m.id);
		if (!el) return;

		const matrix = new DOMMatrix(getComputedStyle(el).transform);
		const moved = matrix.m41;

		el.style.transition = "transform 0.25s cubic-bezier(.22,.61,.36,1)";

		if (moved > 75) {
			onReply(m);
		}

		el.style.transform = "translateX(0)";
	}

	return (
		<div
			id={"msg-" + m.id}
			onDoubleClick={() => onReply(m)}
			onTouchStart={(e) => handleTouchStart(e, m.id)}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			className={`group flex gap-2 items-center ${m.me ? "flex-row-reverse" : "flex-row"} animate-messageIn`}
		>
			{/* Avatar */}
			{!m.me && <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">{m.sender?.charAt(0).toUpperCase()}</div>}

			<div className={`relative max-w-[75%] sm:max-w-md flex flex-col ${m.me ? "items-center" : "items-start"}`}>
				{/* Reply button */}
				<button
					onClick={() => onReply(m)}
					className={`
  absolute ${m.me ? "-left-9" : "-right-9"}
  top-1/2 -translate-y-1/3
  flex items-center justify-center
  opacity-0 group-hover:opacity-100
  scale-75 group-hover:scale-100
  transition-all duration-200
  bg-gray-800/90 backdrop-blur
  hover:bg-gray-700
  shadow-lg
  p-2 rounded-full
  active:scale-90
`}
				>
					<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
						<path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
					</svg>
				</button>

				{/* Name */}
				{isGroupChat && m.sender && !m.me && <span className="text-xs mb-1 font-medium px-1 text-gray-400">{m.sender}</span>}

				{/* Bubble */}
				<div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm break-words ${m.me ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-gray-900 text-white"}`}>
					{/* Reply preview */}
					{m.replyTo && (
						<div className={`mb-2 px-2 py-1 rounded-lg text-xs border-l-2 border-purple-500 ${m.me ? "bg-white/10" : "bg-gray-800"}`}>
							<p className="truncate text-gray-300">{m.replyTo.text ?? "📷 Media"}</p>
						</div>
					)}
					{m.text && <span>{m.text}</span>}
					{m.file && m.file.type.startsWith("image") && (
						<img src={m.file.url} className="rounded-2xl w-full max-h-80 object-cover cursor-pointer" onClick={() => onPreviewMedia(m.file!.url, m.file!.type)} />
					)}
					{m.file && m.file.type.startsWith("video") && (
						<video
							src={m.file.url}
							controls
							controlsList="nodownload noplaybackrate"
							disablePictureInPicture
							onContextMenu={(e) => e.preventDefault()}
							className="rounded-2xl max-h-64 w-full object-contain mt-1"
						/>
					)}{" "}
				</div>
			</div>
		</div>
	);
}
