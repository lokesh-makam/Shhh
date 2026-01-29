export default function InvalidRoomScreen() {
	return (
		<div className="h-screen flex items-center justify-center bg-black p-4">
			<div className="text-center space-y-6 max-w-md">
				<div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
					<svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div className="space-y-2">
					<h1 className="text-white text-2xl font-bold">Room Not Found</h1>
					<p className="text-gray-400 text-sm leading-relaxed">This room may have expired, been deleted, or doesn't exist. Please check the room ID and try again.</p>
				</div>
				<button
					onClick={() => (window.location.href = "/")}
					className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-500 hover:to-pink-500 transition active:scale-95 shadow-lg"
				>
					Return Home
				</button>
			</div>
		</div>
	);
}
