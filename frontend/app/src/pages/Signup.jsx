import { useState, useContext } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import { useNavigate, Link } from "react-router";
import { WSContext, ToastContext } from "../context/GeneralContext.jsx";
import {
	useMutationCustom,
	useMutationCustomSignupLogin,
} from "../hooks/apiHooks.jsx";
import { URLS_BACKEND, getStatusCodeMessage } from "../constants.jsx";
import TotpModal from "./TotpModal.jsx";
import AgreeToTermsModal from "./AgreeToTermsModal.jsx";

export default function Signup() {
	const navigate = useNavigate();
	const ws = useContext(WSContext);
	const toast = useContext(ToastContext);

	const [passwordValid, setPasswordValid] = useState(null);
	const [formValidated, setFormValidated] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		email: "",
		agree_to_terms: false,
	});

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

	const [qrcode, setQrcode] = useState("");
	const mutationSignupLogin = useMutationCustomSignupLogin(
		formData.username,
		formData.password,
		formData.email,
		formData.agree_to_terms,
		(data) => {
			setQrcode(data.login.img);
		},
		() => {
			toast.createToast(
				"Error: CustomSignupLogin " + URLS_BACKEND.SIGNUP + " failed",
				"danger"
			);
			mutationSignupLogin.reset();
		}
	);

	const handleSubmit = (event) => {
		const form = event.currentTarget;
		event.preventDefault();
		event.stopPropagation();

		if (!passwordValid) {
			toast.createToast(
				"Error: Password does not meet the requirements",
				"danger"
			);
			return;
		}

		if (form.checkValidity() === false) {
			setFormValidated(true);
		} else {
			mutationSignupLogin.mutate();
		}
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

	const handleFormDataChange = (event) => {
		const { id, value } = event.target;

		if (id === "password") {
			const passwordRegex =
				/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
			setPasswordValid(passwordRegex.test(value));
		}

		setFormData({ ...formData, [id]: value });

		if (formValidated === true) {
			setFormValidated(false);
		}
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
					validated={formValidated}
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
								type="username"
								placeholder="Username"
								required
								value={formData.username}
								onChange={handleFormDataChange}
								disabled={
									mutationSignupLogin.status === "pending"
								}
							/>
						</Col>
					</Form.Group>

					<Form.Group as={Row} className="mb-3" controlId="email">
						<Form.Label column sm={2}>
							Email
						</Form.Label>
						<Col sm={10}>
							<Form.Control
								type="email"
								placeholder="Email"
								required
								value={formData.email}
								onChange={handleFormDataChange}
								disabled={
									mutationSignupLogin.status === "pending"
								}
							/>
						</Col>
					</Form.Group>

					<Form.Text
						className="mt-1 d-flex justify-content-end"
						style={{
							color: "#CCCCCC",
							fontSize: "12px",
							marginBottom: "6px",
						}}
					>
						Password must contain: minimum 8 characters: 1
						uppercase, 1 lowercase, 1 number, 1 special character
					</Form.Text>

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
								disabled={
									mutationSignupLogin.status === "pending"
								}
							/>
						</Col>
					</Form.Group>

					{passwordValid != null && (
						<Form.Text
							className={`mt-1 d-flex justify-content-end ${
								passwordValid ? "text-success" : "text-danger"
							}`}
							style={{
								marginBottom: "10px",
								fontSize: "12px",
							}}
						>
							{passwordValid
								? "Password meets all requirements :)"
								: "Password does not meet requirements :("}
						</Form.Text>
					)}

					<Form.Group
						as={Row}
						className="mb-3"
						controlId="agree_to_terms"
					>
						<Col sm={{ span: 10, offset: 2 }}>
							<Form.Check
								required
								label={
									<span>
										Agree to{" "}
										<Link
											to="/termsandprivacypolicy"
											style={{
												textDecoration: "underline",
												color: "#ADD8E6",
											}}
										>
											terms and conditions
										</Link>
									</span>
								}
								feedback="You must agree before submitting."
								feedbackType="invalid"
								checked={formData.checked}
								onChange={handleFormDataChange}
								disabled={
									mutationSignupLogin.status === "pending"
								}
							/>
						</Col>
					</Form.Group>

					<Form.Group as={Row} className="mb-3">
						<Col sm={{ span: 10, offset: 2 }}>
							<Stack direction="horizontal" gap={2}>
								<Button
									type="submit"
									disabled={
										mutationSignupLogin.status === "pending"
									}
								>
									Sign up
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
							</Stack>
						</Col>
					</Form.Group>
				</Form>

				{mutationSignupLogin.status === "pending" && (
					<Spinner animation="border" />
				)}

				{mutationSignupLogin.status === "success" && (
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
