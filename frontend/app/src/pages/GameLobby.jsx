import { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Table from "react-bootstrap/Table";
import { useNavigate } from "react-router"; // maybe change ?
import {
	MeContext,
	UsersContext,
	WSContext,
} from "../context/GeneralContext.jsx";

export default function GameLobby() {
	const me = useContext(MeContext);
	const users = useContext(UsersContext);
	const ws = useContext(WSContext);
	const navigate = useNavigate();

	const handleLaunchPress = () => {
		ws.sendMessage({
			key: "GAME",
		});
	};

	const handleCancelPress = () => {
		ws.sendMessage({
			key: "GAME_CANCEL",
		});
	};

	const handleReadyPress = () => {
		ws.sendMessage({
			key: "GAME_READY",
			value: me.data.lock ? 0 : 1,
		});
	};

	const handleKickPress = (id) => {
		ws.sendMessage({
			key: "GAME_KICK",
			value: id,
		});
	};

	const leader_user =
		users?.data?.find((user) => user.leader) ||
		(me?.data?.leader ? me.data : null);

	console.log(leader_user);

	if (leader_user == null) {
		return (
			<Container fluid className="p-3">
				<Container
					className="p-5 mb-4 rounded-3 text-center"
					style={{
						backgroundColor: "transparent",
					}}
				>
					{/* added style 5rem because size="sm" only */}
					<Spinner style={{ width: "5rem", height: "5rem" }} />
				</Container>
			</Container>
		);
	}

	return (
		<Container fluid className="p-3">
			<Container
				className="p-5 mb-4 rounded-3"
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					textAlign: "center",
					color: "#eef7ff",
				}}
			>
				<h2 className="mb-4 text-center">
					Lobby{" "}
					{me.data.game_mode === 1
						? "1v1"
						: me.data.game_mode === 2
						? "tournament"
						: ""}
				</h2>

				{leader_user.lock === true && (
					<>
						<h2>Information</h2>
						{ws.lobbyInfo.length > 0 ? (
							<Table striped bordered hover responsive>
								<thead>
									<tr>
										<th>#</th>
										<th>Message</th>
									</tr>
								</thead>
								<tbody>
									{ws.lobbyInfo.map((msg, index) => (
										<tr key={index}>
											<td>{index + 1}</td>
											<td>{msg}</td>
										</tr>
									))}
								</tbody>
							</Table>
						) : (
							<Alert variant="warning">
								Waiting for game/lobby action...
								<br />
								<Spinner />
							</Alert>
						)}
					</>
				)}

				{leader_user.lock == false && (
					<>
						{me.data.in_lobby.length == 0 ? (
							<Alert variant="warning" className="text-center">
								No other users in lobby.
							</Alert>
						) : (
							<>
								<Table striped bordered hover responsive>
									<thead>
										<tr>
											<th>ID</th>
											<th>Username</th>
											<th>Ready Status</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody>
										<tr key="me">
											<td>{me.data.id}</td>
											<td>{me.data.username}</td>
											{me.data.leader == false && (
												<>
													<td>
														<Button
															variant={
																me.data.lock
																	? "danger"
																	: "success"
															}
															onClick={
																handleReadyPress
															}
														>
															{me.data.lock
																? "Cancel Ready"
																: "Ready"}
														</Button>
													</td>
													<td>
														<Button
															variant="danger"
															onClick={
																handleCancelPress
															}
														>
															Cancel
														</Button>
													</td>
												</>
											)}
											{me.data.leader == true && (
												<>
													<td>You are the leader</td>
													<td>x</td>
												</>
											)}
										</tr>

										{me.data.in_lobby
											.sort((a, b) => a - b)
											.map((id, index) => {
												const retrieve_user =
													users.data.find(
														(user) => user.id === id
													) || {
														username:
															"Unknown User",
														lock: false,
													};
												return (
													<tr key={index}>
														<td>{id}</td>
														<td>
															{
																retrieve_user.username
															}
														</td>
														{me.data.leader ==
															true && (
															<>
																<td>
																	<div>
																		{retrieve_user.lock
																			? "Ready"
																			: "Not Ready"}
																	</div>
																</td>
																{me.data
																	.game_mode ===
																1 ? (
																	<td>x</td>
																) : (
																	<td>
																		{" "}
																		<Button
																			variant="danger"
																			onClick={() =>
																				handleKickPress(
																					id
																				)
																			}
																		>
																			Kick
																		</Button>
																	</td>
																)}
															</>
														)}
														{me.data.leader ==
															false && (
															<>
																<td>
																	<div>
																		{retrieve_user.leader
																			? "Leader"
																			: retrieve_user.lock
																			? "Ready"
																			: "Not Ready"}
																	</div>
																</td>
																<td>x</td>
															</>
														)}
													</tr>
												);
											})}
									</tbody>
								</Table>
								{me.data.leader == false && (
									<div>Waiting for Launch</div>
								)}
								{me.data.leader == true && (
									<Stack
										className="col-md-5 mx-auto"
										direction="vertical"
										gap={2}
									>
										<Button
											onClick={handleLaunchPress}
											disabled={
												(me.data.game_mode === 1 &&
													me.data.in_lobby.length <
														1) ||
												(me.data.game_mode === 2 &&
													me.data.in_lobby.length <
														2) ||
												me.data.in_lobby.some((id) => {
													const retrieve_user =
														users.data.find(
															(user) =>
																user.id === id
														) || { lock: false };
													return (
														retrieve_user.lock ===
														false
													);
												})
											}
										>
											Launch
										</Button>
										<Button
											variant="danger"
											onClick={handleCancelPress}
										>
											Cancel
										</Button>
									</Stack>
								)}
								<div>
									Numbers of players:{" "}
									{me.data.in_lobby.length + 1}
								</div>
								<div>
									Minimum numbers of players:{" "}
									{me.data.game_mode === 1 ? "2" : "3"}
								</div>
							</>
						)}
					</>
				)}
			</Container>
		</Container>
	);
}
