import React from "react";

export default function LoadingScreen() {
	return (
		<div className="h-screen flex items-center justify-center bg-black">
			<div className="text-center space-y-6">
				<div className="relative w-20 h-20 mx-auto">
					<div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
					<div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
				</div>
				<div className="space-y-2">
					<p className="text-white text-lg font-semibold">Connecting to room</p>
					<div className="flex items-center justify-center gap-1">
						<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
						<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
						<div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
					</div>
				</div>
			</div>
		</div>
	);
}
