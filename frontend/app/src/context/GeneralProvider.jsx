import { useState, useEffect } from "react";
// import { useLocalStorageEventListener } from "../hooks/useStorage.jsx";
import {
	MeContext,
	UsersContext,
	ToastContext,
	CustomizationContext,
} from "./GeneralContext.jsx";
import { Toast, ToastContainer, Modal, Button } from "react-bootstrap";
import {
	// ME_LOCALSTORAGE_KEY,
	ME_CONTEXT_REFRESH_DEFAULT,
	ME_CONTEXT_DEFAULT,
	USERS_CONTEXT_DEFAULT,
	CUSTOMIZATION_CONTEXT_DEFAULT,
} from "../constants.jsx";
import { WSProvider } from "./WSProvider.jsx";

function MeProvider({ children }) {
	const [data, setData] = useState(ME_CONTEXT_DEFAULT);

	return (
		<MeContext.Provider value={{ data, setData }}>
			{children}
		</MeContext.Provider>
	);
}

function UsersProvider({ children }) {
	const [data, setData] = useState(USERS_CONTEXT_DEFAULT);

	return (
		<UsersContext.Provider value={{ data, setData }}>
			{children}
		</UsersContext.Provider>
	);
}

const CustomToast = ({ show, onClose, message, variant, delay = 3000 }) => {
	return (
		<Toast
			onClose={onClose}
			show={show}
			delay={delay}
			autohide
			bg={variant}
		>
			<Toast.Body>{message}</Toast.Body>
		</Toast>
	);
};
// "tournament_name": tournament_name,
// "agains": p1.username,
// "elo_win_lose": results[2:] # get the two last

const CustomModalInfo = ({ show, onHide, payload }) => {
	const [remainingTime, setRemainingTime] = useState(20);

	useEffect(() => {
		if (!show) return;

		setRemainingTime(payload.time ?? 20);
		let timer = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					setTimeout(() => onHide(), 0); // Delay state update
					return 0;
				}
				return prev - 1;
			});
		}, 1000); // Update every second

		return () => clearInterval(timer);
	}, [show]);

	return (
		<Modal
			show={show}
			onHide={onHide}
			size="lg"
			aria-labelledby="contained-modal-title-vcenter"
			centered
		>
			{payload.mode === 1 && (
				<>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							{payload.tournament_name == null
								? "1V1 Game"
								: "Tournament Game"}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<h4>Game instruction</h4>
						<p>
							To play the game use the{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								W
							</span>{" "}
							and{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								S
							</span>{" "}
							key of your keyboard to move the paddle Up and Down.
						</p>
						<p>
							You are the{" "}
							<span
								style={{ color: "green", fontWeight: "bold" }}
							>
								{payload.is_left ? "Left" : "Right"} paddle.
							</span>{" "}
						</p>
						<p>
							You play against{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								{payload.agains}
							</span>{" "}
							for a win of{" "}
							<span
								style={{ color: "green", fontWeight: "bold" }}
							>
								+{payload.elo_win_lose[0]}
							</span>{" "}
							elo or a loss of{" "}
							<span style={{ color: "red", fontWeight: "bold" }}>
								{payload.elo_win_lose[1]} elo
							</span>
						</p>
						<p>
							Press{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								V
							</span>
							,{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								B
							</span>
							, and{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								N
							</span>{" "}
							to change the 3D view.
						</p>
						<p>The game starts in 30 seconds.</p>{" "}
						<p>The Modal go away in {remainingTime} seconds.</p>{" "}
					</Modal.Body>
				</>
			)}
			{payload.mode === 2 && (
				<>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							{payload.tournament_name == null
								? "1V1 Game"
								: "Tournament Game"}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<h4>Game End</h4>
						<p>
							You{" "}
							{payload.win ? (
								<span
									style={{
										color: "green",
										fontWeight: "bold",
									}}
								>
									Won
								</span>
							) : (
								<span
									style={{ color: "red", fontWeight: "bold" }}
								>
									Lost
								</span>
							)}{" "}
							against{" "}
							<span style={{ color: "blue", fontWeight: "bold" }}>
								{payload.agains}
							</span>{" "}
							with your rating changing from{" "}
							<span style={{ fontWeight: "bold" }}>
								{payload.old_elo}
							</span>{" "}
							to{" "}
							<span
								style={{
									color:
										payload.eloDiff > 0 ? "green" : "red",
									fontWeight: "bold",
								}}
							>
								{payload.elo}
							</span>
							{payload.eloDiff !== 0 && (
								<span
									style={{
										color:
											payload.eloDiff > 0
												? "green"
												: "red",
										fontWeight: "bold",
										marginLeft: "0.5rem",
									}}
								>
									({payload.eloDiff > 0 ? "+" : "-"}
									{Math.abs(payload.eloDiff)})
								</span>
							)}
						</p>
						<p>Go to Profile menu to see all your games</p>
						<p>
							The Modal go away in {remainingTime} seconds.
						</p>{" "}
					</Modal.Body>
				</>
			)}
			{payload.mode === 3 && (
				<>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							<span style={{ color: "#ff9800" }}>
								Tournament Game
							</span>
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<h4>You are free this round</h4>
						<p>
							You are the{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Bye player
							</span>{" "}
							of the tournament. The tournament follows a{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Swiss System
							</span>
							, which grants you{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								1 point
							</span>{" "}
							when you are not playing due to an odd number of
							players.
						</p>
						<p>
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Pong
							</span>{" "}
							is a 1972 sports video game developed and published
							by{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Atari
							</span>{" "}
							for arcades. It is one of the earliest arcade video
							games, created by{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Allan Alcorn
							</span>{" "}
							as a training exercise assigned by Atari co-founder{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Nolan Bushnell
							</span>
							. Impressed by Alcorn's work, Bushnell and
							co-founder{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Ted Dabney
							</span>{" "}
							decided to manufacture the game. The game's concept
							was inspired by an electronic ping-pong game
							included in the{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Magnavox Odyssey
							</span>
							, the first home video game console. As a result,
							Magnavox later sued Atari for patent infringement.
						</p>
						<p>
							You are free to visit the{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								RGPD page
							</span>{" "}
							or your{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								Profile Page
							</span>
							. You can also{" "}
							<span
								style={{ color: "#ff9800", fontWeight: "bold" }}
							>
								stalk
							</span>{" "}
							other player profiles to check their stats and
							performance!
						</p>
						<p>
							<strong>
								The modal will close in {remainingTime} seconds.
							</strong>
						</p>
					</Modal.Body>
				</>
			)}
		</Modal>
	);
};

function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const [modalShow, setModalShow] = useState(false);
	const [payload, setPayload] = useState(null);

	const createToast = (message, variant = "success", duration = 3000) => {
		const id = message + crypto.randomUUID(); // use for key unique
		const newToast = { id, message, variant, duration };

		setToasts((prevToasts) => [...prevToasts, newToast]);

		setTimeout(() => {
			setToasts((prevToasts) =>
				prevToasts.filter((toast) => toast.id !== id)
			);
		}, duration);
	};

	const createModalInfo = (data) => {
		setPayload(data);
		setModalShow(true);
	};

	return (
		<ToastContext.Provider
			value={{
				createToast,
				createModalInfo,
			}}
		>
			<ToastContainer className="p-3" position="top-end">
				{toasts.map((toast) => (
					<CustomToast
						key={toast.id}
						show={true}
						onClose={() =>
							setToasts((prevToasts) =>
								prevToasts.filter((t) => t.id !== toast.id)
							)
						}
						message={toast.message}
						variant={toast.variant}
						delay={toast.duration}
					/>
				))}
			</ToastContainer>
			{payload && (
				<CustomModalInfo
					show={modalShow}
					onHide={() => setModalShow(false)}
					payload={payload}
				/>
			)}
			{children}
		</ToastContext.Provider>
	);
}

function CustomizationProvider({ children }) {
	const [data, setData] = useState(CUSTOMIZATION_CONTEXT_DEFAULT);

	return (
		<CustomizationContext.Provider value={{ data, setData }}>
			{children}
		</CustomizationContext.Provider>
	);
}

export function GeneralProvider({ children }) {
	return (
		<MeProvider>
			<UsersProvider>
				<ToastProvider>
					<CustomizationProvider>
						<WSProvider>{children}</WSProvider>
					</CustomizationProvider>
				</ToastProvider>
			</UsersProvider>
		</MeProvider>
	);
}
