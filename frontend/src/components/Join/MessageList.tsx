import React, { useRef, useEffect } from "react";
import Message from "./Message";
import type { Chat } from "./types";

type MessageListProps = {
	messages: Chat[];
	isGroupChat: boolean;
	onReply: (message: Chat) => void;
	onPreviewMedia: (url: string, type: string) => void;
};

export default function MessageList({ messages, isGroupChat, onReply, onPreviewMedia }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	/* ---------------- AUTO SCROLL ---------------- */
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
		<div className="flex-1 overflow-y-auto pb-2">
			<div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-2">
				{messages.length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-gray-600 py-20">
						<div className="w-20 h-20 rounded-full border-4 border-gray-800 flex items-center justify-center text-3xl mb-4">💬</div>
						<p className="text-sm font-medium">No messages yet</p>
						<p className="text-xs text-gray-700 mt-1">Send a message to start the conversation</p>
					</div>
				)}

				{messages.map((m) => (
					<Message key={m.id} message={m} isGroupChat={isGroupChat} onReply={onReply} onPreviewMedia={onPreviewMedia} />
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
