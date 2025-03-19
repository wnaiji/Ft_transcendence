import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Header from "./pages/header/Header.jsx";
import Error from "./pages/Error.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Game from "./pages/game/Game.jsx";
import GameLobby from "./pages/GameLobby.jsx";
import Signup from "./pages/Signup.jsx";
import Loading from "./pages/Loading.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import TermsAndPrivacyPolicy from "./pages/TermsAndPrivacyPolicy.jsx";
import { useContext } from "react";
import { WSContext } from "./context/GeneralContext.jsx";

function CheckRoute({ children, needLogin = false }) {
	const ws = useContext(WSContext);

	// 0 pending / 1 refresh success / 2 refresh fail (not login)
	if (ws.refresh === 0) {
		return <Loading />;
	} else if (ws.refresh === 2 && needLogin === true) {
		return <Navigate to="/" />;
	}
	return children;
}

export const Router = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Header />}>
					<Route
						index
						element={
							<CheckRoute needLogin={false}>
								<Dashboard />
							</CheckRoute>
						}
					/>
					<Route
						path="dashboard"
						element={
							<CheckRoute needLogin={false}>
								<Dashboard />
							</CheckRoute>
						}
					/>
					<Route
						path="game"
						element={
							<CheckRoute needLogin={true}>
								<Game />
							</CheckRoute>
						}
					/>
					<Route
						path="termsandprivacypolicy"
						element={
							<CheckRoute needLogin={false}>
								<TermsAndPrivacyPolicy />
							</CheckRoute>
						}
					/>
					<Route
						path="gamelobby"
						element={
							<CheckRoute needLogin={true}>
								<GameLobby />
							</CheckRoute>
						}
					/>
					<Route
						path="signup"
						element={
							<CheckRoute needLogin={false}>
								<Signup />
							</CheckRoute>
						}
					/>
					<Route
						path="login"
						element={
							<CheckRoute needLogin={false}>
								<Login />
							</CheckRoute>
						}
					/>

					<Route
						path="profile/:id"
						element={
							<CheckRoute needLogin={true}>
								<Profile />
							</CheckRoute>
						}
					/>
					<Route
						path="settings"
						element={
							<CheckRoute needLogin={true}>
								<Settings />
							</CheckRoute>
						}
					/>
					<Route path="*" element={<Error />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};
