import { useContext } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { useNavigate, useLocation } from "react-router"; // maybe change ?
import { WSContext } from "../context/GeneralContext.jsx";

function DashboardNotLogin({ navigate }) {
	const handleButtonSignUp = () => {
		navigate("/signup");
	};

	return (
		<Container fluid className="p-3">
			<Container
				className="p-5 mb-4 rounded-3"
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					color: "#eef7ff",
				}}
			>
				<h1 style={{ textAlign: "center" }}>Transcendance</h1>
				<Stack
					className="col-md-5 mx-auto"
					direction="vertical"
					gap={2}
				>
					<Button
						className="my-secondary-button"
						onClick={handleButtonSignUp}
					>
						Sign Up
					</Button>
				</Stack>
			</Container>
		</Container>
	);
}

function DashboardLogin({ navigate, ws, location }) {
	const handleButtonProfile = () => {
		navigate("/profile/me");
	};
	const handleButtonSettings = () => {
		navigate("/settings");
	};
	const handleButtonReconnect = () => {
		if (ws.redirect == 2) {
			navigate("/gamelobby");
		} else if (ws.redirect == 3) {
			navigate("/game");
		}
	};

	return (
		<Container fluid className="p-3">
			<Container
				className="p-5 mb-4 rounded-3"
				style={{
					textAlign: "center",
					backgroundColor: "rgba(13, 81, 79, 0.5)",
				}}
			>
				<h1 style={{ textAlign: "center", color: "#eef7ff" }}>
					Transcendance
				</h1>
				<Stack
					className="col-md-5 mx-auto"
					direction="vertical"
					gap={2}
				>
					<Button
						className="my-secondary-button"
						onClick={handleButtonProfile}
					>
						Profile
					</Button>
					<Button
						className="my-secondary-button"
						onClick={handleButtonSettings}
					>
						Settings
					</Button>
					{(ws.redirect === 2 &&
						location.pathname !== "/gamelobby") ||
					(ws.redirect === 3 && location.pathname !== "/game") ? (
						<Button
							className="my-secondary-button"
							onClick={handleButtonReconnect}
							variant="danger"
						>
							Reconnect to Lobby or Game
						</Button>
					) : null}
				</Stack>
			</Container>
		</Container>
	);
}

export default function Dashboard() {
	const navigate = useNavigate();
	const ws = useContext(WSContext);
	const location = useLocation();

	if (ws.refresh === 1) {
		return (
			<DashboardLogin navigate={navigate} ws={ws} location={location} />
		);
	}
	return <DashboardNotLogin navigate={navigate} />;
}
