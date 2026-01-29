
type ConfirmEndChatModalProps = {
	showConfirm: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export default function ConfirmEndChatModal({ showConfirm, onCancel, onConfirm }: ConfirmEndChatModalProps) {
	if (!showConfirm) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
			<div className="w-[90%] max-w-sm rounded-3xl bg-[#1c1c1e] border border-gray-800 shadow-2xl p-6 space-y-5 animate-slideUp">
				{/* Icon */}
				<div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
					<svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>

				{/* Text */}
				<div className="text-center space-y-1">
					<h3 className="text-lg font-semibold text-white">End chat?</h3>
					<p className="text-sm text-gray-400">This will delete the room for everyone.</p>
				</div>

				{/* Buttons */}
				<div className="flex gap-3">
					<button onClick={onCancel} className="flex-1 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-sm font-medium transition active:scale-95">
						Cancel
					</button>

					<button
						onClick={onConfirm}
						className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-sm font-semibold transition active:scale-95"
					>
						End
					</button>
				</div>
			</div>
		</div>
	);
}
