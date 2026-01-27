import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Join from "./components/Join";
import { SocketProvider } from "./context/SocketProvider";

function App() {
	return (
		<SocketProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/join/:roomId" element={<Join />} />
				</Routes>
			</BrowserRouter>
		</SocketProvider>
	);
}

export default App;
