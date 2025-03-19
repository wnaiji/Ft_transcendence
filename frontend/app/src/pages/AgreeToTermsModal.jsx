import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router";

export default function AgreeToTermsModal({ show, onAgree, onRefuse }) {
  return (
    <Modal show={show} onHide={onRefuse} centered>
      <Modal.Body>
        <p>
          Please{" "}
          <span>
            Agree to{" "}
            <Link
              to="/termsandprivacypolicy"
              style={{
                textDecoration: "underline",
                color: "#ADD8E6", // Light blue color
              }}
            >
              terms and conditions
            </Link>{" "}
            to proceed.
          </span>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onRefuse}>
          Decline
        </Button>
        <Button variant="primary" onClick={onAgree}>
          Agree
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
