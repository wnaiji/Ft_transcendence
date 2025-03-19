import { useState } from "react";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import Stack from "react-bootstrap/Stack";
import Spinner from "react-bootstrap/Spinner";
import { URLS_BACKEND } from "../../constants.jsx";
import { useMutationCustom } from "../../hooks/apiHooks.jsx";

export default function HeaderTopRight({ navigate, me, ws, mutateRefreshOnMount }) {
	const [show, setShow] = useState(false);

	const signoutMutation = useMutationCustom(
		URLS_BACKEND.SIGNOUT,
		"POST",
		null,
		() => {
			ws.closeWebSocket();
			setShow(false);
			navigate("/");
		}
	);

	const handleButton = () => {
		if (me.data.is_login) {
			setShow(true);
		} else {
			navigate("/login");
		}
	};

	const handleClose = () => setShow(false);

	const handleProfile = () => {
		// console.log("games", me.data.games);
		navigate("/profile/me");
		setShow(false);
	};

	const handleSettings = () => {
		navigate("/settings");
		setShow(false);
	};

	const handleSignout = () => {
		signoutMutation.mutate();
	};
	return (
		<>
			<Button
				variant="primary"
				onClick={handleButton}
				disabled={mutateRefreshOnMount.status === "pending"}
			>
				{mutateRefreshOnMount.status === "pending" ? (
					<Spinner
						animation="border"
						style={{
							width: "1rem",
							height: "1rem",
						}}
					/>
				) : me.data.is_login ? (
					me.data.username
				) : (
					"Log in"
				)}
			</Button>
			<Offcanvas
				show={show}
				onHide={handleClose}
				placement={"end"}
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					color: "#eef7ff",
				}}
			>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title
						style={{
							textAlign: "center",
							width: "100%",
						}}
					>
						{me.data.is_login ? me.data.username : "Bye"}
					</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body>
					<Stack gap={3}>
						<Button
							className="my-primary-button"
							onClick={handleProfile}
							disabled={!show}
						>
							Profile
						</Button>
						<Button
							className="my-primary-button"
							onClick={handleSettings}
							disabled={!show}
						>
							Settings
						</Button>
						<Button
							variant="danger"
							onClick={handleSignout}
							disabled={!show}
						>
							Sign out
						</Button>
					</Stack>
				</Offcanvas.Body>
			</Offcanvas>
		</>
	);
}
