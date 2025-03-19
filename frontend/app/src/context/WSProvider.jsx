// BIG CHAT-GPT 01
import { useState, useRef, useEffect, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
// import InvitationModal from "../pages/InvitationModal.jsx";
import {
	MeContext,
	UsersContext,
	WSContext,
	ToastContext,
} from "./GeneralContext.jsx";
import {
	ME_CONTEXT_DEFAULT,
	USERS_CONTEXT_DEFAULT,
	URLS_BACKEND,
} from "../constants.jsx";
import {
	useMutationCustomUserMeUsers,
	useMutationCustom,
	useMutationUser,
} from "../hooks/apiHooks.jsx";

export function WSProvider({ children }) {
	// --------------------------------------------------
	// State & Context
	// --------------------------------------------------
	const [webSocket, setWebSocket] = useState(null);
	// 0 pending / 1 refresh success / 2 refresh fail (not login)
	const [refresh, setRefresh] = useState(0);
	const queryClient = useQueryClient();

	// 0 wait for response
	// 1 go to gamemenu
	// 2 go to game
	const [redirect, setRedirect] = useState(0);

	const [messages, setMessages] = useState([]);

	const [lobbyInfo, setLobbyInfo] = useState([]);

	// use when game
	// const [startgame, setStartgame] = useState(false);

	// These are the actual context values
	const me = useContext(MeContext);
	const users = useContext(UsersContext);
	const { createToast, createModalInfo } = useContext(ToastContext);

	// --------------------------------------------------
	// Use refs to always have the latest context data
	// --------------------------------------------------
	const meRef = useRef(me.data);
	const usersRef = useRef(users.data);

	// Keep refs in sync whenever context changes
	useEffect(() => {
		meRef.current = me.data;
	}, [me.data]);

	useEffect(() => {
		usersRef.current = users.data;
	}, [users.data]);

	// --------------------------------------------------
	// Mutations
	// --------------------------------------------------
	const mutateMeUsers = useMutationCustomUserMeUsers((data) => {
		me.setData(data.userMe);
		// no need data.users?.results?.length backend send [] if no users
		if (data.users.length > 0) {
			users.setData(data.users);
		}
	});

	// const mutateUsers = useMutationCustom(
	//     URLS_BACKEND.USERS,
	//     "GET",
	//     null,
	//     (data) => {
	//         console.log("Updating 'users':", data);
	//         users.setData(data);
	//     },
	//     (error) => {
	//         console.error("Error in mutateUsers:", error);
	//     }
	// );

	const mutationMe = useMutationCustom(
		URLS_BACKEND.USERME,
		"GET",
		null,
		(data) => {
			console.log("Updating 'me':", data);
			me.setData(data);
		},
		(error) => {
			console.error("Error in mutationMe:", error);
		}
	);

	// prevUsers up to date no stale closure ?
	const mutationUser = useMutationUser(
		(data) => {
			console.log("Updating 'user':", data.id, data);

			users.setData((prevUsers) => {
				const index = prevUsers.findIndex(
					(user) => user.id === data.id
				);
				if (index === -1) {
					// If not found, we append
					return [...prevUsers, data];
				} else {
					// If found, we replace
					return prevUsers.map((user, i) =>
						i === index ? { ...user, ...data } : user
					);
				}
			});
		},
		(error) => {
			// console.error("Error in mutationUser:", error); // TPDP
			// Optionally remove the user from state if the server says they're gone:
			// users.setData((prevUsers) => prevUsers.filter((u) => u.id !== data.id));
		}
	);

	const signoutMutation = useMutationCustom(
		URLS_BACKEND.SIGNOUT,
		"POST",
		null,
        null,
		// () => {
		// 	// console.log("discone");
		// }
	);

	// --------------------------------------------------
	// WebSocket Methods
	// --------------------------------------------------
	function initWebSocket() {
		if (webSocket) {
			console.log("WebSocket connection is alive");
			return;
		}
		const ws = new WebSocket(URLS_BACKEND.WS);

		ws.onopen = () => {
			console.log("Connected to WebSocket:", URLS_BACKEND.WS);
			setWebSocket(ws);
			mutateMeUsers.mutate();
			setRefresh(1);
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.key === "UPDATE") {
					// Note: using meRef.current for latest user data
					if (meRef.current.id === 0) {
						// ?
						closeWebSocket();
					} else if (meRef.current.id === data.id || data.id === -1) {
						mutationMe.mutate();
					} else if (data.id === -2) {
						mutateMeUsers.mutate();
					} else {
						mutationUser.mutate(data.id);
					}
				} else if (data.key === "DELETE") {
					users.setData((prevUsers) =>
						prevUsers.filter((u) => u.id !== data.id)
					);
				} else if (data.key === "CHAT") {
					const isSender = data.sender_id === meRef.current.id;
					const conversationId = isSender
						? data.receiver_id
						: data.sender_id;

					const messageData = {
						message: data.message,
						timestamp: data.timestamp,
						isSender,
					};
					setMessages((prevMessages) => {
						const existingConversation = prevMessages.find(
							(convo) => convo.id === conversationId
						);

						if (existingConversation) {
							// Conversation already exists, append the new message
							return prevMessages.map((convo) =>
								convo.id === conversationId
									? {
											...convo,
											messages: [
												...convo.messages,
												messageData,
											],
									  }
									: convo
							);
						} else {
							// Create a new conversation with the first message
							return [
								...prevMessages,
								{ id: conversationId, messages: [messageData] },
							];
						}
					});
				} else if (data.key === "INFO") {
					// data.lobby == true added in case of just follow messages in chat not in lobby
					if (data.lobby == true) {
						setLobbyInfo((prevLobbyInfo) => [
							...prevLobbyInfo,
							data.message,
						]);
					}

					const conversationId = 0; // for general info id 0

					const messageData = {
						message: data.message,
						timestamp: data.timestamp,
						isSender: false, // INFO messages is one-way communications.
					};

					setMessages((prevMessages) => {
						const existingConversation = prevMessages.find(
							(convo) => convo.id === conversationId
						);

						if (existingConversation) {
							return prevMessages.map((convo) =>
								convo.id === conversationId
									? {
											...convo,
											messages: [
												...convo.messages,
												messageData,
											],
									  }
									: convo
							);
						} else {
							return [
								...prevMessages,
								{ id: conversationId, messages: [messageData] },
							];
						}
					});
				} else if (data.key === "INFO_CLEAR") {
					setLobbyInfo([]);
				} else if (data.key === "REDIRECT") {
					setRedirect(data.page);
				} else if (data.key === "TOAST") {
					// (message, variant = "success", duration = 3000)
					const duration = data.duration ?? 3000;
					createToast(data.message, data.variant, duration);
				} else if (data.key === "MODAL") {
					createModalInfo(data);
				}
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		};

		ws.onclose = () => {
			setWebSocket(null);
		};

		ws.onerror = (error) => {
			createToast(
				"Already logged in on another tabs or windows. (disconnected)",
				"danger",
				6000
			);
			setRefresh(2);
            // force disconnection (test multiple safe)
            // signoutMutation.mutate(); 
            // me.setData(ME_CONTEXT_DEFAULT);
            // users.setData(USERS_CONTEXT_DEFAULT);
            // queryClient.clear();
			// console.error("ws failed", error);
		};
	}

	function sendMessage(messageObject) {
		if (webSocket && webSocket.readyState === WebSocket.OPEN) {
			webSocket.send(JSON.stringify(messageObject));
		}
	}

	function closeWebSocket() {
		if (webSocket) webSocket.close();

		me.setData(ME_CONTEXT_DEFAULT);
		users.setData(USERS_CONTEXT_DEFAULT);
		queryClient.clear();
		setRefresh(2);
	}

	// --------------------------------------------------
	// Provide the WebSocket methods & state
	// --------------------------------------------------
	return (
		<WSContext.Provider
			value={{
				webSocket,
				setRefresh,
				refresh,
				initWebSocket,
				sendMessage,
				closeWebSocket,
				lobbyInfo,
				messages,
				redirect,
			}}
		>
			{children}
		</WSContext.Provider>
	);
}
