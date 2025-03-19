import { useContext, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Dropdown from "react-bootstrap/Dropdown";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
	MeContext,
	UsersContext,
	ToastContext,
	CustomizationContext,
	WSContext,
} from "../../context/GeneralContext.jsx";
import { useAuthRefresh } from "../../hooks/useAuthRefresh.jsx";

import HeaderPopSmokeChat from "./HeaderPopSmokeChat.jsx";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import {
	CUSTOMIZATION_CONTEXT_DEFAULT,
	CUSTOMIZATION_CONTEXT_THEME_2,
} from "../../constants";
import HeaderTopRight from "./HeaderTopRight.jsx";
import Image from "react-bootstrap/Image";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router";
import reactLogo from "../../assets/images/react.svg";

export default function Header() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const me = useContext(MeContext);
	const users = useContext(UsersContext);
	const customization = useContext(CustomizationContext);
	const ws = useContext(WSContext);
	const toast = useContext(ToastContext);
	const mutateRefreshOnMount = useAuthRefresh(ws);
	const location = useLocation();

	const handleThemeDefault = () => {
		customization.setData(CUSTOMIZATION_CONTEXT_DEFAULT);
	};

	const handleThemeTwo = () => {
		customization.setData(CUSTOMIZATION_CONTEXT_THEME_2);
	};

	//ws.redirect
	// 1 go to /
	// 2 go to gamelobby
	// 3 go to game
	useEffect(() => {
		// console.log("info", location.pathname);
		if (ws.refresh == 0) {
			return; // security cancel if not ready
		} else if (ws.redirect == 1) {
			navigate("/");
		} else if (ws.redirect == 2) {
			navigate("/gamelobby");
		} else if (ws.redirect == 3) {
			navigate("/game");
		}
	}, [ws.redirect, ws.refresh]);

	return (
		<>
			<Container
				className="p-1 px-4 mb-2 rounded-3"
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
				}}
			>
				<Navbar
					className=""
					style={{
						backgroundColor: "transparent",
					}}
				>
					<Navbar.Brand style={{ textAlign: "center" }}>
						<Link to="/">
							<Image src={reactLogo} alt="React Logo" fluid />
						</Link>
					</Navbar.Brand>
					<Navbar.Toggle />
					{location.pathname == "/game" && (
						<Stack
							style={{
								textAlign: "center",
								display: "flex",
								justifyContent: "center",
								width: "100%",
							}}
							direction="horizontal"
							gap={1}
						>
							<Dropdown>
								<Dropdown.Toggle
									variant="secondary"
									id="dropdown-theme"
									style={{
										backgroundColor: "#2196F3",
									}}
								>
									Choose Theme
								</Dropdown.Toggle>
								<Dropdown.Menu
									style={{
										left: "50%",
										transform: "translateX(-50%)",
									}}
								>
									<Dropdown.Item onClick={handleThemeDefault}>
										Default Theme
									</Dropdown.Item>
									<Dropdown.Item onClick={handleThemeTwo}>
										Original Theme
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</Stack>
					)}
					<Navbar.Collapse className="justify-content-end">
						<Navbar.Text>
							<HeaderTopRight
								navigate={navigate}
								queryClient={queryClient}
								me={me}
								ws={ws}
								mutateRefreshOnMount={mutateRefreshOnMount}
							/>
						</Navbar.Text>
					</Navbar.Collapse>
				</Navbar>
			</Container>
			<Outlet />
			{me.data.is_login && (
				<div
					style={{
						position: "fixed",
						bottom: "10px",
						right: "10px",
						zIndex: 1000,
					}}
				>
					<HeaderPopSmokeChat
						navigate={navigate}
						me={me}
						users={users}
						ws={ws}
						location={location}
					/>
				</div>
			)}
		</>
	);
}
