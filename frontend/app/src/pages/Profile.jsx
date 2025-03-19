import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import ProgressBar from "react-bootstrap/ProgressBar";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router";
import {
	MeContext,
	UsersContext,
	ToastContext,
} from "../context/GeneralContext.jsx";
import { useContext, useEffect, useState } from "react";
import ppDefault from "../assets/images/default-profile.webp";
import {
	convertLocalhostToHttps,
	formatDateInParis,
	URLS_BACKEND,
	getStatusCodeMessage,
} from "../constants.jsx";
import { useMutationCustom } from "../hooks/apiHooks.jsx";

function BigModal({ friends, users, setDisable }) {
	const navigate = useNavigate();
	return (
		<Modal
			show={true}
			backdropClassName="bg-dark bg-opacity-100"
			aria-labelledby="contained-modal-title-vcenter"
		>
			<Modal.Header>
				<Modal.Title
					id="contained-modal-title-vcenter"
					className="w-100 text-center"
				>
					Friends
				</Modal.Title>
			</Modal.Header>
			<Modal.Body className="grid-example">
				<Container>
					{friends?.length === 0 ? (
						<div>No friends</div>
					) : (
						friends.map((friend, index) => {
							const friendData = users.find(
								(user) => user.id === friend
							);

							if (!friendData) return null;

							return (
								<Row key={index}>
									<Col xs={6} md={4}>
										{friendData.username}
									</Col>
									<Col xs={6} md={4}>
										<Button
											onClick={() => {
												navigate(
													`/profile/${friendData.id}`
												);
												setDisable(false);
											}}
										>
											Profile
										</Button>
									</Col>
									<Col xs={6} md={4}>
										{friendData.is_login ? (
											<span className="text-success">
												Online
											</span>
										) : (
											<span className="text-danger">
												Offline
											</span>
										)}
									</Col>
								</Row>
							);
						})
					)}
				</Container>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={() => setDisable(false)}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
}

function TournamentModal({ toast, showTournament, setShowTournament }) {
	const [tournamentData, setTournamentData] = useState(null);

	const mutationTournament = useMutationCustom(
		URLS_BACKEND.TOURNAMENT_BLOCKCHAIN,
		"POST",
		showTournament,
		(data) => {
			// console.log("hehe", data);
			setTournamentData(data);
		},
		(error) => {
			console.log("passherde", showTournament, error);
			setShowTournament(null);
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.TOURNAMENT_BLOCKCHAIN +
					" failed",
				"danger"
			);
		}
	);

	useEffect(() => {
		mutationTournament.mutate();
	}, []);

	return (
		<Modal
			show={true}
			onHide={() => {
				setShowTournament(null);
			}}
			centered
		>
			{tournamentData ? (
				<>
					<Modal.Header closeButton>
						<Modal.Title>Tournament Details Blockchain</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<p>
							<strong>Tournament Name:</strong>{" "}
							{tournamentData.tournament_name}
						</p>
						<p>
							<strong>Player:</strong>{" "}
							{Number(tournamentData.player) + 1}
						</p>
						<p>
							<strong>Score:</strong> {tournamentData.score}
						</p>
						<p>
							<strong>Rank:</strong> {tournamentData.rank}
						</p>
						<p>
							<strong>Number of Players:</strong>{" "}
							{tournamentData.nbr_players}
						</p>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="info"
							onClick={() => {
								setShowTournament(null);
							}}
						>
							Close
						</Button>
					</Modal.Footer>
				</>
			) : (
				<Modal.Body
					className="d-flex justify-content-center align-items-center"
					style={{ minHeight: "200px" }}
				>
					<Spinner />
				</Modal.Body>
			)}
		</Modal>
	);
}

export default function Profile() {
	const me = useContext(MeContext);
	const users = useContext(UsersContext);
	const navigate = useNavigate();
	const toast = useContext(ToastContext);
	let params = useParams();
	const [modalFriend, setModalFriend] = useState(false);
	const [showTournament, setShowTournament] = useState(null); // tournament_uuid or null

	let userData = undefined;
	let pp = ppDefault;
	if (params.id === "me" || me.data.id === Number(params.id)) {
		userData = me.data;
	} else {
		userData = users.data.find(
			(users_find) => users_find.id === Number(params.id)
		);
	}
	if (userData === undefined) {
		navigate("/error");
		return null;
	}
	if (userData.avatar != null) {
		pp = convertLocalhostToHttps(userData.avatar);
	}

	const handleSettings = () => {
		navigate("/settings");
	};

	const handleModalFriendsButton = () => {
		setModalFriend(true);
	};

	const games = Array.isArray(userData.games) ? userData.games : [];

	// Calculate the ratios for progress bars
	const totalGames = userData.won_games + userData.lost_games;
	const wonGames = userData.won_games;
	const games1v1 = games.filter((game) => !game.tournament_name).length;
	const tournaments = games.filter((game) => game.tournament_name).length;

	const winRatio =
		totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
	const oneVOneRatio =
		totalGames > 0 ? Math.round((games1v1 / totalGames) * 100) : 0;
	const tournamentRatio =
		totalGames > 0 ? Math.round((tournaments / totalGames) * 100) : 0;

	return (
		<Container fluid className="my-5">
			<Container fluid className="my-5">
				{modalFriend && (
					<BigModal
						friends={userData.friends}
						users={users.data}
						setDisable={setModalFriend}
					/>
				)}
				{showTournament && (
					<TournamentModal
						toast={toast}
						showTournament={showTournament}
						setShowTournament={setShowTournament}
					/>
				)}
				<Row style={{ height: "80vh", overflowY: "auto" }}>
					{/* Sidebar */}
					<Col md={3} className="mb-4">
						<Card
							className="shadow-sm"
							style={{
								backgroundColor: "rgba(13, 81, 79, 0.5)",
							}}
						>
							<Card.Body className="d-flex flex-column align-items-center">
								{/* Avatar */}
								<div className="d-flex justify-content-center">
									<div
										className="rounded-circle overflow-hidden mx-3 mb-3"
										style={{
											width: "120px",
											height: "120px",
										}}
									>
										<Image
											src={pp}
											alt="Profile Picture"
											className="w-100 h-100"
											style={{ objectFit: "cover" }}
										/>
									</div>
								</div>
								{/* User Info */}
								<Card.Title
									className="fw-bold text-center"
									style={{
										color: "#eef7ff",
									}}
								>
									{userData.username}
								</Card.Title>
								<Card.Subtitle
									className="mb-3 text-center"
									style={{
										marginTop: "1px",
										color: "#CCCCCC",
										fontSize: "12px",
									}}
								>
									{userData.email}
								</Card.Subtitle>
								<Row
									className="w-100 text-center"
									style={{
										backgroundColor: "transparent",
										padding: "10px 0",
									}}
								>
									{(me.data.id == Number(params.id) ||
										params.id == "me") && (
										<>
											<Col>
												<Button
													onClick={
														handleModalFriendsButton
													}
													className="mb-2"
												>
													Friends
												</Button>
											</Col>
											<Col>
												<Button
													className="mb-2"
													onClick={handleSettings}
												>
													Settings
												</Button>
											</Col>
										</>
									)}
								</Row>
							</Card.Body>
						</Card>
					</Col>

					{/* Main Content */}
					<Col
						md={9}
						style={{
							color: "#eef7ff",
						}}
					>
						{/* Section: Player Info */}
						<div
							className="mb-4 p-4 shadow-sm rounded"
							style={{
								backgroundColor: "rgba(13, 81, 79, 0.5)",
							}}
						>
							<h5
								className="fw-bold"
								style={{
									color: "#eef7ff",
								}}
							>
								Player Information
							</h5>
							<p>
								<strong>Elo:</strong> {userData.elo || "N/A"}
							</p>
							<p>
								<strong>Games Played:</strong> {totalGames}
							</p>
							<p>
								<strong>Won Games:</strong> {userData.won_games}
							</p>
							<p>
								<strong>Lost Games:</strong>{" "}
								{userData.lost_games}
							</p>
							<div className="mb-2">
								<small>Win Ratio</small>
								<ProgressBar
									now={winRatio}
									label={`${winRatio}% Wins`}
								/>
							</div>
							<div className="mb-2">
								<small>1v1 Games Ratio</small>
								<ProgressBar
									now={oneVOneRatio}
									label={`${oneVOneRatio}% 1v1`}
								/>
							</div>
							<div>
								<small>Tournament Games Ratio</small>
								<ProgressBar
									now={tournamentRatio}
									label={`${tournamentRatio}% Tournaments`}
								/>
							</div>
						</div>

						{/* Section: Games */}
						<div
							className="mb-4 p-4 shadow-sm rounded"
							style={{
								backgroundColor: "rgba(13, 81, 79, 0.5)",
							}}
						>
							<h5
								className="fw-bold"
								style={{
									color: "#eef7ff",
								}}
							>
								Games
							</h5>
							<Table
								striped
								bordered
								hover
								responsive
								style={{
									borderRadius: "10px",
									overflow: "hidden",
									overflowY: "auto", // Enable vertical scrolling
								}}
							>
								<thead>
									<tr>
										<th>Game ID</th>
										<th>Date</th>
										<th>Opponent</th>
										<th>{userData.username} Points</th>
										<th>Opponent Points</th>
										<th>Tournament</th>
									</tr>
								</thead>
								<tbody>
									{games.length > 0 ? (
										games.map((game) => {
											let opponentUsername,
												profileScore,
												opponentScore;

											if (
												game.player1_username ===
												userData.username
											) {
												opponentUsername =
													game.player2_username;
												profileScore =
													game.player1_score;
												opponentScore =
													game.player2_score;
											} else if (
												game.player2_username ===
												userData.username
											) {
												opponentUsername =
													game.player1_username;
												profileScore =
													game.player2_score;
												opponentScore =
													game.player1_score;
											} else {
												return null;
											}

											return (
												<tr key={game.game_id}>
													<td>{game.game_id}</td>
													<td>
														{formatDateInParis(
															game.date
														)}
													</td>
													<td>{opponentUsername}</td>
													<td>{profileScore}</td>
													<td>{opponentScore}</td>
													<td>
														<Button
															variant={
																game.tournament_name
																	? "success"
																	: "danger"
															}
															disabled={
																game.tournament_name ==
																null
															}
															onClick={() => {
																setShowTournament(
																	{
																		tournament_name:
																			game.tournament_name,
																	}
																);
															}}
														>
															{game.tournament_name ||
																"1v1"}
														</Button>
													</td>
												</tr>
											);
										})
									) : (
										<tr>
											<td
												colSpan="6"
												className="text-center"
											>
												No games available
											</td>
										</tr>
									)}
								</tbody>
							</Table>
						</div>
					</Col>
				</Row>
			</Container>
		</Container>
	);
}
