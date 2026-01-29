type ErrorToastProps = {
	error: string | null;
};

export default function ErrorToast({ error }: ErrorToastProps) {
	if (!error) return null;

	return (
		<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
			<div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span className="text-sm font-medium">{error}</span>
			</div>
		</div>
	);
}
