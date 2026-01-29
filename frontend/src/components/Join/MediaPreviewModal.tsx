import { useEffect } from "react";

type MediaPreviewModalProps = {
	previewMedia: { url: string; type: string } | null;
	onClose: () => void;
};

export default function MediaPreviewModal({ previewMedia, onClose }: MediaPreviewModalProps) {
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

	useEffect(() => {
		const esc = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", esc);
		return () => window.removeEventListener("keydown", esc);
	}, [onClose]);

	if (!previewMedia) return null;

	return (
		<div className="fixed inset-0 z-[9999] bg-black" style={{ height: "100dvh", width: "100vw" }} onClick={onClose}>
			<div className="absolute inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
				<button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-black/60 active:scale-95 z-10">
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
						controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
						disablePictureInPicture
						preload="metadata"
						onContextMenu={(e) => e.preventDefault()}
						onDragStart={(e) => e.preventDefault()}
						className="w-full h-full object-cover select-none"
					/>
				)}
			</div>
		</div>
	);
}
