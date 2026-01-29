import type { Chat } from "./types";

type ReplyBarProps = {
	replyingTo: Chat | null;
	username: string;
	onCancel: () => void;
};

export default function ReplyBar({ replyingTo, username, onCancel }: ReplyBarProps) {
	if (!replyingTo) return null;

	return (
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
				<button onClick={onCancel} className="p-1 hover:bg-gray-800 rounded-full transition flex-shrink-0 active:scale-95">
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	);
}
