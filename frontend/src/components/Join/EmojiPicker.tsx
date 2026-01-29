import  { useRef, useEffect } from "react";

type EmojiPickerProps = {
	showEmojiPicker: boolean;
	onClose: () => void;
	onEmojiSelect: (emoji: string) => void;
};

export default function EmojiPicker({ showEmojiPicker, onClose, onEmojiSelect }: EmojiPickerProps) {
	const emojiPickerRef = useRef<HTMLDivElement>(null);

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

	/* ---------------- CLOSE EMOJI PICKER ON OUTSIDE CLICK ---------------- */
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
				onClose();
			}
		}

		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker, onClose]);

	if (!showEmojiPicker) return null;

	return (
		<div
			ref={emojiPickerRef}
			className="absolute bottom-14 sm:bottom-20 left-2 right-2 sm:left-4 sm:right-auto sm:w-80 md:w-96 bg-[#1c1c1e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-slideUp max-h-96"
		>
			<div className="sticky top-0 bg-[#1c1c1e] p-3 border-b border-gray-800 flex items-center justify-between z-10">
				<h3 className="text-sm font-semibold">Emojis</h3>
				<button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-full transition active:scale-95">
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
										onEmojiSelect(emoji);
										onClose();
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
	);
}
