import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Join from "./components/Join";
import { SocketProvider } from "./context/SocketProvider";
import { Toaster } from "react-hot-toast";
function App() {
	return (
		<SocketProvider>
			<BrowserRouter>
				<Toaster
					position="top-center"
					reverseOrder={false}
					gutter={8}
					toastOptions={{
						duration: 2500,
						style: {
							background: "#111",
							color: "#fff",
							borderRadius: "10px",
							padding: "10px 14px",
						},
					}}
				/>{" "}
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/join/:roomId" element={<Join />} />
				</Routes>
			</BrowserRouter>
		</SocketProvider>
	);
}

export default App;
