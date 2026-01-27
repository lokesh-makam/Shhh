import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

export default function Home() {
	const ws = useContext(SocketContext);
	const navigate = useNavigate();

	const [members, setMembers] = useState("");
	const [roomIdInput, setRoomIdInput] = useState("");
	const [mode, setMode] = useState<"create" | "join" | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!ws) return;

		const handler = (event: MessageEvent) => {
			const data = JSON.parse(event.data);
			if (data.type === "ROOM_CREATED") {
				navigate(`/join/${data.payload.roomId}`);
			}
			if (data.type === "ERROR") {
				const message = data.payload.message;
				setError(message + "Please try again");
			}
		};

		ws.addEventListener("message", handler);
		return () => ws.removeEventListener("message", handler);
	}, [ws, navigate]);

	function createRoom() {
		const maxSize = parseInt(members);
		if (!members || isNaN(maxSize) || maxSize < 2 || maxSize > 10) {
			setError("Please enter a number between 2 and 10");
			setTimeout(() => setError(""), 3000);
			return;
		}
		ws?.send(JSON.stringify({ type: "CREATE_ROOM", payload: { maxSize } }));
	}

	function handleJoinRoom() {
		if (!roomIdInput.trim()) {
			setError("Please enter a valid Room ID");
			setTimeout(() => setError(""), 3000);
			return;
		}
		navigate(`/join/${roomIdInput}`);
	}

	return (
		<div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0B0F19]">
			{/* Animated Background */}
			<div className="absolute inset-0">
				{/* Moving Gradient Waves */}
				<div className="absolute inset-0 opacity-30">
					<div className="wave wave1"></div>
					<div className="wave wave2"></div>
					<div className="wave wave3"></div>
				</div>

				{/* Animated Grid */}
				<div className="absolute inset-0 animated-grid"></div>

				{/* Glowing Orbs */}
				<div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
				<div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-pulse-slower"></div>
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-rotate-slow"></div>
			</div>

			{/* Main Content */}
			<div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8">
					{/* Logo & Title Section */}
					<div className="text-center space-y-3 sm:space-y-4">
						<div className="relative inline-block">
							<div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl animate-zoom-in-then-float select-none cursor-default">🤫</div>
						</div>

						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent tracking-tight animate-fade-in-up">
							Shhh
						</h1>
					</div>

					{/* Action Buttons */}
					<div className="w-full max-w-md grid grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-0 animate-fade-in-up animation-delay-200">
						<button
							onClick={() => {
								setMode("create");
								setError("");
							}}
							className={`group relative px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
								mode === "create"
									? "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-lg shadow-slate-900/50 scale-105"
									: "bg-[#1A1F2E] border border-gray-700/50 hover:border-slate-600 hover:bg-slate-800/50"
							}`}
						>
							<span className="flex items-center justify-center gap-1.5">
								<span className="text-base sm:text-lg">✨</span>
								<span>Create</span>
							</span>
						</button>

						<button
							onClick={() => {
								setMode("join");
								setError("");
							}}
							className={`group relative px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
								mode === "join"
									? "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-lg shadow-slate-900/50 scale-105"
									: "bg-[#1A1F2E] border border-gray-700/50 hover:border-slate-600 hover:bg-slate-800/50"
							}`}
						>
							<span className="flex items-center justify-center gap-1.5">
								<span className="text-base sm:text-lg">🔗</span>
								<span>Join</span>
							</span>
						</button>
					</div>

					{/* Error Message */}
					{error && (
						<div className="w-full max-w-md px-4 sm:px-0 animate-shake">
							<div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
								<span className="text-base sm:text-lg">⚠️</span>
								<p className="text-red-300 text-xs sm:text-sm font-medium">{error}</p>
							</div>
						</div>
					)}

					{/* Forms */}
					<div className="w-full max-w-md px-4 sm:px-0">
						{mode === "create" && (
							<div className="animate-fadeIn space-y-3">
								<input
									type="number"
									min={2}
									max={10}
									value={members}
									onChange={(e) => setMembers(e.target.value)}
									className="w-full px-4 py-3 sm:py-3.5 rounded-lg bg-[#1A1F2E] border border-gray-700/50 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all text-white text-sm sm:text-base placeholder-gray-500"
									placeholder="Number of members (2-10)"
								/>

								<button
									onClick={createRoom}
									className="w-full py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600 font-semibold text-sm sm:text-base shadow-lg shadow-slate-900/30 transition-all duration-300 active:scale-95"
								>
									<span className="flex items-center justify-center gap-2">
										<span>Start Room</span>
										<span className="text-base sm:text-lg">🚀</span>
									</span>
								</button>
							</div>
						)}

						{mode === "join" && (
							<div className="animate-fadeIn space-y-3">
								<input
									value={roomIdInput}
									onChange={(e) => setRoomIdInput(e.target.value)}
									placeholder="Enter Room ID"
									className="w-full px-4 py-3 sm:py-3.5 rounded-lg bg-[#1A1F2E] border border-gray-700/50 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all text-white text-sm sm:text-base placeholder-gray-500"
								/>

								<button
									onClick={handleJoinRoom}
									className="w-full py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600 font-semibold text-sm sm:text-base shadow-lg shadow-slate-900/30 transition-all duration-300 active:scale-95"
								>
									<span className="flex items-center justify-center gap-2">
										<span>Join Room</span>
										<span className="text-base sm:text-lg">🔐</span>
									</span>
								</button>
							</div>
						)}
					</div>

					{/* Status Badges */}
					<div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400 px-4 sm:px-0 animate-fade-in-up animation-delay-400">
						<span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1A1F2E] border border-gray-700/50">
							<span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
							Private
						</span>
						<span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1A1F2E] border border-gray-700/50">
							<span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse animation-delay-300"></span>
							Temporary
						</span>
						<span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1A1F2E] border border-gray-700/50">
							<span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse animation-delay-600"></span>
							Secure
						</span>
					</div>
				</div>
			</div>

			<style>{`
				/* Zoom In Animation for Emoji with continuous float after */
				@keyframes zoom-in {
					0% {
						transform: scale(0) translateZ(-1000px);
						opacity: 0;
					}
					50% {
						opacity: 0.5;
					}
					100% {
						transform: scale(1) translateZ(0);
						opacity: 1;
					}
				}

				@keyframes float-continuous {
					0%, 100% {
						transform: translateY(0px) rotate(0deg);
					}
					25% {
						transform: translateY(-15px) rotate(-3deg);
					}
					50% {
						transform: translateY(-8px) rotate(0deg);
					}
					75% {
						transform: translateY(-12px) rotate(3deg);
					}
				}

				.animate-zoom-in-then-float {
					animation: zoom-in 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
					           float-continuous 4s ease-in-out 1.2s infinite;
				}

				/* Fade In Up */
				@keyframes fade-in-up {
					from {
						opacity: 0;
						transform: translateY(30px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fade-in-up {
					animation: fade-in-up 0.8s ease-out forwards;
					opacity: 0;
				}

				.animation-delay-200 {
					animation-delay: 0.2s;
				}

				.animation-delay-400 {
					animation-delay: 0.4s;
				}

				/* Wave Background Animation */
				.wave {
					position: absolute;
					width: 200%;
					height: 200%;
					background: linear-gradient(45deg, 
						rgba(59, 130, 246, 0.1) 0%, 
						rgba(6, 182, 212, 0.1) 50%, 
						rgba(20, 184, 166, 0.1) 100%);
					border-radius: 40%;
				}

				.wave1 {
					animation: wave-animation 15s infinite linear;
					top: -50%;
					left: -50%;
				}

				.wave2 {
					animation: wave-animation 20s infinite linear reverse;
					top: -40%;
					left: -40%;
					opacity: 0.5;
				}

				.wave3 {
					animation: wave-animation 25s infinite linear;
					top: -30%;
					left: -30%;
					opacity: 0.3;
				}

				@keyframes wave-animation {
					0% {
						transform: rotate(0deg);
					}
					100% {
						transform: rotate(360deg);
					}
				}

				/* Animated Grid */
				.animated-grid {
					background-image: 
						linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
						linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
					background-size: 50px 50px;
					animation: grid-move 20s linear infinite;
					mask-image: radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%);
				}

				@keyframes grid-move {
					0% {
						background-position: 0 0;
					}
					100% {
						background-position: 50px 50px;
					}
				}

				/* Pulse Slow */
				@keyframes pulse-slow {
					0%, 100% {
						opacity: 0.3;
						transform: scale(1);
					}
					50% {
						opacity: 0.5;
						transform: scale(1.05);
					}
				}

				.animate-pulse-slow {
					animation: pulse-slow 4s ease-in-out infinite;
				}

				.animate-pulse-slower {
					animation: pulse-slow 6s ease-in-out infinite;
				}

				/* Rotate Slow */
				@keyframes rotate-slow {
					from {
						transform: translate(-50%, -50%) rotate(0deg);
					}
					to {
						transform: translate(-50%, -50%) rotate(360deg);
					}
				}

				.animate-rotate-slow {
					animation: rotate-slow 30s linear infinite;
				}

				/* Fade In */
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fadeIn {
					animation: fadeIn 0.3s ease-out;
				}

				/* Shake */
				@keyframes shake {
					0%, 100% { transform: translateX(0); }
					10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
					20%, 40%, 60%, 80% { transform: translateX(5px); }
				}

				.animate-shake {
					animation: shake 0.4s ease-in-out;
				}

				.animation-delay-300 {
					animation-delay: 0.3s;
				}

				.animation-delay-600 {
					animation-delay: 0.6s;
				}

				/* Remove number input arrows */
				input[type=number]::-webkit-inner-spin-button,
				input[type=number]::-webkit-outer-spin-button {
					-webkit-appearance: none;
					margin: 0;
				}

				input[type=number] {
					-moz-appearance: textfield;
				}
			`}</style>
		</div>
	);
}
