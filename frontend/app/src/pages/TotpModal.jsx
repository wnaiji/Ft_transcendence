import { useState } from "react";
import { useMutationCustom } from "../hooks/apiHooks.jsx";
import { URLS_BACKEND } from "../constants.jsx";
import Image from "react-bootstrap/Image";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default function TotpModal({ ws, navigate, username, qrcode }) {
    const [codeTOTP, setCodeTOTP] = useState("");
    const [errorTOTP, setErrorTOTP] = useState("");
    const [isValidated, setIsValidated] = useState(false);


    const mutationTOTP = useMutationCustom(
        URLS_BACKEND.VERIFYTOTP,
        "POST",
        { username: username, otp: codeTOTP },
        () => {
            setErrorTOTP("");
            setIsValidated(true);
        },
        () => {
            setErrorTOTP("Code not valid");
            setIsValidated(false);
            toast.createToast("Error: " + getStatusCodeMessage(error) + " " + URLS_BACKEND.VERIFYTOTP + " failed", "danger" );
        }
    );

    const handleCodeTOTPChange = (e) => {
        const input = e.target.value;
        if (/^\d{0,6}$/.test(input)) {
            setCodeTOTP(input);
            setErrorTOTP("");
        } else {
            setErrorTOTP("Must contain only digits (max 6).");
        }
    };

    const handleValidateTOTP = () => {
        if (codeTOTP.length === 6) {
            mutationTOTP.mutate();
        } else {
            setErrorTOTP("Code must be 6 digits.");
        }
    };

    const handleRedirection = () => {
        ws.setRefresh(0);
        // ws.initWebSocket();
        navigate("/");
    };

    return (
        <>
            <Modal show={true}>
                <Modal.Body>
                    <p>Scan the QR Code using your authentication app:</p>
                    <Image
                        src={`data:image/png;base64,${qrcode}`}
                        style={{ width: "250px", height: "auto" }}
                        alt="QR Code"
                        className="mb-3"
                    />
                    <Form>
                        <Form.Group>
                            <Form.Label>
                                Enter validation code (6 digits):
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={codeTOTP}
                                onChange={handleCodeTOTPChange}
                                maxLength={6}
                                placeholder="123456"
                            />
                            {errorTOTP && (
                                <Alert variant="danger" className="mt-2">
                                    {errorTOTP}
                                </Alert>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="primary"
                        onClick={handleValidateTOTP}
                        disabled={
                            codeTOTP.length !== 6 ||
                            mutationTOTP.status === "pending"
                        }
                    >
                        Validate
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* IF ERROR USEEFFECT */}
            {isValidated && handleRedirection()}
        </>
    );
}
