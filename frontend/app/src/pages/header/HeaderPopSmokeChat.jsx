import {
	Button,
	Offcanvas,
	Container,
	Row,
	Col,
	Badge,
	Form,
	InputGroup,
	ListGroup,
	Alert,
	Image,
	Spinner,
} from "react-bootstrap";
import { Fragment, useState, useEffect } from "react";
import chatLogo from "../../assets/images/chat.png";
import { DELAY_RESET_ALL_INVITE } from "../../constants";

function LeftChat({
	navigate,
	me,
	users,
	ws,
	activeUserId,
	setActiveUserId,
	setFormMessage,
	notifications,
	setNotifications,
	setShow,
}) {
	const handleUsersListClick = (user) => {
		setActiveUserId(user.id);
		setFormMessage("");
		setNotifications((prevNotifications) =>
			prevNotifications.filter(
				(notification) => notification.conversationId !== user.id
			)
		);
	};

	const handleUsersProfileClick = (e, user) => {
		setShow(false);
		e.stopPropagation();
		e.preventDefault();
		navigate(`/profile/${user.id}`);
	};

	const handleUsersBlockClick = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "BLOCK_USER",
			id: user.id,
		});
		// reset activeUserId if BlockedUser is selected
		if (activeUserId === user.id) setActiveUserId(0);
	};
	const handleUsersUnblockClick = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "UNBLOCK_USER",
			id: user.id,
		});
		// reset activeUserId if BlockedUser is selected
		if (activeUserId === user.id) setActiveUserId(0);
	};

	const handleUsersAddFriendClick = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "SEND_FRIEND",
			id: user.id,
		});
		// reset activeUserId if BlockedUser is selected
		if (activeUserId === user.id) setActiveUserId(0);
	};
	const handleUsersAcceptDenyClick = (e, user, value) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "HANDLE_FRIEND",
			id: user.id,
			value: value,
		});
		// reset activeUserId if BlockedUser is selected
		if (activeUserId === user.id) setActiveUserId(0);
	};

	const handleUsersRemoveFriendClick = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "REMOVE_FRIEND",
			id: user.id,
		});
		// reset activeUserId if BlockedUser is selected
		if (activeUserId === user.id) setActiveUserId(0);
	};

	const handleUsersAdd1V1Click = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "SEND_GAME",
			id: user.id,
			mode: 0,
		});
	};
	const handleUsersAcceptDeny1V1Click = (e, user, value) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "HANDLE_GAME",
			id: user.id,
			value: value,
			mode: 0,
		});
	};

	const handleUsersAddTournamentClick = (e, user) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "SEND_GAME",
			id: user.id,
			mode: 1,
		});
	};
	const handleUsersAcceptDenyTournamentClick = (e, user, value) => {
		e.stopPropagation();
		e.preventDefault();
		ws.sendMessage({
			key: "HANDLE_GAME",
			id: user.id,
			value: value,
			mode: 1,
		});
	};

	const [sendFriends, setSendFriends] = useState([]);
	const [send1v1, setSend1v1] = useState([]);
	const [sendTournament, setSendTournament] = useState([]);

	useEffect(() => {
		// filter remove sendFriends elem when friend
		setSendFriends((prevSendFriends) =>
			prevSendFriends.filter((id) => !me.data.friends.includes(id))
		);
	}, [me.data.friends]);

	useEffect(() => {
		setSend1v1((prevSend1v1) =>
			prevSend1v1.filter((id) => !me.data.in_lobby.includes(id))
		);

		setSendTournament((prevSendTournament) =>
			prevSendTournament.filter((id) => !me.data.in_lobby.includes(id))
		);
	}, [me.data.in_lobby]);

	useEffect(() => {
		const interval = setInterval(() => {
			setSendFriends([]);
			setSend1v1([]);
			setSendTournament([]);
		}, DELAY_RESET_ALL_INVITE);

		return () => clearInterval(interval);
	}, []);

	return (
		<Col xs={4}>
			<ListGroup>
				{/* add #INFO */}
				<Col xs="auto">
					<ListGroup.Item
						as="div"
						action
						active={activeUserId === 0}
						onClick={() => {
							setActiveUserId(0);
							setFormMessage("");
						}}
						// style={{ marginBottom: "0.5rem" }}
					>
						<Row className="align-items-center">
							<Col>{"#INFO"}</Col>
						</Row>
					</ListGroup.Item>
				</Col>

				{users.data.map((users_map) => {
					const isBlocked = me.data.blocked.includes(users_map.id);
					const notification = notifications.find(
						(n) => n.conversationId === users_map.id
					);
					return (
						<Fragment key={users_map.id}>
							{/* HERE HANDLE USERNAME/PROFILE/STATUS */}
							<Col xs="auto">
								<ListGroup.Item
									as="div"
									action
									active={activeUserId === users_map.id}
									variant={isBlocked ? "danger" : ""}
									disabled={isBlocked}
									onClick={() =>
										handleUsersListClick(users_map)
									}
									style={{
										marginTop: "0.5rem",
										position: "relative",
									}}
								>
									<Row className="d-flex align-items-center">
										<Col>{users_map.username}</Col>
										{!isBlocked && (
											<>
												<Col xs="auto">
													{users_map.is_login ? (
														<Badge bg="success">
															Online
														</Badge>
													) : (
														<Badge bg="danger">
															Offline
														</Badge>
													)}
												</Col>
											</>
										)}
									</Row>
									{notification && notification.count > 0 && (
										<Badge
											pill
											bg="danger"
											style={{
												position: "absolute",
												top: "0%",
												right: "0%",
												transform:
													"translate(20%, -20%)",
												pointerEvents: "none",
											}}
										>
											{notification.count}
										</Badge>
									)}
								</ListGroup.Item>
							</Col>
							{me.data.blocked.includes(users_map.id) && (
								<Button
									size="sm"
									variant="danger"
									onClick={(e) =>
										handleUsersUnblockClick(e, users_map)
									}
								>
									Unban
								</Button>
							)}
							{users_map.id == activeUserId && (
								<div
									style={{
										display: "flex", // Enable flex layout
										flexDirection: "column", // Stack elements vertically
										alignItems: "center", // Center items horizontally
										textAlign: "center", // Center text inside each element
										fontSize: "0.8rem", // Smaller text
										backgroundColor:
											"rgba(128, 128, 128, 0.5)", // Semi-transparent gray
										padding: "10px", // Spacing inside the container
										borderRadius: "5px", // Optional: rounds the corners
										gap: "5px", // Optional: adds gap between children
									}}
								>
									<Col xs="auto">
										<Button
											size="sm"
											onClick={(e) =>
												handleUsersProfileClick(
													e,
													users_map
												)
											}
										>
											Profile
										</Button>
									</Col>

									{/* HERE HANDLE BAN */}
									<Col xs="auto">
										{!me.data.blocked.includes(
											users_map.id
										) && (
											<Button
												size="sm"
												onClick={(e) =>
													handleUsersBlockClick(
														e,
														users_map
													)
												}
											>
												Ban
											</Button>
										)}
									</Col>

									{/* HERE HANDLE FRIENDSHIP <3 */}
									<Col xs="auto">
										{me.data.friends.includes(
											users_map.id
										) ? (
											<>
												<div
													style={{
														fontSize: "0.8rem",
													}}
												>
													Friends
												</div>
												<Button
													variant="danger"
													size="sm"
													onClick={(e) =>
														handleUsersRemoveFriendClick(
															e,
															users_map
														)
													}
												>
													Remove Friend
												</Button>
											</>
										) : me.data.incoming_friends.includes(
												users_map.id
										  ) ? (
											<>
												<Button
													variant="success"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDenyClick(
															e,
															users_map,
															1
														)
													}
												>
													Accept
												</Button>{" "}
												<Button
													variant="danger"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDenyClick(
															e,
															users_map,
															0
														)
													}
												>
													Deny
												</Button>
											</>
										) : sendFriends.includes(
												users_map.id
										  ) ? (
											<div style={{ fontSize: "0.8rem" }}>
												Waiting Friend Response
											</div>
										) : (
											<Button
												size="sm"
												onClick={(e) => {
													handleUsersAddFriendClick(
														e,
														users_map
													);
													setSendFriends((prev) => [
														...prev,
														users_map.id,
													]);
												}}
											>
												Add Friend
											</Button>
										)}
									</Col>

									{/* HERE HANDLE 1V1 */}
									<Col xs="auto">
										{me.data.game_mode == 1 ? (
											<div style={{ fontSize: "0.8rem" }}>
												In 1v1 Lobby
											</div>
										) : me.data.game_mode === 2 ? (
											<div style={{ fontSize: "0.8rem" }}>
												In A Tournament Lobby
											</div>
										) : me.data.incoming_one_v_one.includes(
												users_map.id
										  ) ? (
											<>
												<Button
													variant="success"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDeny1V1Click(
															e,
															users_map,
															1
														)
													}
												>
													Accept
												</Button>{" "}
												<Button
													variant="danger"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDeny1V1Click(
															e,
															users_map,
															0
														)
													}
												>
													Deny
												</Button>
											</>
										) : send1v1.includes(users_map.id) ? (
											<div style={{ fontSize: "0.8rem" }}>
												Waiting 1v1 Response
											</div>
										) : (
											<Button
												size="sm"
												onClick={(e) => {
													handleUsersAdd1V1Click(
														e,
														users_map
													);
													setSend1v1((prev) => [
														...prev,
														users_map.id,
													]);
												}}
											>
												Invite to 1v1
											</Button>
										)}
									</Col>

									{/* HERE HANDLE TOURNAMENT */}
									{/* me.data.leader == 1 */}
									<Col xs="auto">
										{me.data.game_mode == 1 ? (
											<div style={{ fontSize: "0.8rem" }}>
												In 1v1 Lobby
											</div>
										) : me.data.game_mode === 2 &&
										  me.data.in_lobby.includes(
												users_map.id
										  ) ? (
											<div style={{ fontSize: "0.8rem" }}>
												In Same Tournament Lobby
											</div>
										) : me.data.game_mode === 2 &&
										  me.data.leader == 0 ? (
											<div style={{ fontSize: "0.8rem" }}>
												In A Tournament Lobby
											</div>
										) : me.data.game_mode === 0 &&
										  me.data.incoming_tournament.includes(
												users_map.id
										  ) ? (
											<>
												<Button
													variant="success"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDenyTournamentClick(
															e,
															users_map,
															1
														)
													}
												>
													Accept
												</Button>{" "}
												<Button
													variant="danger"
													size="sm"
													onClick={(e) =>
														handleUsersAcceptDenyTournamentClick(
															e,
															users_map,
															0
														)
													}
												>
													Deny
												</Button>
											</>
										) : sendTournament.includes(
												users_map.id
										  ) ? (
											<div style={{ fontSize: "0.8rem" }}>
												Waiting for Tournament response
											</div>
										) : (
											<Button
												size="sm"
												onClick={(e) => {
													handleUsersAddTournamentClick(
														e,
														users_map
													);
													setSendTournament(
														(prev) => [
															...prev,
															users_map.id,
														]
													);
												}}
											>
												Invite To Tournament
											</Button>
										)}
									</Col>
								</div>
							)}
						</Fragment>
					);
				})}
			</ListGroup>
		</Col>
	);
}

function RightChat({
	users,
	ws,
	activeUserId,
	setActiveUserId,
	formMessage,
	setFormMessage,
	validated,
	setValidated,
}) {
	const handleFormMessageChange = (event) => {
		setFormMessage(event.target.value);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		event.stopPropagation();

		// Send the message via WebSocket
		ws.sendMessage({
			key: "CHAT",
			id: activeUserId,
			message: formMessage,
		});

		// Reset the form field
		setFormMessage("");
	};

	// nat added
	const handleEnterKeyDown = (event) => {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!(
				!formMessage.trim() ||
				!users.data.find((userItem) => userItem.id === activeUserId)
					?.is_login
			)
		) {
			event.preventDefault();
			handleSubmit(event);
		}
	};

	// Identify the conversation data for the currently active user
	const activeConversation = ws.messages?.find(
		(conversation) => conversation.id === activeUserId
	);

	return (
		<Col
			xs={8}
			style={{ display: "flex", flexDirection: "column", height: "50vh" }}
		>
			<>
				{/* Display existing messages with styling for sender vs. receiver */}
				<div
					style={{ flexGrow: 1, overflowY: "auto", padding: "1rem" }}
				>
					{activeUserId === 0 ? (
						<Alert variant="info" className="mt-3">
							No #info messages for the moment yet!
						</Alert>
					) : !activeConversation?.messages ||
					  activeConversation.messages.length === 0 ? (
						<Alert variant="info" className="mt-3">
							No messages in this conversation yet!
						</Alert>
					) : (
						activeConversation?.messages?.map((message, index) => {
							const formattedTime = new Date(
								message.timestamp * 1000
							).toLocaleTimeString(undefined, {
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							});
							return (
								<div
									key={index}
									style={{
										textAlign: message.isSender
											? "right"
											: "left",
										margin: "6px 0",
									}}
								>
									{activeUserId !== 0 && (
										<strong>
											{message.isSender ? "You" : "User"}:
										</strong>
									)}
									<div>{message.message}</div>
									{activeUserId !== 0 && (
										<small>{formattedTime}</small>
									)}
								</div>
							);
						})
					)}
				</div>

				{/* Form for sending a new message */}
				{activeUserId !== 0 && (
					<div
						style={{
							position: "sticky",
							bottom: 0,
							left: 0,
							right: 0,
							padding: "1rem",
							backgroundColor: "transparent",
						}}
					>
						<Form
							noValidate
							validated={validated}
							onSubmit={handleSubmit}
							onKeyDown={handleEnterKeyDown} // nat added
						>
							<InputGroup>
								<Form.Control
									as="textarea"
									aria-label="With textarea"
									value={formMessage}
									onChange={handleFormMessageChange}
								/>
								<Button
									variant="success"
									type="submit"
									disabled={
										!formMessage.trim() ||
										!users.data.find(
											(userItem) =>
												userItem.id === activeUserId
										)?.is_login
									}
								>
									Send
								</Button>
							</InputGroup>
						</Form>
					</div>
				)}
			</>
		</Col>
	);
}

export default function HeaderPopSmokeChat({
	navigate,
	me,
	users,
	ws,
	location,
}) {
	const [show, setShow] = useState(false);
	const handleShow = () => {
		setShow(true);
		setNotifCount(0);
	};

	const handleClose = () => {
		setShow(false);
	};

	const [notifCount, setNotifCount] = useState(0);
	const [notifications, setNotifications] = useState([]);

	//Type Coercion
	const [activeUserId, setActiveUserId] = useState(0);
	const [formMessage, setFormMessage] = useState("");
	const [validated, setValidated] = useState(false);

	// // temp fix ?
	// useEffect(() => {
	// 	if (location.pathname == "/game") {
	// 		setShow(false);
	// 	}
	// }, [location.pathname]);

	// handle websocket
	useEffect(() => {
		if (ws.webSocket) {
			const handleMessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.key === "DELETE") {
					handleClose();
					if (activeUserId == data.id) {
						setActiveUserId(0);
					}
				} else if (data.key === "REDIRECT") {
					handleClose();
				} else if (data.key === "CHAT") {
					if (!show) {
						setNotifCount((prevCount) => prevCount + 1);

						const isSender = data.sender_id === me.data.id;
						if (isSender == false) {
							const conversationId = isSender
								? data.receiver_id
								: data.sender_id;
							setNotifications((prevNotifications) => {
								// Check if we already have a notification for this conversation.
								const index = prevNotifications.findIndex(
									(n) => n.conversationId === conversationId
								);

								if (index === -1) {
									// No existing notification for this conversation: add a new one.
									return [
										...prevNotifications,
										{ conversationId, count: 1 },
									];
								} else {
									// Update the count for the existing notification.
									const newNotifications = [
										...prevNotifications,
									];
									newNotifications[index] = {
										conversationId,
										count:
											newNotifications[index].count + 1,
									};
									return newNotifications;
								}
							});
						}
					}
				}
			};
			ws.webSocket.addEventListener("message", handleMessage);
			return () =>
				ws.webSocket.removeEventListener("message", handleMessage);
		}
	}, [ws.webSocket]);

	useEffect(() => {
		if (me.data.incoming_one_v_one.length > 0 || me.data.incoming_tournament.length > 0) {
			setNotifCount((prevCount) => prevCount + 1);
	
			const newNotifications = [];
	
			me.data.incoming_one_v_one.forEach((id) => {
				newNotifications.push({ conversationId: id, count: 1 });
			});
	
			me.data.incoming_tournament.forEach((id) => {
				newNotifications.push({ conversationId: id, count: 1 });
			});
	
			setNotifications((prevNotifications) => {
				const updatedNotifications = [...prevNotifications];
	
				newNotifications.forEach((newNotif) => {
					const index = updatedNotifications.findIndex(
						(n) => n.conversationId === newNotif.conversationId
					);
	
					if (index === -1) {
						// No existing notification for this ID, add a new one.
						updatedNotifications.push(newNotif);
					} else {
						// Update the count for the existing notification.
						updatedNotifications[index] = {
							...updatedNotifications[index],
							count: updatedNotifications[index].count + 1,
						};
					}
				});
	
				return updatedNotifications;
			});
		}
	}, [me.data.incoming_one_v_one, me.data.incoming_tournament]);

	return (
		<>
			{show == false && (
				<>
					<Button
						as={Image} // Render as an Image component
						src={chatLogo} // Image source
						roundedCircle // Image style prop
						onClick={handleShow} // Click handler
						style={{
							border: "4px solid rgba(255, 255, 255, 0.1)", // Semi-transparent border
							backgroundColor: "#B57EDC", // Softer purple shade
							width: "60px", // Ensures size stays the same
							height: "60px",
							objectFit: "contain", // Prevents cropping
							padding: "0px",
							borderRadius: "50%", // Keeps it circular
							boxSizing: "border-box", // Ensures the border doesn't shrink the image
						}}
					></Button>
					{notifCount > 0 && (
						<Badge
							pill
							bg="danger" // Red badge to indicate attention.
							style={{
								position: "absolute",
								top: "0px",
								right: "0px",
								transform: "translate(10%, -10%)", // Fine-tunes the position.
							}}
						>
							{notifCount}
						</Badge>
					)}
				</>
			)}

			<Offcanvas
				show={show}
				onHide={handleClose}
				placement={"bottom"}
				scroll={true}
				backdrop={false}
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					color: "#eef7ff",
					width: "70vw",
					maxWidth: "600px",
					marginLeft: "auto",
					marginRight: "0",
					height: "55vh", // Increase the height (80% of the viewport height)
				}}
			>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title>Chat</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body>
					<Container fluid>
						<Row>
							<LeftChat
								navigate={navigate}
								me={me}
								users={users}
								ws={ws}
								activeUserId={activeUserId}
								setActiveUserId={setActiveUserId}
								setFormMessage={setFormMessage}
								notifications={notifications}
								setNotifications={setNotifications}
								setShow={setShow}
							/>
							<RightChat
								users={users}
								ws={ws}
								activeUserId={activeUserId}
								setActiveUserId={setActiveUserId}
								formMessage={formMessage}
								setFormMessage={setFormMessage}
								validated={validated}
								setValidated={setValidated}
								setShow={setShow}
							/>
							{users.data.length == 0 && (
								<Alert variant="warning">
									No users available
								</Alert>
							)}
						</Row>
					</Container>
				</Offcanvas.Body>
			</Offcanvas>
		</>
	);
}
