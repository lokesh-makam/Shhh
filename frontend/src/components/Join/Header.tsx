import  { useState } from "react";
import type { Role } from "./types";

type HeaderProps = {
	username: string;
	roomId: string | undefined;
	role: Role;
	onLeaveChat: () => void;
	onEndChat: () => void;
};

export default function Header({ username, roomId, role, onLeaveChat, onEndChat }: HeaderProps) {
	const [copied, setCopied] = useState(false);

	function copyRoomId() {
		if (!roomId) return;

		const copyModern = async () => {
			try {
				await navigator.clipboard.writeText(roomId);
				return true;
			} catch {
				return false;
			}
		};

		const copyFallback = () => {
			const textArea = document.createElement("textarea");
			textArea.value = roomId;
			textArea.style.position = "fixed";
			textArea.style.opacity = "0";
			document.body.appendChild(textArea);

			textArea.focus();
			textArea.select();

			const success = document.execCommand("copy");
			document.body.removeChild(textArea);

			return success;
		};

		(async () => {
			const ok = (await copyModern()) || copyFallback();

			if (ok) {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		})();
	}

	return (
		<div className="flex-shrink-0 border-b border-gray-800 bg-black">
			<div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
				{/* Left - User Info */}
				<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
					<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
						{username.charAt(0).toUpperCase()}
					</div>
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
						onClick={onLeaveChat}
						className="px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 transition active:scale-95 flex items-center gap-1.5"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						<span className="hidden sm:inline">Leave</span>
					</button>
					{role === "ADMIN" && (
						<button
							onClick={onEndChat}
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
	);
}
