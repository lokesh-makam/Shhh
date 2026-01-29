import React, { useRef } from "react";

type InputBarProps = {
	message: string;
	uploadingMedia: boolean;
	onMessageChange: (message: string) => void;
	onSend: () => void;
	onEmojiClick: () => void;
	onFileSelect: (e: any) => void;
};

export default function InputBar({ message, uploadingMedia, onMessageChange, onSend, onEmojiClick, onFileSelect }: InputBarProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="flex-shrink-0 border-t border-gray-800 bg-black">
			<div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
				<div className="flex items-center gap-1 sm:gap-2">
					{/* Message Input */}
					<div className="flex-1 relative order-2">
						<input
							ref={inputRef}
							value={message}
							onChange={(e) => onMessageChange(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && onSend()}
							placeholder="Message..."
							className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gray-900 border border-gray-800 focus:outline-none focus:border-gray-700 text-sm transition placeholder-gray-600"
						/>
					</div>

					{/* Emoji Button (Left on Mobile) */}
					<button onClick={onEmojiClick} className="p-2 hover:bg-gray-900 rounded-full transition active:scale-95 flex-shrink-0 order-1">
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

					<input ref={fileRef} type="file" className="hidden" onChange={onFileSelect} accept="image/*,video/*,audio/*" />

					{/* Send Button */}
					<button
						onClick={onSend}
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
	);
}
