import { useState, useContext } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router";
import { WSContext, ToastContext } from "../context/GeneralContext.jsx";
import { useMutationCustom } from "../hooks/apiHooks.jsx";
import { URLS_BACKEND, getStatusCodeMessage } from "../constants.jsx";
import TotpModal from "./TotpModal.jsx";
import AgreeToTermsModal from "./AgreeToTermsModal.jsx";

export default function Login() {
	const navigate = useNavigate();
	const ws = useContext(WSContext);
	const toast = useContext(ToastContext);

	const [formValidated, setFormValidated] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		otp: "",
	});

	const [showModal, setShowModal] = useState(false);
	const [resetPasswordData, setResetPasswordData] = useState({
		username: "",
		newPassword: "",
		otp: "",
	});

	const handleFormDataChange = (event) => {
		const { id, value } = event.target;
		setFormData({ ...formData, [id]: value });
		if (id === "otp" && !/^\d{0,6}$/.test(value)) setFormValidated(false);
		if (formValidated) {
			setFormValidated(false);
		}
	};

	const [qrcode, setQrcode] = useState("");
	const [fillTOTP, setFillTOTP] = useState(false);

	// for 42 AgreeToTerms
	const [showTermsModal, setShowTermsModal] = useState(false);
	const handleAgree = () => {
		setShowTermsModal(false);
		mutationLogin42.mutate();
	};
	const handleRefuse = () => {
		setShowTermsModal(false);
		toast.createToast(
			"User refused to agree to terms and conditions.",
			"danger"
		);
	};

	const mutationLogin = useMutationCustom(
		URLS_BACKEND.LOGIN,
		"POST",
		formData,
		(data) => {
			if (data != null) {
				setFillTOTP(true);
				setQrcode(data.img);
			} else {
				ws.setRefresh(0);
				// ws.initWebSocket();
				navigate("/");
			}
		},
		(error) => {
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.LOGIN +
					" failed",
				"danger"
			);
			mutationLogin.reset();
		}
	);

	const handleResetPasswordDataChange = (event) => {
		const { id, value } = event.target;
		setResetPasswordData({ ...resetPasswordData, [id]: value });
	};

	const mutationResetPassword = useMutationCustom(
		URLS_BACKEND.FORGOTPASSWORD,
		"POST",
		resetPasswordData,
		() => {
			setShowModal(false);
			toast.createToast(
				"Success: " + " Password successfully updated!",
				"success"
			);
		},
		(error) => {
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.FORGOTPASSWORD +
					" failed",
				"danger"
			);
		}
	);

	const handleSubmit = (event) => {
		const form = event.currentTarget;
		event.preventDefault();
		event.stopPropagation();

		if (!formData.username || !formData.password) {
			toast.createToast(
				"Error: " + " Username and password are required.",
				"danger"
			);
			return;
		}

		mutationLogin.mutate();
	};

	const mutationLogin42 = useMutationCustom(
		URLS_BACKEND.LOGIN42,
		"GET",
		null,
		(data) => {
			if (data.authorize_url) {
				window.location.href = data.authorize_url;
			}
		},
		(error) => {
			console.log("Error initiating 42 login:", error);
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.LOGIN42 +
					" failed",
				"danger"
			);
		}
	);

	const handleResetPasswordSubmit = () => {
		if (!/^\d{6}$/.test(resetPasswordData.otp)) {
			toast.createToast(
				"Error: " + " Invalid TOTP code. Please enter a 6-digit code.",
				"danger"
			);
			return;
		}

		if (
			resetPasswordData.newPassword !== resetPasswordData.confirmPassword
		) {
			toast.createToast("Error: " + " Passwords do not match.", "danger");
			return;
		}

		mutationResetPassword.mutate();
	};

	return (
		<Container fluid className="p-3">
			<Container
				className="p-5 mb-4 rounded-3"
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
				}}
			>
				<Form
					noValidate
					// validated={formValidated}
					onSubmit={handleSubmit}
					style={{
						color: "#eef7ff",
					}}
				>
					<Form.Group as={Row} className="mb-3" controlId="username">
						<Form.Label column sm={2}>
							Username
						</Form.Label>
						<Col sm={10}>
							<Form.Control
								type="text"
								placeholder="Username"
								required
								value={formData.username}
								onChange={handleFormDataChange}
								disabled={mutationLogin.status === "pending"}
							/>
						</Col>
					</Form.Group>

					<Form.Group as={Row} className="mb-3" controlId="password">
						<Form.Label column sm={2}>
							Password
						</Form.Label>
						<Col sm={10}>
							<Form.Control
								type="password"
								placeholder="Password"
								required
								value={formData.password}
								onChange={handleFormDataChange}
								disabled={mutationLogin.status === "pending"}
							/>
						</Col>
					</Form.Group>

					<Form.Group as={Row} className="mb-3" controlId="otp">
						<Form.Label column sm={2}>
							TOTP Code
						</Form.Label>
						<Col sm={10}>
							<Form.Control
								type="otp"
								placeholder="123456"
								required
								value={formData.otp}
								onChange={handleFormDataChange}
								disabled={mutationLogin.status === "pending"}
							/>
						</Col>
					</Form.Group>

					<Form.Group as={Row} className="mb-3">
						<Col sm={{ span: 10, offset: 2 }}>
							<Stack direction="horizontal" gap={2}>
								<Button
									type="submit"
									disabled={
										mutationLogin.status === "pending"
									}
								>
									Log in
								</Button>
								<Button
									variant="primary"
									onClick={() => {
										setShowTermsModal(true);
									}}
									disabled={
										mutationLogin42.status === "pending"
									}
								>
									Log in 42
								</Button>
								<Button
									variant="danger"
									type="button"
									className="ms-auto"
									onClick={() => setShowModal(true)}
								>
									Forgot password ?
								</Button>
							</Stack>
						</Col>
					</Form.Group>
				</Form>

				{(mutationLogin.status === "pending" ||
					mutationLogin42.status === "pending") && (
					<Spinner animation="border" />
				)}

				{/* Modal for password reset */}
				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>Reset Password</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<Form>
							<Form.Group className="mb-3" controlId="username">
								<Form.Label>Username</Form.Label>
								<Form.Control
									type="text"
									placeholder="Enter your username"
									value={resetPasswordData.username}
									onChange={handleResetPasswordDataChange}
								/>
							</Form.Group>
							<Form.Group
								className="mb-3"
								controlId="newPassword"
							>
								<Form.Label>New Password</Form.Label>
								<Form.Control
									type="password"
									placeholder="Enter new password"
									value={resetPasswordData.newPassword}
									onChange={handleResetPasswordDataChange}
								/>
							</Form.Group>
							<Form.Group
								className="mb-3"
								controlId="confirmPassword"
							>
								<Form.Label>Confirm Password</Form.Label>
								<Form.Control
									type="password"
									placeholder="Confirm new password"
									value={resetPasswordData.confirmPassword}
									onChange={handleResetPasswordDataChange}
								/>
							</Form.Group>

							<Form.Group className="mb-3" controlId="otp">
								<Form.Label column sm={2}>
									TOTP Code
								</Form.Label>
								<Col sm={8}>
									<Form.Control
										type="otp"
										placeholder="123456"
										required
										value={resetPasswordData.otp}
										onChange={handleResetPasswordDataChange}
									/>
								</Col>
							</Form.Group>
						</Form>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant="secondary"
							onClick={() => setShowModal(false)}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleResetPasswordSubmit}
						>
							Reset Password
						</Button>
					</Modal.Footer>
				</Modal>

				{/* TOTP NOT FINISHED */}
				{fillTOTP && (
					<TotpModal
						ws={ws}
						navigate={navigate}
						username={formData.username}
						qrcode={qrcode}
					/>
				)}

				<AgreeToTermsModal
					show={showTermsModal}
					onAgree={handleAgree}
					onRefuse={handleRefuse}
				/>
			</Container>
		</Container>
	);
}
