import { useState, useContext, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router";
import { MeContext, WSContext } from "../context/GeneralContext.jsx";
import { ToastContext } from "../context/GeneralContext.jsx";
import { useTOTPValidation } from "../hooks/useTOTPValidation.jsx";
import {
	useMutationCustom,
	useMutationDownloadCSV,
} from "../hooks/apiHooks.jsx";
import { URLS_BACKEND, convertLocalhostToHttps } from "../constants.jsx";
import ppDefault from "../assets/images/default-profile.webp";

export default function Settings() {
	const me = useContext(MeContext);
	const ws = useContext(WSContext);
	const navigate = useNavigate();
	const toast = useContext(ToastContext);

	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	// code added for refresh handle
	// const mutationMe = useMutationCustom(
	// 	URLS_BACKEND.USERME,
	// 	"GET",
	// 	null,
	// 	(data) => {
	// 		me.setData(data);
	// 		toast.createToast(
	// 			"Success: " + URLS_BACKEND.USERME + " successful",
	// 			"success"
	// 		);
	// 	},
	// 	(error) => {
	// 		toast.createToast(
	// 			"Error: " +
	// 				getStatusCodeMessage(error) +
	// 				" " +
	// 				URLS_BACKEND.USERME +
	// 				" failed",
	// 			"danger"
	// 		);
	// 	}
	// );
	// end of refresh handle code added

	const [avatar, setAvatar] = useState(
		me.data.avatar ? convertLocalhostToHttps(me.data.avatar) : ppDefault
	);
	const [selectedAvatar, setSelectedAvatar] = useState(null);
	const [avatarStatus, setAvatarStatus] = useState("");
	const [formValidated, setFormValidated] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordValid, setPasswordValid] = useState(null);
	const [updateStatus, setUpdateStatus] = useState("");
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [fileFormData, setFileFormData] = useState(null);

	//f  e
	useEffect(() => {
		setAvatar(
			me.data.avatar ? convertLocalhostToHttps(me.data.avatar) : ppDefault
		);
	}, [me.data]);

	// Avatar, profile & account mutations
	const mutationUploadAvatar = useMutationCustom(
		URLS_BACKEND.AVATAR,
		"POST",
		fileFormData,
		(response) => {
			setAvatarStatus("success");
			toast.createToast(
				"Success: " + URLS_BACKEND.AVATAR + " successful",
				"success"
			);
			setSelectedAvatar(null);
			setAvatar(response.AVATAR);
		},
		(error) => {
			setAvatarStatus("error");
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.AVATAR +
					" failed",
				"danger"
			);
		},
		0
	);

	const mutationRemoveAvatar = useMutationCustom(
		URLS_BACKEND.AVATAR,
		"DELETE",
		null,
		() => {
			setAvatarStatus("success");
			toast.createToast(
				"Success: " + URLS_BACKEND.AVATAR + " successful",
				"success"
			);
			setAvatar(ppDefault);
		},
		(error) => {
			setAvatarStatus("error");
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.AVATAR +
					" failed",
				"danger"
			);
		}
	);

	const mutationUpdateProfile = useMutationCustom(
		URLS_BACKEND.SETTINGS,
		"POST",
		formData,
		() => {
			setUpdateStatus("success");
			toast.createToast(
				"Success: " + URLS_BACKEND.SETTINGS + " successful",
				"success"
			);
			// mutationMe.mutate();
			navigate("/profile/me");
		},
		(error) => {
			setUpdateStatus("error");
			console.log("error : ", error);
			if (error === 400) {
				toast.createToast(
					"Error: The username or email is not valid",
					"danger"
				);
			} else {
				toast.createToast(
					"Error: " +
						getStatusCodeMessage(error) +
						" " +
						URLS_BACKEND.SETTINGS +
						" failed",
					"danger"
				);
			}
		}
	);

	const mutationDeleteAccount = useMutationCustom(
		URLS_BACKEND.SETTINGS,
		"DELETE",
		null,
		() => {
			setShowDeleteModal(false);
			toast.createToast(
				"Success: " + URLS_BACKEND.SETTINGS + " successful",
				"success"
			);
			ws.closeWebSocket();
			navigate("/");
		},
		(error) => {
			setShowDeleteModal(false);
			toast.createToast(
				"Error: " +
					getStatusCodeMessage(error) +
					" " +
					URLS_BACKEND.SETTINGS +
					" failed",
				"danger"
			);
		}
	);

	// TOTP validation hook
	const {
		codeTOTP,
		errorTOTP,
		handleCodeTOTPChange,
		handleValidateTOTP,
		mutationTOTP,
	} = useTOTPValidation();

	const handleFormDataChange = (e) => {
		const { id, value } = e.target;

		if (id === "password") {
			const passwordRegex =
				/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
			setPasswordValid(passwordRegex.test(value));
		}
		setFormData({ ...formData, [id]: value });
	};

	const handleAvatarChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setAvatar(event.target.result);
			};
			reader.readAsDataURL(file);
			setSelectedAvatar(file);

			setFormData((prevFormData) => ({
				...prevFormData,
				avatar: file,
			}));
		}
	};

	const handleUploadAvatar = () => {
		if (!selectedAvatar) return;
		const temp_fileFormData = new FormData();
		temp_fileFormData.append("avatar", selectedAvatar);
		setFileFormData(temp_fileFormData);
		mutationUploadAvatar.mutate();
	};

	const handleRemoveAvatar = () => {
		mutationRemoveAvatar.mutate();
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		event.stopPropagation();

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (formData.email && !emailRegex.test(formData.email)) {
			toast.createToast("Error: Email format is incorrect", "danger");
			return;
		}

		if (formData.password || formData.confirmPassword) {
			if (!passwordValid) {
				toast.createToast(
					"Error: Password does not meet the requirements",
					"danger"
				);
				return;
			}
			if (formData.password !== formData.confirmPassword) {
				setPasswordError("Passwords do not match");
				return;
			}
		}

		setPasswordError("");
		mutationUpdateProfile.mutate();
	};

	// COnfirmation modal
	const handleShowDeleteModal = () => setShowDeleteModal(true);
	const handleCloseDeleteModal = () => setShowDeleteModal(false);
	const handleConfirmDeleteAccount = () => {
		mutationDeleteAccount.mutate();
	};

	const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);

	const mutationCSV = useMutationDownloadCSV(
		() => {
			setIsDownloadingCSV(false);
			toast.createToast("Successfully download CSV data", "success");
		},
		() => {
			setIsDownloadingCSV(false);
			toast.createToast("Failed to download CSV data", "danger");
		}
	);

	const handleDownloadCSV = () => {
		setIsDownloadingCSV(true);
		mutationCSV.mutate();
	};

	return (
		<Container fluid className="my-5 d-flex justify-content-center">
			<div
				className="p-4 rounded shadow"
				style={{
					maxWidth: "600px",
					width: "100%",
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					height: "80vh", // Full viewport height
					overflowY: "auto", // Enable vertical scrolling
				}}
			>
				<Row className="justify-content-center align-items-center mb-4">
					{/* Avatar */}
					<Col xs={4} className="text-center">
						<div
							className="rounded-circle overflow-hidden mx-auto"
							style={{ width: "150px", height: "150px" }}
						>
							<Image
								src={avatar}
								alt="Profile Picture"
								className="w-100 h-100"
								style={{ objectFit: "cover" }}
							/>
						</div>
					</Col>
					{/* Avatar buttons */}
					<Col xs={8}>
						<Row>
							<Col className="mb-2">
								<Form.Group controlId="avatar">
									<Button
										variant="secondary"
										as="label"
										className="w-100"
									>
										Change Avatar
										<Form.Control
											type="file"
											accept="image/*"
											className="d-none"
											onChange={handleAvatarChange}
										/>
									</Button>
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col>
								<Button
									variant="primary"
									className="w-100"
									onClick={handleUploadAvatar}
									disabled={
										!selectedAvatar ||
										mutationUploadAvatar.isLoading
									}
								>
									{mutationUploadAvatar.isLoading ? (
										<Spinner animation="border" size="sm" />
									) : (
										"Upload Avatar"
									)}
								</Button>
								<Form.Text
									className="mt-1 d-block text-center"
									style={{
										color: "#CCCCCC",
										fontSize: "10px",
									}}
								>
									Only 2MB image files are allowed
								</Form.Text>
								<Button
									variant="info"
									className="w-100 mt-2"
									onClick={handleDownloadCSV}
									disabled={isDownloadingCSV}
								>
									{isDownloadingCSV ? (
										<Spinner animation="border" size="sm" />
									) : (
										"Download My Data (CSV)"
									)}
								</Button>
								<Button
									variant="info"
									className="w-100 mt-2"
									onClick={() => {
										navigate("/termsandprivacypolicy");
									}}
								>
									Terms of Service & Privacy Policy
								</Button>
								<Button
									variant="danger"
									className="w-100 mt-2"
									onClick={handleRemoveAvatar}
									disabled={
										avatar === ppDefault ||
										mutationRemoveAvatar.isLoading
									}
								>
									{mutationRemoveAvatar.isLoading ? (
										<Spinner animation="border" size="sm" />
									) : (
										"Remove Avatar"
									)}
								</Button>
							</Col>
						</Row>
					</Col>
				</Row>

				{avatarStatus === "success"}
				{avatarStatus === "error"}

				<h2
					className="mb-4 text-center"
					style={{
						color: "#eef7ff",
					}}
				>
					Edit Settings
				</h2>

				{/* Form */}
				<Form
					noValidate
					validated={formValidated}
					onSubmit={handleSubmit}
					style={{
						color: "#eef7ff",
					}}
				>
					<Form.Group className="mb-3" controlId="username">
						<Form.Label>Username</Form.Label>
						<Form.Control
							type="text"
							placeholder="Enter new username"
							required
							value={formData.username}
							onChange={handleFormDataChange}
						/>
					</Form.Group>

					<Form.Group className="mb-3" controlId="email">
						<Form.Label>Email</Form.Label>
						<Form.Control
							type="email"
							placeholder="Enter new email"
							required
							value={formData.email}
							onChange={handleFormDataChange}
						/>
					</Form.Group>

					<Form.Text
						className="mt-1 d-flex justify-content-center"
						style={{
							color: "#CCCCCC",
							fontSize: "12px",
							marginBottom: "6px",
						}}
					>
						Password: min 8 characters: 1 uppercase, 1 lowercase, 1
						number, 1 special character
					</Form.Text>

					{/* Password row */}
					<Row
						className="mb-3"
						style={{
							color: "#eef7ff",
						}}
					>
						<Col md={6}>
							<Form.Group controlId="password">
								<Form.Label>New Password</Form.Label>
								<Form.Control
									type="password"
									placeholder="Enter new password"
									value={formData.password}
									onChange={handleFormDataChange}
									required
								/>
							</Form.Group>
						</Col>
						<Col md={6}>
							<Form.Group controlId="confirmPassword">
								<Form.Label>Confirm New Password</Form.Label>
								<Form.Control
									type="password"
									placeholder="Confirm new password"
									value={formData.confirmPassword}
									onChange={handleFormDataChange}
									required
								/>
							</Form.Group>
						</Col>

						{passwordValid != null && (
							<Form.Text
								className={`mt-3 d-flex justify-content-center ${
									passwordValid
										? "text-success"
										: "text-danger"
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

					</Row>
					{passwordError && (
						<Form.Text className="text-danger d-block mb-3">
							{passwordError}
						</Form.Text>
					)}

					<Button
						type="submit"
						className="w-100 mb-3"
						disabled={mutationUpdateProfile.isLoading}
					>
						{mutationUpdateProfile.isLoading ? (
							<Spinner animation="border" size="sm" />
						) : (
							"Update Settings"
						)}
					</Button>
				</Form>

				{updateStatus === "error"}

				<Button
					variant="danger"
					className="w-100"
					onClick={handleShowDeleteModal}
				>
					Delete Account
				</Button>
			</div>

			{/* Modal */}
			<Modal
				show={showDeleteModal}
				onHide={handleCloseDeleteModal}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>Confirm Account Deletion</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					Are you sure you want to delete your account? This action is
					<strong> irreversible</strong>.
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={handleCloseDeleteModal}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						onClick={handleConfirmDeleteAccount}
						disabled={mutationDeleteAccount.isLoading}
					>
						{mutationDeleteAccount.isLoading ? (
							<Spinner animation="border" size="sm" />
						) : (
							"Delete Account"
						)}
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
}
